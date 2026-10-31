"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, UsersRound } from "lucide-react";
import { AppShell } from "../app-shell";
import { Badge, Card } from "@/components/ui";

type Deal = { id: string; title: string; amountCents: number; currency: string; stage: string; client?: { name: string } | null; deliverables: { dueOn: string | null; doneAt: string | null }[] };

function money(deal: Deal) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: deal.currency }).format(deal.amountCents / 100);
}
function nextDue(deal: Deal) {
  const next = deal.deliverables.find(deliverable => !deliverable.doneAt && deliverable.dueOn);
  return next?.dueOn ? new Date(next.dueOn).toLocaleDateString() : "No upcoming deliverable";
}
function stageTone(stage: string) {
  return stage === "Paid" ? "accent" : stage === "Pitched" ? "warn" : "outline";
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deals", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error(data.error ?? "Couldn't load your deals.");
        setDeals(data);
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : "Couldn't load your deals."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = deals.filter(deal => `${deal.title} ${deal.client?.name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const toolbar = <div className="list-toolbar"><label className="search-box"><Search size={17} /><input aria-label="Search deals or clients" placeholder="Search deals or clients" value={q} onChange={event => setQ(event.target.value)} /></label><span className="list-count">{filtered.length} {filtered.length === 1 ? "deal" : "deals"}</span></div>;

  return <AppShell>
    <div className="page-heading"><div><div className="eyebrow">Your work</div><h1 className="page-title">Deals</h1><p className="subtle">Keep every conversation and deliverable moving.</p></div><Link className="button" href="/deals/new"><Plus size={17} /> Add a deal</Link></div>
    <Card className="list-card">
      {toolbar}
      {error && <div className="empty-list-state" role="alert"><strong>Deals couldn’t load</strong><p>{error}</p><button className="button secondary" onClick={() => window.location.reload()}>Try again</button></div>}
      {!error && loading && <div className="empty-list-state"><p>Loading your deals…</p></div>}
      {!error && !loading && !filtered.length && <div className="empty-list-state"><span className="empty-list-icon"><UsersRound size={20} /></span><strong>{q ? "No matching deals" : "No deals yet"}</strong><p>{q ? "Try another search, or clear the search to see all your deals." : "Add a deal to track its client, value, and next deliverable in one place."}</p>{q ? <button className="button secondary" onClick={() => setQ("")}>Clear search</button> : <Link className="button" href="/deals/new"><Plus size={16} /> Add your first deal</Link>}</div>}
      {!error && !loading && filtered.length > 0 && <>
        <div className="table-scroll deals-desktop-list"><table><thead><tr><th>Deal</th><th>Stage</th><th>Amount</th><th>Next deliverable</th></tr></thead><tbody>{filtered.map(deal => <tr key={deal.id}><td><Link href={`/deals/${deal.id}`} className="deal-link"><strong>{deal.title}</strong><small>{deal.client?.name ?? "No client"}</small></Link></td><td><Badge tone={stageTone(deal.stage)}>{deal.stage}</Badge></td><td className="amount-cell">{money(deal)}</td><td>{nextDue(deal)}</td></tr>)}</tbody></table></div>
        <div className="compact-record-list">{filtered.map(deal => <Link href={`/deals/${deal.id}`} className="compact-record" key={deal.id}><div className="compact-record-head"><strong>{deal.title}</strong><Badge tone={stageTone(deal.stage)}>{deal.stage}</Badge></div><div className="compact-record-meta"><span>{deal.client?.name ?? "No client"}</span><strong>{money(deal)}</strong></div><small>{nextDue(deal)} <ArrowRight size={13} /></small></Link>)}</div>
      </>}
    </Card>
  </AppShell>;
}
