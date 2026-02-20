import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations/producer"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const products = await prisma.product.findMany({
    where: { producerId: id },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(products)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id: producerId } = await params
  const body = await req.json()

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const { producerId: _ignored, ...data } = parsed.data as typeof parsed.data & { producerId?: string }

  const product = await prisma.product.create({
    data: {
      ...data,
      producerId,
      description: data.description || null,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
