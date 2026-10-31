import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized: ({ auth, request }) => {
      const path = request.nextUrl.pathname;
      const publicPath = path === "/" || path === "/pricing" || path === "/signin" || path === "/signup"
        || path.startsWith("/api/auth/") || path.startsWith("/api/cron/") || path.startsWith("/i/");
      return publicPath || Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
