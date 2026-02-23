import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { groupOrderSchema } from "@/lib/validations/order"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const orders = await prisma.groupOrder.findMany({
    include: {
      producer: { select: { name: true } },
      _count: { select: { memberOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = groupOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const { productIds, deliveryPointIds, paymentReferentIds, ...orderData } = parsed.data

  try {
    // Prisma ne permet pas de mélanger FK bruts (mode Unchecked) et relations
    // many-to-many implicites dans un même create. On crée d'abord la commande,
    // puis on connecte les points de livraison et référents paiement dans la même transaction.
    const groupOrder = await prisma.$transaction(async (tx) => {
      const created = await tx.groupOrder.create({
        data: {
          ...orderData,
          openDate: new Date(orderData.openDate),
          closeDate: new Date(orderData.closeDate),
          deliveryDate: new Date(orderData.deliveryDate),
          createdBy: session.user.id,
          products: {
            create: productIds.map((productId) => ({ productId })),
          },
        },
        include: {
          products: { include: { product: true } },
          producer: { select: { name: true } },
        },
      })

      // Prisma v7 : les relations M2M implicites ne fonctionnent pas via l'API
      // Prisma en mode Unchecked. On insère directement dans les tables de jointure.
      if (deliveryPointIds && deliveryPointIds.length > 0) {
        for (const dpId of deliveryPointIds) {
          await tx.$executeRaw`
            INSERT INTO "_GroupOrderDeliveryPoints" ("A", "B")
            VALUES (${dpId}, ${created.id})
            ON CONFLICT DO NOTHING
          `
        }
      }

      if (paymentReferentIds && paymentReferentIds.length > 0) {
        for (const userId of paymentReferentIds) {
          await tx.$executeRaw`
            INSERT INTO "_PaymentReferents" ("A", "B")
            VALUES (${created.id}, ${userId})
            ON CONFLICT DO NOTHING
          `
        }
      }

      return created
    })

    return NextResponse.json(groupOrder, { status: 201 })
  } catch (err) {
    console.error("[POST /api/coordinator/group-orders]", err)
    return NextResponse.json({ error: "Erreur lors de la création de la commande groupée" }, { status: 500 })
  }
}
