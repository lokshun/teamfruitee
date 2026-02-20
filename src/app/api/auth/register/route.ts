import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, name, commune, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        commune,
        hashedPassword,
        role: "MEMBER",
        status: "PENDING",
      },
    })

    // Notifier les coordinateurs
    const coordinators = await prisma.user.findMany({
      where: { role: "COORDINATOR", status: "ACTIVE" },
      select: { email: true },
    })

    if (coordinators.length > 0 && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@groupement-achat.fr",
        to: coordinators.map((c) => c.email),
        subject: `Nouvelle demande d'inscription — ${name}`,
        html: `
          <h2>Nouvelle demande d'inscription</h2>
          <p><strong>${name}</strong> (${email}) souhaite rejoindre Team Fruitée.</p>
          <p>Commune : ${commune}</p>
          <p>Connectez-vous au tableau de bord pour valider ou refuser cette demande.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/membres">Gérer les membres</a>
        `,
      })
    }

    return NextResponse.json(
      { message: "Inscription réussie. Votre compte est en attente de validation." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[REGISTER]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
