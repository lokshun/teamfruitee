import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDocumentSchema } from "@/lib/validations/document"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { addedByUser: { select: { name: true } } },
  })

  return NextResponse.json(documents)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = addDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const document = await prisma.document.create({
    data: {
      ...parsed.data,
      addedBy: session.user.id,
    },
  })

  return NextResponse.json(document, { status: 201 })
}
