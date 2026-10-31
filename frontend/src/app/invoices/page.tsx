"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "../app-shell";
import { Badge, Card } from "@/components/ui";

type Invoice = { id: string; number: string; status: string; dueDate: string; totalCents: number; currency: string; client: { name: string } | null };
const filters = ["All", "Draft", "Sent", "Overdue", "Paid"];
function statusOf(invoice: Invoice) { return invoice.status === "Sent" && new Date(invoice.dueDate) < new Date() ? "Overdue" : invoice.status; }
function toneOf(status: string) { return status === "Paid" ? "accent" : status === "Overdue" ? "danger" : status === "Draft" ? "neutral" : "outline"; }
function amountOf(invoice: Invoice) { return new Intl.NumberFormat(undefined, { style: "currency", currency: invoice.currency }).format(invoice.totalCents / 100); }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/invoices", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load invoices.");
      setInvoices(Array.isArray(data) ? data : []);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load invoices."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function markPaid(id: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/invoices/${id}/paid`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update invoice.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update invoice."); }
    finally { setBusy(""); }
  }

  const visible = useMemo(() => invoices.filter(invoice => filter === "All" || statusOf(invoice) === filter), [filter, invoices]);
  const toolbar = <div className="list-toolbar"><div className="filter-pills">{filters.map(option => <button key={option} className={filter === option ? "filter-pill active" : "filter-pill"} onClick={() => setFilter(option)}>{option}</button>)}</div><span className="list-count">{visible.length} {visible.length === 1 ? "invoice" : "invoices"}</span></div>;

  return <AppShell>
    <div className="page-heading"><div><div className="eyebrow">Get paid</div><h1 className="page-title">Invoices</h1><p className="subtle">Keep track of what is sent, due, and paid.</p></div><Link className="button" href="/invoices/new"><Plus size={17} /> New invoice</Link></div>
    <Card className="list-card">
      {toolbar}
      {error && <div className="empty-list-state" role="alert"><strong>Invoices couldn’t load</strong><p>{error}</p><button className="button secondary" onClick={() => window.location.reload()}>Try again</button></div>}
      {!error && loading && <div className="empty-list-state"><p>Loading your invoices…</p></div>}
      {!error && !loading && !visible.length && <div className="empty-list-state"><span className="empty-list-icon"><FileText size={20} /></span><strong>{invoices.length ? "No invoices in this view" : "No invoices yet"}</strong><p>{invoices.length ? "Choose another status filter to find an invoice." : "Create your first invoice to keep payment details and follow-ups together."}</p>{invoices.length ? <button className="button secondary" onClick={() => setFilter("All")}>Show all invoices</button> : <Link className="button" href="/invoices/new"><Plus size={16} /> Create your first invoice</Link>}</div>}
      {!error && !loading && visible.length > 0 && <>
        <div className="table-scroll invoices-desktop-list"><table><thead><tr><th>Invoice</th><th>Due date</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>{visible.map(invoice => { const status = statusOf(invoice); return <tr key={invoice.id}><td><strong>{invoice.number}</strong><small>{invoice.client?.name ?? "No client"}</small></td><td>{new Date(invoice.dueDate).toLocaleDateString()}</td><td><Badge tone={toneOf(status)}>{status}</Badge></td><td className="amount-cell">{amountOf(invoice)}</td><td>{status !== "Paid" && status !== "Draft" ? <button className="small-action" disabled={busy === invoice.id} onClick={() => markPaid(invoice.id)}>{busy === invoice.id ? "Saving…" : "Mark paid"}</button> : null}</td></tr>; })}</tbody></table></div>
        <div className="compact-record-list">{visible.map(invoice => { const status = statusOf(invoice); return <div className="compact-record" key={invoice.id}><div className="compact-record-head"><strong>{invoice.number}</strong><Badge tone={toneOf(status)}>{status}</Badge></div><div className="compact-record-meta"><span>{invoice.client?.name ?? "No client"} · Due {new Date(invoice.dueDate).toLocaleDateString()}</span><strong>{amountOf(invoice)}</strong></div>{status !== "Paid" && status !== "Draft" && <button className="small-action compact-record-action" disabled={busy === invoice.id} onClick={() => markPaid(invoice.id)}>{busy === invoice.id ? "Saving…" : "Mark paid"}</button>}</div>; })}</div>
      </>}
    </Card>
  </AppShell>;
}
