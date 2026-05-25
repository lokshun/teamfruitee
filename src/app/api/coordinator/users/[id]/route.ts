import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { z } from "zod"

const resend = new Resend(process.env.RESEND_API_KEY)

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
  role: z.enum(["MEMBER", "COORDINATOR"]).optional(),
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
    data: {
      status: parsed.data.status,
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
    },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, role: true },
  })

  // Envoyer email de bienvenue si activation depuis PENDING
  if (parsed.data.status === "ACTIVE" && user.status === "PENDING") {
    const newRole = parsed.data.role ?? user.role
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const roleLabel = newRole === "COORDINATOR" ? "coordinateur" : "acheteur"
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    const roleDescription =
      newRole === "COORDINATOR"
        ? "Vous avez accès au tableau de bord coordinateur pour gérer les commandes groupées, les membres et les producteurs."
        : "Vous pouvez maintenant parcourir le catalogue, passer des commandes et suivre vos livraisons."

    if (process.env.RESEND_API_KEY) {
      try { await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@groupement-achat.fr",
        to: user.email,
        subject: "Votre compte a été validé — Team Fruitée",
        html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#16a34a;padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🌿 Team Fruitée</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Bienvenue, ${displayName}&nbsp;!</h2>
            <p style="margin:0 0 16px;color:#374151;line-height:1.6;">
              Votre demande d'inscription a été acceptée par un coordinateur. Votre compte est désormais actif en tant que <strong>${roleLabel}</strong>.
            </p>
            <p style="margin:0 0 32px;color:#374151;line-height:1.6;">${roleDescription}</p>
            <a href="${appUrl}/login"
               style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:15px;">
              Se connecter
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:13px;">
              Cet email a été envoyé automatiquement. Ne pas répondre directement à ce message.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }) } catch (emailErr) {
        console.error("[ACTIVATION_EMAIL]", emailErr)
      }
    }
  }

  return NextResponse.json(updated)
}

const editSchema = z.object({
  firstName: z.string().optional().default(""),
  lastName: z.string().min(1),
  email: z.string().email(),
  commune: z.string().optional().nullable(),
  role: z.enum(["MEMBER", "COORDINATOR", "PRODUCER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = editSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const emailConflict = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  })
  if (emailConflict) {
    return NextResponse.json({ error: "Cet email est déjà utilisé par un autre compte" }, { status: 409 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName ?? "",
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      commune: parsed.data.commune ?? null,
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, role: true, commune: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { memberOrders: true } } },
  })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }
  if (user._count.memberOrders > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un membre ayant des commandes. Désactivez son compte à la place." },
      { status: 409 }
    )
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
