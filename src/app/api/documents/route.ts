import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const role = session.user.role

  const documents = await prisma.document.findMany({
    where: { allowedRoles: { has: role } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      allowedRoles: true,
      createdAt: true,
      addedByUser: { select: { name: true } },
    },
  })

  return NextResponse.json(documents)
}
