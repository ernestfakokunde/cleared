"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { CalendarCheck2, ChevronDown, CircleHelp, FileText, Receipt, Settings2, Sparkles, Sun, Target, UsersRound, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { signOutAction } from "./auth-actions";

const nav = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/deals", label: "Deals", icon: UsersRound },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/review", label: "Weekly review", icon: CalendarCheck2 },
  { href: "/ai", label: "Ask Cleared", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const currentSection = nav.find(item => path === item.href || path.startsWith(`${item.href}/`) || (item.href === "/money" && path.startsWith("/money/")));
  return <div className="app-frame">
    <aside className="sidebar"><Link href="/today" className="brand-link"><Logo /></Link><nav className="side-nav">{nav.map(({ href, label, icon: Icon }, index) => <Fragment key={href}>{index === 6 && <div className="nav-group-label">Plan & focus</div>}<Link href={href} aria-current={path === href || path.startsWith(`${href}/`) ? "page" : undefined} className={`nav-link ${path === href || path.startsWith(`${href}/`) ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} />{label}</Link></Fragment>)}</nav><div className="sidebar-bottom"><Link href="/help" className="nav-link"><CircleHelp size={18} strokeWidth={1.8} />Help and support</Link><form action={signOutAction}><button className="profile-button" type="submit"><span className="avatar">✓</span><span className="profile-name">Signed in<small>Sign out</small></span><ChevronDown size={16} /></button></form></div></aside>
    <div className="main-column"><header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{currentSection?.label ?? "Cleared"}</strong></div><Link className="icon-button" href="/ai" aria-label="Ask Cleared and AI tools"><Sparkles size={17} /></Link></header><main className="app-content">{children}</main></div>
  </div>;
}
