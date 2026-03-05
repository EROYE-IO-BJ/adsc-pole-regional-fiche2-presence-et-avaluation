import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Prisma/bcrypt imports)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/connexion",
  },
  providers: [], // Providers added in auth.ts (server-only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes
      if (
        pathname.startsWith("/p/") ||
        pathname.startsWith("/connexion") ||
        pathname.startsWith("/inscription") ||
        pathname.startsWith("/verifier-email") ||
        pathname.startsWith("/invitation/") ||
        pathname === "/" ||
        pathname.startsWith("/api/auth")
      ) {
        return true;
      }

      // Public API endpoints
      if (
        pathname === "/api/presences" ||
        pathname === "/api/retours" ||
        pathname === "/api/seed" ||
        pathname === "/api/seed-data" ||
        pathname === "/api/activites/by-token"
      ) {
        return true;
      }

      // All other routes require auth
      if (!isLoggedIn) {
        return false; // Redirect to signIn page
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
};
