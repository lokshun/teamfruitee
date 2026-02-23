import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.status !== "ACTIVE") {
    return new Response("Non autorisé", { status: 403 })
  }

  const { id } = await params

  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) {
    return new Response("Document introuvable", { status: 404 })
  }

  if (!document.allowedRoles.includes(session.user.role)) {
    return new Response("Accès refusé", { status: 403 })
  }

  return Response.redirect(document.shareUrl)
}
