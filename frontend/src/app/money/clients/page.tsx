import Link from "next/link";
import { AppShell } from "../../app-shell";
import { MoneyNav } from "../money-nav";
import { Card } from "@/components/ui";
export default function ClientsPage() { return <AppShell><div className="page-heading"><div><div className="eyebrow">Money / Clients</div><h1 className="page-title">Clients</h1><p className="subtle">Clients are added when you create a deal or invoice.</p></div></div><MoneyNav active="Clients" /><Card className="today-empty"><h2>Your clients live with your work.</h2><p>Once you add a deal, its client and invoicing contact will be available here.</p><Link href="/deals/new" className="button secondary">Add a deal</Link></Card></AppShell>; }
