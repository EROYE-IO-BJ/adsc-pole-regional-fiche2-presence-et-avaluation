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
        token.serviceId = (user as any).serviceId;
        token.serviceName = (user as any).serviceName;
        token.serviceType = (user as any).serviceType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).serviceId = token.serviceId;
        (session.user as any).serviceName = token.serviceName;
        (session.user as any).serviceType = token.serviceType;
      }
      return session;
    },
  },
};
