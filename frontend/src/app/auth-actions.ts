"use server";
import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/onboarding" });
}
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
