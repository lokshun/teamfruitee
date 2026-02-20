import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { computeLineTotal, computeOrderTotal } from "@/lib/price-utils"

const updateLinesSchema = z.object({
  lines: z.array(z.object({
    groupOrderProductId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
  deliveryPointId: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "MEMBER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateLinesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.memberOrder.findUniqueOrThrow({
        where: { id, userId: session.user.id },
        include: { groupOrder: { include: { products: { include: { product: true } } } } },
      })

      if (order.groupOrder.status !== "OPEN" || new Date() > order.groupOrder.closeDate) {
        throw new Error("ORDER_CLOSED")
      }

      // Supprimer les anciennes lignes et recréer
      await tx.orderLine.deleteMany({ where: { memberOrderId: id } })

      const linesWithPrices = parsed.data.lines.map((line) => {
        const gop = order.groupOrder.products.find((p) => p.id === line.groupOrderProductId)
        if (!gop) throw new Error("PRODUCT_NOT_FOUND")
        const unitPrice = Number(gop.priceOverride ?? gop.product.priceWithTransport)
        return { groupOrderProductId: line.groupOrderProductId, quantity: line.quantity, unitPrice, lineTotal: computeLineTotal(line.quantity, unitPrice) }
      })

      const totalAmount = computeOrderTotal(linesWithPrices.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })))

      return tx.memberOrder.update({
        where: { id },
        data: {
          totalAmount,
          deliveryPointId: parsed.data.deliveryPointId,
          notes: parsed.data.notes,
          orderLines: { create: linesWithPrices },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "ORDER_CLOSED") {
      return NextResponse.json({ error: "La commande est clôturée." }, { status: 409 })
    }
    console.error("[MEMBER_ORDER_PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "MEMBER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const order = await prisma.memberOrder.findUnique({
    where: { id, userId: session.user.id },
    include: { groupOrder: true },
  })

  if (!order) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  if (order.groupOrder.status !== "OPEN" || new Date() > order.groupOrder.closeDate) {
    return NextResponse.json({ error: "La commande est clôturée." }, { status: 409 })
  }

  await prisma.memberOrder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
