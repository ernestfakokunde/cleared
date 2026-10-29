"use server";
import { signIn } from "@/auth";

export async function emailSignIn(formData: FormData) {
  await signIn("resend", formData);
}
export async function googleSignIn() {
  await signIn("google", { redirectTo: "/onboarding" });
}
