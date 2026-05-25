import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { CoordinatorSidebar } from "@/components/coordinator/sidebar"

const coordinatorNavItems = [
  { href: "/coordinator/dashboard", label: "Tableau de bord" },
  { href: "/commandes-groupees", label: "Commandes groupées" },
  { href: "/member/catalogue", label: "Commander" },
  { href: "/paiements", label: "Paiements" },
  { href: "/membres", label: "Membres" },
  { href: "/coordinator/producteurs", label: "Producteurs" },
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <div className="hidden md:flex">
        <CoordinatorSidebar userName={session.user.name} />
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar mobile uniquement */}
        <div className="md:hidden">
          <Navbar items={coordinatorNavItems} userName={session.user.name} />
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
