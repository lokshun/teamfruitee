import type { NextAuthConfig } from "next-auth"

/**
 * Config NextAuth minimale — Edge Runtime compatible (pas d'import Prisma).
 * Utilisée dans le middleware (proxy.ts).
 * La config complète avec adaptateur Prisma est dans auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=true",
    error: "/login?error=true",
    newUser: "/register",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = (user as { id?: string }).id
        token.role = (user as { role?: string }).role
        token.status = (user as { status?: string }).status
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.status = token.status as string
      }
      return session
    },
  },
  providers: [],
}
