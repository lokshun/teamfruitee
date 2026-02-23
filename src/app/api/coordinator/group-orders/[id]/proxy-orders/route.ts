import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { proxyOrderSchema } from "@/lib/validations/order"
import { computeLineTotal, computeOrderTotal } from "@/lib/price-utils"
import type { Prisma } from "@/generated/prisma/client"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id: groupOrderId } = await params
  const body = await req.json()
  const parsed = proxyOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const { userId, proxyBuyerName, deliveryPointId, notes, lines } = parsed.data

  try {
    const memberOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Guard : vérifier que la commande groupée est ouverte
      const groupOrder = await tx.groupOrder.findUniqueOrThrow({
        where: { id: groupOrderId },
        include: {
          products: { include: { product: true } },
        },
      })

      if (groupOrder.status !== "OPEN") {
        throw new Error("GROUP_ORDER_NOT_OPEN")
      }

      // Vérifier qu'une commande n'existe pas déjà pour ce membre (si userId fourni)
      if (userId) {
        const existing = await tx.memberOrder.findFirst({
          where: { groupOrderId, userId },
        })
        if (existing) {
          throw new Error("ORDER_ALREADY_EXISTS")
        }
      }

      // Préparer les lignes avec snapshot des prix
      const linesWithPrices = lines.map((line) => {
        const gop = groupOrder.products.find(
          (p: { id: string; priceOverride: unknown; product: { priceWithTransport: unknown } }) =>
            p.id === line.groupOrderProductId
        )
        if (!gop) throw new Error(`PRODUCT_NOT_FOUND:${line.groupOrderProductId}`)

        const unitPrice = Number(gop.priceOverride ?? gop.product.priceWithTransport)
        const lineTotal = computeLineTotal(line.quantity, unitPrice)

        return {
          groupOrderProductId: line.groupOrderProductId,
          quantity: line.quantity,
          unitPrice,
          lineTotal,
        }
      })

      const totalAmount = computeOrderTotal(
        linesWithPrices.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice }))
      )

      const order = await tx.memberOrder.create({
        data: {
          groupOrderId,
          userId: userId ?? null,
          proxyBuyerName: proxyBuyerName ?? null,
          placedByCoordinatorId: session.user.id,
          deliveryPointId,
          notes,
          totalAmount,
          orderLines: {
            create: linesWithPrices,
          },
        },
        include: {
          orderLines: true,
          deliveryPoint: { select: { name: true } },
          user: { select: { id: true, name: true } },
        },
      })

      return order
    })

    return NextResponse.json(memberOrder, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "GROUP_ORDER_NOT_OPEN") {
      return NextResponse.json({ error: "Cette commande groupée n'est pas ouverte." }, { status: 409 })
    }
    if (message === "ORDER_ALREADY_EXISTS") {
      return NextResponse.json({ error: "Ce membre a déjà une commande pour cette commande groupée." }, { status: 409 })
    }
    console.error("[COORDINATOR_PROXY_ORDER_POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
