"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppShell } from "../app-shell";
import { Badge, Card } from "@/components/ui";
type Deal = { id: string; title: string; amountCents: number; currency: string; stage: string; client?: { name: string } | null; deliverables: { dueOn: string | null; doneAt: string | null }[] };
export default function DealsPage() {
 const [deals, setDeals] = useState<Deal[]>([]); const [q, setQ] = useState(""); const [error, setError] = useState("");
 useEffect(() => { fetch("/api/deals").then(r => r.json()).then(d => { if (Array.isArray(d)) setDeals(d); else setError("Sign in to see your deals. You can still review the app pages without an account."); }).catch(() => setError("Couldn't load deals.")); }, []);
 const filtered = deals.filter(d => `${d.title} ${d.client?.name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
 return <AppShell><div className="page-heading"><div><div className="eyebrow">Your work</div><h1 className="page-title">Deals</h1><p className="subtle">Keep every conversation and deliverable moving.</p></div><Link className="button" href="/deals/new"><Plus size={17} /> Add a deal</Link></div><Card className="list-card"><div className="list-toolbar"><label className="search-box"><Search size={17} /><input placeholder="Search deals or clients" value={q} onChange={e => setQ(e.target.value)} /></label></div>{error && <p className="doc-error">{error}</p>}<div className="table-scroll"><table><thead><tr><th>Deal</th><th>Stage</th><th>Amount</th><th>Next deliverable</th></tr></thead><tbody>{filtered.map(deal => { const next = deal.deliverables.find(d => !d.doneAt && d.dueOn); return <tr key={deal.id}><td><Link href={`/deals/${deal.id}`} className="deal-link"><strong>{deal.title}</strong><small>{deal.client?.name ?? "No client"}</small></Link></td><td><Badge tone={deal.stage === "Paid" ? "accent" : deal.stage === "Pitched" ? "warn" : "outline"}>{deal.stage}</Badge></td><td className="amount-cell">{new Intl.NumberFormat(undefined, { style: "currency", currency: deal.currency }).format(deal.amountCents / 100)}</td><td>{next?.dueOn ? new Date(next.dueOn).toLocaleDateString() : "—"}</td></tr>; })}</tbody></table></div>{!filtered.length && !error && <div className="empty-state"><p>No deals yet.</p><Link className="button" href="/deals/new">Add your first deal</Link></div>}</Card></AppShell>;
}
