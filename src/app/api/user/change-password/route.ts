import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hashedPassword, mustChangePassword: false },
  })

  return NextResponse.json({ success: true })
}
