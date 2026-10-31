import Link from "next/link";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Logo } from "@/components/logo";
import { googleSignIn } from "@/app/auth-actions";
import styles from "./auth-page.module.css";

export function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const isSignIn = mode === "signin";

  return <main className={styles.page}>
    <div className={styles.layout}>
      <aside className={styles.brandPanel}>
        <Link href="/" className={styles.brand}><Logo /></Link>
        <div className={styles.brandCopy}>
          <span className={styles.eyebrow}>YOUR WORK, IN FOCUS</span>
          <h1>Make space for <em>better work.</em></h1>
          <p>Keep your deals, deliverables, and payments moving in one clear workspace.</p>
          <ul className={styles.benefits}>
            <li><Check size={16} /> Know what needs your attention</li>
            <li><Check size={16} /> Keep client work and payments together</li>
            <li><Check size={16} /> Plan your next move with confidence</li>
          </ul>
        </div>
        <div className={styles.brandFooter}><span>DEALS</span><i /><span>DELIVERABLES</span><i /><span>PAID</span></div>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.switchLink}>
          {isSignIn ? <><span>New to Cleared?</span> <Link href="/signup">Create an account</Link></> : <><span>Already have an account?</span> <Link href="/signin">Sign in</Link></>}
        </div>
        <div className={styles.formContent}>
          <span className={styles.eyebrow}>{isSignIn ? "WELCOME BACK" : "GET STARTED"}</span>
          <h2>{isSignIn ? "Good to have you back." : "Your clearer workday starts here."}</h2>
          <p className={styles.description}>{isSignIn ? "Sign in to pick up where you left off." : "Create your workspace with your Google account. It only takes a moment."}</p>
          <form action={googleSignIn}>
            <button type="submit" className={styles.googleButton}>
              <GoogleMark />
              <span>Continue with Google</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
          <div className={styles.divider}><span>SECURE SIGN-IN</span></div>
          <div className={styles.securityNote}><LockKeyhole size={15} /><span>Your account is protected by Google. Cleared never sees your Google password.</span></div>
        </div>
        <footer className={styles.formFooter}><Link href="/">Back to Cleared</Link><span>Clear work. Clear payments.</span></footer>
      </section>
    </div>
  </main>;
}

function GoogleMark() {
  return <svg className={styles.googleMark} viewBox="0 0 48 48" role="img" aria-label="Google">
    <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
    <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20 20 0 0 0 24 44Z" />
    <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z" />
    <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
  </svg>;
}
