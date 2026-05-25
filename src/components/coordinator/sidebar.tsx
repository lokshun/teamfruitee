"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  ShoppingBag,
  Users,
  MapPin,
  CreditCard,
  FileText,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/coordinator/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/commandes-groupees", label: "Commandes groupées", icon: ShoppingCart },
  { href: "/member/catalogue", label: "Commander", icon: ShoppingBag },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
  { href: "/membres", label: "Membres", icon: Users },
  { href: "/coordinator/producteurs", label: "Producteurs", icon: Store },
  { href: "/points-livraison", label: "Points de livraison", icon: MapPin },
  { href: "/documents", label: "Documents", icon: FileText },
]

interface CoordinatorSidebarProps {
  userName?: string | null
}

export function CoordinatorSidebar({ userName }: CoordinatorSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-sm">🍓 Team Fruitée</p>
        <span className="mt-1 inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Coordinateur
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Utilisateur + déconnexion */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        {userName && (
          <p className="px-3 py-1 text-xs text-gray-400 truncate">{userName}</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
