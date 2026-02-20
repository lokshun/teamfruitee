import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { producerSchema } from "@/lib/validations/producer"
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

  // Permet de mettre à jour isActive seul ou les champs du schéma
  const updateSchema = producerSchema.partial().extend({ isActive: z.boolean().optional() })
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const producer = await prisma.producer.update({
    where: { id },
    data: {
      ...parsed.data,
      contactEmail: parsed.data.contactEmail || null,
    },
  })

  return NextResponse.json(producer)
}
