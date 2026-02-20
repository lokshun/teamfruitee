import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const deliveryPointSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  commune: z.string().min(2),
})

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const points = await prisma.deliveryPoint.findMany({
    where: { isActive: true },
    orderBy: { commune: "asc" },
  })

  return NextResponse.json(points)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = deliveryPointSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const point = await prisma.deliveryPoint.create({ data: parsed.data })
  return NextResponse.json(point, { status: 201 })
}
