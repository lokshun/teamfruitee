import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { producerSchema } from "@/lib/validations/producer"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const producers = await prisma.producer.findMany({
    include: {
      _count: { select: { products: true, groupOrders: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(producers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = producerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }

  const producer = await prisma.producer.create({
    data: {
      ...parsed.data,
      contactEmail: parsed.data.contactEmail || null,
    },
  })

  return NextResponse.json(producer, { status: 201 })
}
