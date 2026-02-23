import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { kdriveList } from "@/lib/kdrive"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "COORDINATOR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId") ?? process.env.KDRIVE_ROOT_PATH ?? "/"

  try {
    const files = await kdriveList(folderId)
    return NextResponse.json(files)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[GET /api/coordinator/kdrive/browse]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
