import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateDocumentSchema } from "@/lib/validations/document"

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
  const parsed = updateDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }

  const updated = await prisma.document.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
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

  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }

  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
