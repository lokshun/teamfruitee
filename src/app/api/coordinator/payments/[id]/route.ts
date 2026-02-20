import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paymentSchema = z.object({
  paymentStatus: z.enum(["NOT_PAID", "PARTIAL", "PAID"]),
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
  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const order = await prisma.memberOrder.update({
    where: { id },
    data: { paymentStatus: parsed.data.paymentStatus },
    select: { id: true, paymentStatus: true, totalAmount: true },
  })

  return NextResponse.json(order)
}
