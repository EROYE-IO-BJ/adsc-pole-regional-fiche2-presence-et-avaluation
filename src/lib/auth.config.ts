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

      // Public API endpoints for POST
      if (pathname === "/api/presences" || pathname === "/api/retours") {
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
        token.serviceId = (user as any).serviceId ?? null;
        token.serviceName = (user as any).serviceName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as any;
        session.user.serviceId = (token.serviceId as string) ?? null;
        session.user.serviceName = (token.serviceName as string) ?? null;
      }
      return session;
    },
  },
};
