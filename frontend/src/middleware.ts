import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Temporary local review mode: application pages are browsable without a session.
// API routes continue to enforce authentication in their handlers.
export const { auth: middleware } = NextAuth({ ...authConfig, callbacks: { ...authConfig.callbacks, authorized: () => true } });
