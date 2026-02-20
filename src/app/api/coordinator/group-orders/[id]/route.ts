import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateGroupOrderSchema = z.object({
  title: z.string().min(2).optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  deliveryPointIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).min(1).optional(),
  minOrderAmount: z.number().min(0).nullable().optional(),
  transportUserId: z.string().nullable().optional(),
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
  const parsed = updateGroupOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.groupOrder.findUnique({ where: { id }, select: { status: true } })
  if (!existing) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }
  if (existing.status === "CLOSED" || existing.status === "DELIVERED") {
    return NextResponse.json({ error: "Impossible de modifier une commande clôturée ou livrée." }, { status: 409 })
  }

  const { openDate, closeDate, deliveryDate, deliveryPointIds, productIds, minOrderAmount, transportUserId, ...rest } = parsed.data

  try {
    const groupOrder = await prisma.$transaction(async (tx) => {
      // 1. Mise à jour des champs scalaires
      const updated = await tx.groupOrder.update({
        where: { id },
        data: {
          ...rest,
          ...(openDate ? { openDate: new Date(openDate) } : {}),
          ...(closeDate ? { closeDate: new Date(closeDate) } : {}),
          ...(deliveryDate ? { deliveryDate: new Date(deliveryDate) } : {}),
          ...(minOrderAmount !== undefined ? { minOrderAmount: minOrderAmount ?? null } : {}),
          ...(transportUserId !== undefined ? { transportUserId: transportUserId || null } : {}),
        },
      })

      // 2. Points de livraison via SQL brut (Prisma v7 : M2M implicites
      // non supportées en mode Unchecked)
      if (deliveryPointIds !== undefined) {
        await tx.$executeRaw`DELETE FROM "_GroupOrderDeliveryPoints" WHERE "B" = ${id}`
        for (const dpId of deliveryPointIds) {
          await tx.$executeRaw`
            INSERT INTO "_GroupOrderDeliveryPoints" ("A", "B")
            VALUES (${dpId}, ${id})
            ON CONFLICT DO NOTHING
          `
        }
      }

      // 3. Gestion des produits
      if (productIds !== undefined) {
        const currentProducts = await tx.groupOrderProduct.findMany({
          where: { groupOrderId: id },
          select: { id: true, productId: true, _count: { select: { orderLines: true } } },
        })

        const currentProductIdList = currentProducts.map((p) => p.productId)
        const toAdd = productIds.filter((pid) => !currentProductIdList.includes(pid))
        const toRemove = currentProducts.filter((p) => !productIds.includes(p.productId))
        const cannotRemove = toRemove.filter((p) => p._count.orderLines > 0)

        if (cannotRemove.length > 0) {
          throw Object.assign(new Error("ORDERED_PRODUCTS"), { code: "ORDERED_PRODUCTS" })
        }

        if (toAdd.length > 0) {
          await tx.groupOrderProduct.createMany({
            data: toAdd.map((productId) => ({ groupOrderId: id, productId })),
          })
        }

        const removeIds = toRemove.map((p) => p.id)
        if (removeIds.length > 0) {
          await tx.groupOrderProduct.deleteMany({ where: { id: { in: removeIds } } })
        }
      }

      return updated
    })

    return NextResponse.json(groupOrder)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ORDERED_PRODUCTS") {
      return NextResponse.json(
        { error: "Certains produits ne peuvent pas être retirés car ils ont déjà été commandés." },
        { status: 409 }
      )
    }
    console.error("[PATCH /api/coordinator/group-orders/[id]]", err)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
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

  const orderCount = await prisma.memberOrder.count({ where: { groupOrderId: id } })
  if (orderCount > 0) {
    return NextResponse.json(
      { error: "Cette commande groupée contient des commandes membres et ne peut pas être supprimée." },
      { status: 409 }
    )
  }

  await prisma.groupOrder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || !["COORDINATOR", "PRODUCER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      producer: true,
      products: {
        include: { product: true },
      },
      memberOrders: {
        include: {
          user: { select: { id: true, name: true, commune: true } },
          deliveryPoint: { select: { name: true, commune: true } },
          orderLines: {
            include: {
              groupOrderProduct: {
                include: { product: { select: { name: true, unitType: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!groupOrder) {
    return NextResponse.json({ error: "Commande groupée introuvable" }, { status: 404 })
  }

  return NextResponse.json(groupOrder)
}
