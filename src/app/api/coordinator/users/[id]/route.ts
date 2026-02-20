import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
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
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, email: true, name: true, status: true },
  })

  // Envoyer email de bienvenue si activation
  if (parsed.data.status === "ACTIVE" && user.status === "PENDING") {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@groupement-achat.fr",
        to: user.email,
        subject: "Votre compte a été validé — Team Fruitée",
        html: `
          <h2>Bienvenue ${user.name} !</h2>
          <p>Votre compte a été validé par un coordinateur. Vous pouvez maintenant vous connecter et passer des commandes.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Se connecter</a>
        `,
      })
    }
  }

  return NextResponse.json(updated)
}
