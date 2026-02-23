"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

interface NavItem {
  href: string
  label: string
}

interface NavbarProps {
  items: NavItem[]
  userName?: string | null
}

export function Navbar({ items, userName }: NavbarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">

          {/* Logo + liens desktop */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-green-600 font-bold text-base sm:text-lg mr-2 sm:mr-4 whitespace-nowrap shrink-0">
              🍓 Team Fruitée
            </span>
            <div className="hidden md:flex items-center gap-1 overflow-x-auto">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    pathname.startsWith(item.href)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Droite : nom + déconnexion (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userName && (
              <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[140px]">
                {userName}
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden md:block text-sm text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
            >
              Déconnexion
            </button>
            {/* Hamburger */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            {userName && (
              <span className="text-sm text-gray-500 truncate mr-3">{userName}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
