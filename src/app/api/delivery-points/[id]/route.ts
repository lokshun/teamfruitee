import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(2).optional(),
  commune: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const point = await prisma.deliveryPoint.update({ where: { id }, data: parsed.data })
  return NextResponse.json(point)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reassignToId = typeof body?.reassignToId === "string" ? body.reassignToId : undefined

  const orderCount = await prisma.memberOrder.count({ where: { deliveryPointId: id } })

  if (orderCount > 0 && !reassignToId) {
    return NextResponse.json(
      {
        error: "Ce point de livraison est utilisé par des commandes.",
        needsReassign: true,
        orderCount,
      },
      { status: 409 }
    )
  }

  if (orderCount > 0 && reassignToId) {
    if (reassignToId === id) {
      return NextResponse.json({ error: "Le point de remplacement doit être différent." }, { status: 400 })
    }
    const target = await prisma.deliveryPoint.findUnique({ where: { id: reassignToId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: "Point de remplacement introuvable." }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const affectedOrders = await tx.memberOrder.findMany({
        where: { deliveryPointId: id },
        select: { groupOrderId: true },
        distinct: ["groupOrderId"],
      })

      for (const { groupOrderId } of affectedOrders) {
        await tx.$executeRaw`
          INSERT INTO "_GroupOrderDeliveryPoints" ("A", "B")
          VALUES (${reassignToId}, ${groupOrderId})
          ON CONFLICT DO NOTHING
        `
      }

      await tx.memberOrder.updateMany({
        where: { deliveryPointId: id },
        data: { deliveryPointId: reassignToId },
      })

      await tx.deliveryPoint.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  }

  await prisma.deliveryPoint.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
