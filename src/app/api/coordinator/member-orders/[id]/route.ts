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
  paymentReferentId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CHECK", "TRANSFER"]).optional(),
  notes: z.string().optional(),
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
  const parsed = updateLinesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.memberOrder.findUniqueOrThrow({
        where: { id },
        include: { groupOrder: { include: { products: { include: { product: true } } } } },
      })

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
          ...(parsed.data.deliveryPointId ? { deliveryPointId: parsed.data.deliveryPointId } : {}),
          ...(parsed.data.paymentReferentId !== undefined ? { paymentReferentId: parsed.data.paymentReferentId || null } : {}),
          ...(parsed.data.paymentMethod !== undefined ? { paymentMethod: parsed.data.paymentMethod || null } : {}),
          ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
          orderLines: { create: linesWithPrices },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produit introuvable dans le catalogue de cette commande groupée." }, { status: 400 })
    }
    console.error("[COORDINATOR_MEMBER_ORDER_PATCH]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const order = await prisma.memberOrder.findUnique({ where: { id } })
  if (!order) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  }

  await prisma.memberOrder.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
