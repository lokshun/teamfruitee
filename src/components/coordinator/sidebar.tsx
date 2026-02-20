"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Users,
  MapPin,
  CreditCard,
  LogOut,
  Leaf,
} from "lucide-react"

const navItems = [
  { href: "/coordinator/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/coordinator/producteurs", label: "Producteurs", icon: Store },
  { href: "/coordinator/commandes", label: "Commandes groupées", icon: ShoppingCart },
  { href: "/coordinator/membres", label: "Membres", icon: Users },
  { href: "/coordinator/livraisons", label: "Points de livraison", icon: MapPin },
  { href: "/coordinator/paiements", label: "Suivi paiements", icon: CreditCard },
]

export function CoordinatorSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Team Fruitée</p>
          </div>
        </div>
        <span className="mt-2 inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Coordinateur
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Déconnexion */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
