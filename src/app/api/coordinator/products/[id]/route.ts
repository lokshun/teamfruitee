import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations/producer"
import { z } from "zod"

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
  const updateSchema = productSchema.partial().extend({ isActive: z.boolean().optional() })
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const product = await prisma.product.update({ where: { id }, data: parsed.data })
  return NextResponse.json(product)
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

  // Vérifier qu'il n'y a pas de lignes de commande liées
  const usedInOrders = await prisma.groupOrderProduct.count({ where: { productId: id } })
  if (usedInOrders > 0) {
    return NextResponse.json(
      { error: "Ce produit est utilisé dans des commandes groupées et ne peut pas être supprimé. Désactivez-le à la place." },
      { status: 409 }
    )
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
