"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, Lightbulb, Plus, Search } from "lucide-react";
import { AppShell } from "../app-shell";

type DocItem = { id: string; title: string; template: string | null; content: unknown; updatedAt: string; deal?: { title: string } | null; client?: { name: string } | null };
type CardKind = "Project idea" | "To-do" | "Reference";
type RefOption = { id: string; title?: string; name?: string };
const kinds: CardKind[] = ["Project idea", "To-do", "Reference"];
const icons = { "Project idea": Lightbulb, "To-do": ClipboardList, Reference: FileText };

function getText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { text?: string; content?: unknown[] };
  return [node.text ?? "", ...(node.content ?? []).map(getText)].filter(Boolean).join(" ");
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<CardKind>("Project idea");
  const [deals, setDeals] = useState<RefOption[]>([]);
  const [clients, setClients] = useState<RefOption[]>([]);
  const [dealId, setDealId] = useState("");
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const response = await fetch(`/api/docs?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load your project cards.");
      setDocs(data.docs ?? []);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load your project cards."); }
  }
  useEffect(() => { void load(); }, [q]);
  useEffect(() => {
    const initialDeal = new URLSearchParams(window.location.search).get("deal");
    if (initialDeal) { setDealId(initialDeal); setCreating(true); }
    fetch("/api/deals").then(response => response.json()).then(data => setDeals(Array.isArray(data) ? data : []));
    fetch("/api/clients").then(response => response.json()).then(data => setClients(data.clients ?? []));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, template: kind, dealId: dealId || null, clientId: clientId || null, content: { type: "doc", content: [{ type: "paragraph", ...(description.trim() ? { content: [{ type: "text", text: description.trim() }] } : {}) }] } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this card.");
      window.location.href = `/docs/${data.id}`;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this card."); }
    finally { setBusy(false); }
  }

  const filtered = useMemo(() => docs.filter(doc => `${doc.title} ${getText(doc.content)} ${doc.template ?? ""}`.toLowerCase().includes(q.toLowerCase())), [docs, q]);
  return <AppShell>
    <div className="page-heading"><div><div className="eyebrow">Ideas, plans, and useful notes</div><h1 className="page-title">Project cards</h1><p className="subtle">Keep project ideas, next steps, and references in one simple place.</p></div><button className="button" onClick={() => setCreating(value => !value)}><Plus size={16} /> New card</button></div>
    {creating && <form className="form-card project-card-form" onSubmit={create}>
      <div className="form-grid">
        <label className="field-label">Card title<input className="input" required maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="A short name for this idea or task" /></label>
        <label className="field-label">Type<select className="input" value={kind} onChange={event => setKind(event.target.value as CardKind)}>{kinds.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label">Link to deal<select className="input" value={dealId} onChange={event => { setDealId(event.target.value); if (event.target.value) setClientId(""); }}><option value="">No deal</option>{deals.map(deal => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select></label>
        <label className="field-label">Link to client<select className="input" value={clientId} onChange={event => { setClientId(event.target.value); if (event.target.value) setDealId(""); }}><option value="">No client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label className="field-label span-two">Notes<textarea className="input textarea" maxLength={12000} value={description} onChange={event => setDescription(event.target.value)} placeholder="What is the idea? What needs to happen next? Add links, context, or a rough plan." /></label>
      </div>
      <div className="form-actions"><button type="button" className="button secondary" onClick={() => setCreating(false)}>Cancel</button><button className="button" disabled={busy || !title.trim()}>{busy ? "Saving…" : "Save card"}</button></div>
    </form>}
    <div className="project-toolbar"><label className="search-box"><Search size={16} /><input aria-label="Search cards" placeholder="Search ideas, tasks, and notes" value={q} onChange={event => setQ(event.target.value)} /></label><span>{filtered.length} {filtered.length === 1 ? "card" : "cards"}</span></div>
    {error && <p className="doc-error" role="alert">{error}</p>}
    {filtered.length ? <div className="project-card-grid">{filtered.map(doc => {
      const category = kinds.includes(doc.template as CardKind) ? doc.template as CardKind : "Reference";
      const Icon = icons[category];
      const preview = getText(doc.content);
      return <Link href={`/docs/${doc.id}`} key={doc.id} className="project-card">
        <div className="project-card-top"><span className={`project-card-icon kind-${category.toLowerCase().replace("-", "")}`}><Icon size={18} /></span><span className="project-card-kind">{category}</span></div>
        <h2>{doc.title}</h2><p>{preview || "Open this card to add some notes."}</p>
        {(doc.deal?.title || doc.client?.name) && <small className="project-card-link">{doc.deal?.title ?? doc.client?.name}</small>}
        <time>Updated {new Date(doc.updatedAt).toLocaleDateString()}</time>
      </Link>;
    })}</div> : !error && <div className="project-empty"><span className="project-card-icon"><Lightbulb size={20} /></span><h2>{q ? "No matching cards" : "Your ideas start here"}</h2><p>{q ? "Try another search." : "Save a project idea, something to do, or a reference you want to keep close."}</p>{!q && <button className="button" onClick={() => setCreating(true)}><Plus size={16} /> Make your first card</button>}</div>}
  </AppShell>;
}
