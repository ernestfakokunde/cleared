import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized: ({ auth }) => Boolean(auth?.user),
  },
} satisfies NextAuthConfig;
