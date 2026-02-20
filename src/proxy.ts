import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Routes publiques : toujours accessibles
  const publicPaths = ["/login", "/register", "/pending-validation", "/unauthorized"]
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Non authentifié
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Membre en attente de validation
  if (session.user.status === "PENDING") {
    if (!pathname.startsWith("/pending-validation")) {
      return NextResponse.redirect(new URL("/pending-validation", req.url))
    }
    return NextResponse.next()
  }

  // Compte inactif
  if (session.user.status === "INACTIVE") {
    return NextResponse.redirect(new URL("/login?error=inactive", req.url))
  }

  // Protection par rôle
  if (pathname.startsWith("/coordinator") && session.user.role !== "COORDINATOR") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  if (pathname.startsWith("/producer") && session.user.role !== "PRODUCER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  if (pathname.startsWith("/member") && session.user.role !== "MEMBER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
