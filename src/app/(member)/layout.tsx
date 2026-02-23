import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"

const memberNavItems = [
  { href: "/member/catalogue", label: "Catalogue" },
  { href: "/member/commandes", label: "Mes commandes" },
  { href: "/member/calendrier", label: "Calendrier" },
  { href: "/member/historique", label: "Historique" },
  { href: "/member/documents", label: "Documents" },
]

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "MEMBER" || session.user.status !== "ACTIVE") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar items={memberNavItems} userName={session.user.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
