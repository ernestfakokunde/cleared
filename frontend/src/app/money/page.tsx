import Link from "next/link";
import { ArrowRight, FileText, UsersRound } from "lucide-react";
import { AppShell } from "../app-shell";
import { MoneyNav } from "./money-nav";
import { Card } from "@/components/ui";

export default function MoneyPage() {
  return <AppShell><div className="page-heading"><div><div className="eyebrow">Your money</div><h1 className="page-title">Money</h1><p className="subtle">A clear view of invoices, clients, and income.</p></div></div><MoneyNav active="Overview" /><div className="money-overview-grid"><Card><div className="money-card-icon"><FileText size={18} /></div><h2 className="panel-title">Invoices</h2><p className="subtle">Create invoices from your deals, then keep track of what is due and paid.</p><Link href="/invoices" className="text-link">View invoices <ArrowRight size={14} /></Link></Card><Card><div className="money-card-icon"><UsersRound size={18} /></div><h2 className="panel-title">Clients</h2><p className="subtle">See the people and businesses attached to your work.</p><Link href="/money/clients" className="text-link">View clients <ArrowRight size={14} /></Link></Card></div></AppShell>;
}
