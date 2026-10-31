"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../../app-shell";

type ExtractedDeal = {
  title?: string;
  clientName?: string;
  contactName?: string;
  contactEmail?: string;
  amountCents?: number | null;
  currency?: string;
  termsDays?: number | null;
  usageRightsText?: string;
  usageRightsExpiresOn?: string | null;
  deliverables?: { title: string; dueOn: string | null }[];
  unsureFields?: string[];
};

export default function NewDealPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"manual" | "source">("manual");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", clientName: "", contactName: "", contactEmail: "", amount: "", currency: "USD", termsDays: "30", deliverables: "", usageRightsText: "", usageRightsExpiresOn: "", notes: "" });
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function extract() {
    setBusy(true);
    setMessage("");
    try {
      let body: BodyInit;
      const headers = new Headers();
      if (file) {
        body = new FormData();
        (body as FormData).set("file", file);
      } else {
        if (text.trim().length < 40) throw new Error("Add at least 40 characters of contract or deal text.");
        headers.set("content-type", "application/json");
        body = JSON.stringify({ text });
      }
      const response = await fetch("/api/deals/extract", { method: "POST", headers, body });
      const data = await response.json() as ExtractedDeal & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not extract deal details.");
      const deliverables = data.deliverables?.map(item => item.dueOn ? `${item.title} | ${item.dueOn.slice(0, 10)}` : item.title).join("\n") ?? "";
      setForm(current => ({
        ...current,
        title: data.title || current.title,
        clientName: data.clientName || current.clientName,
        contactName: data.contactName || current.contactName,
        contactEmail: data.contactEmail || current.contactEmail,
        amount: data.amountCents == null ? current.amount : (data.amountCents / 100).toFixed(2),
        currency: data.currency || current.currency,
        termsDays: data.termsDays == null ? current.termsDays : String(data.termsDays),
        usageRightsText: data.usageRightsText || current.usageRightsText,
        usageRightsExpiresOn: data.usageRightsExpiresOn?.slice(0, 10) || current.usageRightsExpiresOn,
        deliverables: deliverables || current.deliverables,
        notes: current.notes || (file ? `Extracted from ${file.name}` : text),
      }));
      setTab("manual");
      setMessage(data.unsureFields?.length ? `Review these fields: ${data.unsureFields.join(", ")}.` : "Details extracted. Review and edit every field before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const deliverables = form.deliverables.split("\n").filter(Boolean).map(line => {
      const [title, dueOn] = line.split("|").map(value => value.trim());
      return { title, dueOn: dueOn || null };
    });
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title, clientName: form.clientName, contactName: form.contactName, contactEmail: form.contactEmail,
          amountCents: Math.round(Number(form.amount) * 100), currency: form.currency, termsDays: Number(form.termsDays),
          deliverables, usageRightsText: form.usageRightsText,
          usageRightsExpiresOn: form.usageRightsExpiresOn || null, notes: form.notes,
          source: file || text.trim() ? "ai_paste" : "manual",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Check the deal details and try again.");
      router.push("/deals");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the deal.");
    } finally {
      setBusy(false);
    }
  }

  return <AppShell>
    <div className="page-heading"><div><div className="eyebrow">Deals / New deal</div><h1 className="page-title">Add a deal</h1><p className="subtle">Start with a contract or enter the details yourself. You review everything before saving.</p></div></div>
    <form className="form-card" onSubmit={save}>
      <div className="tabs">
        <button type="button" className={tab === "manual" ? "tab active" : "tab"} onClick={() => setTab("manual")}>Enter it yourself</button>
        <button type="button" className={tab === "source" ? "tab active" : "tab"} onClick={() => setTab("source")}>Upload or paste a contract</button>
      </div>
      {tab === "source" && <div className="paste-panel">
        <label className="field-label">Upload a PDF or text file
          <input ref={fileInput} className="input" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={event => { setFile(event.target.files?.[0] ?? null); setMessage(""); }} />
        </label>
        {file && <p className="subtle small-copy">Selected: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB <button className="small-action" type="button" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Remove</button></p>}
        <label className="field-label">Or paste contract or deal text<textarea className="input textarea" value={text} onChange={event => { setText(event.target.value); if (event.target.value) setFile(null); }} placeholder="Paste the relevant text here. Cleared will identify deal details for you to review." /></label>
        <p className="subtle small-copy">PDF, TXT, and Markdown files up to 10 MB. Text is processed for extraction and is not saved until you save the deal. Scanned PDFs need selectable text.</p>
        <button className="button secondary" type="button" onClick={extract} disabled={busy || (!file && text.trim().length < 40)}>{busy ? "Extracting…" : "Extract details with AI"}</button>
      </div>}
      <div className="form-grid">
        <label className="field-label">Deal title<input className="input" required value={form.title} onChange={event => set("title", event.target.value)} placeholder="Spring campaign" /></label>
        <label className="field-label">Brand or client<input className="input" required value={form.clientName} onChange={event => set("clientName", event.target.value)} placeholder="Company name" /></label>
        <label className="field-label">Contact name<input className="input" value={form.contactName} onChange={event => set("contactName", event.target.value)} placeholder="Name" /></label>
        <label className="field-label">Contact email<input className="input" type="email" value={form.contactEmail} onChange={event => set("contactEmail", event.target.value)} placeholder="name@company.com" /></label>
        <label className="field-label">Amount<input className="input" required type="number" min="0" step="0.01" value={form.amount} onChange={event => set("amount", event.target.value)} placeholder="0.00" /></label>
        <label className="field-label">Currency<select className="input" value={form.currency} onChange={event => set("currency", event.target.value)}><option>USD</option><option>GBP</option><option>EUR</option><option>NGN</option><option>CAD</option><option>AUD</option></select></label>
        <label className="field-label">Payment terms<select className="input" value={form.termsDays} onChange={event => set("termsDays", event.target.value)}><option value="30">Net 30</option><option value="15">Net 15</option><option value="0">Due on receipt</option><option value="45">Net 45</option></select></label>
        <label className="field-label">Usage rights expiry<input className="input" type="date" value={form.usageRightsExpiresOn} onChange={event => set("usageRightsExpiresOn", event.target.value)} /></label>
        <label className="field-label span-two">Deliverables<textarea className="input textarea" value={form.deliverables} onChange={event => set("deliverables", event.target.value)} placeholder="One deliverable per line. Optional due date: Final video | 2026-11-15" /></label>
        <label className="field-label span-two">Usage rights<textarea className="input textarea" value={form.usageRightsText} onChange={event => set("usageRightsText", event.target.value)} placeholder="Usage, licensing, exclusivity, or renewal terms" /></label>
        <label className="field-label span-two">Notes<textarea className="input textarea" value={form.notes} onChange={event => set("notes", event.target.value)} placeholder="Anything else to remember" /></label>
      </div>
      {message && <p className="small-copy" role="status">{message}</p>}
      <div className="form-actions"><Link href="/deals" className="button secondary">Cancel</Link><button className="button" disabled={busy}>{busy ? "Saving…" : "Save deal"}</button></div>
    </form>
  </AppShell>;
}
