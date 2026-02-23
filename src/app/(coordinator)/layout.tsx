import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"

const coordinatorNavItems = [
  { href: "/coordinator/dashboard", label: "Tableau de bord" },
  { href: "/coordinator/producteurs", label: "Producteurs" },
  { href: "/commandes-groupees", label: "Commandes groupées" },
  { href: "/paiements", label: "Paiements" },
  { href: "/membres", label: "Membres" },
  { href: "/points-livraison", label: "Points de livraison" },
  { href: "/documents", label: "Documents" },
]

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "COORDINATOR") {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar items={coordinatorNavItems} userName={session.user.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
