import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateOrderExcel } from "@/lib/export-utils"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || !["COORDINATOR", "PRODUCER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await params

  try {
    const buffer = await generateOrderExcel(id)
    return new Response(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="commande-${id}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("[EXPORT_EXCEL]", error)
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 })
  }
}
