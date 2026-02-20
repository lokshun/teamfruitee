import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.status === "PENDING") {
    redirect("/pending-validation")
  }

  switch (session.user.role) {
    case "COORDINATOR":
      redirect("/coordinator/dashboard")
    case "PRODUCER":
      redirect("/producer/mes-commandes")
    case "MEMBER":
    default:
      redirect("/member/catalogue")
  }
}
