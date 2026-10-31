"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AppShell } from "../../app-shell";
import { Card } from "@/components/ui";

type CardKind = "Project idea" | "To-do" | "Reference";
type DocData = { id: string; title: string; template: string | null; content: unknown; dealId?: string | null; clientId?: string | null };
const kinds: CardKind[] = ["Project idea", "To-do", "Reference"];

function flatten(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { type?: string; text?: string; content?: unknown[] };
  if (node.text) return node.text;
  const children = (node.content ?? []).map(flatten).filter(Boolean);
  return children.join(["paragraph", "heading", "listItem", "taskItem"].includes(node.type ?? "") ? "\n" : " ");
}

export default function ProjectCardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CardKind>("Project idea");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Loading card…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/docs/${params.id}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load this card.");
        return data;
      })
      .then((data: DocData) => {
        setDoc(data);
        setTitle(data.title);
        setKind(kinds.includes(data.template as CardKind) ? data.template as CardKind : "Reference");
        setNotes(flatten(data.content));
        setStatus("Your notes are saved when you choose Save changes.");
      })
      .catch(error => setStatus(error instanceof Error ? error.message : "Could not load this card."));
  }, [params.id]);

  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/docs/${params.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled", template: kind, dealId: doc?.dealId ?? null, clientId: doc?.clientId ?? null, content: { type: "doc", content: [{ type: "paragraph", ...(notes.trim() ? { content: [{ type: "text", text: notes.trim() }] } : {}) }] } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this card.");
      setStatus("Saved.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not save this card."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm("Delete this card? This cannot be undone.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/docs/${params.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this card.");
      router.push("/docs");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not delete this card."); }
    finally { setBusy(false); }
  }

  return <AppShell>
    <div className="doc-editor-head"><div><Link href="/docs" className="text-link"><ArrowLeft size={14} /> All project cards</Link><div className="eyebrow project-detail-eyebrow">{kind}</div><h1 className="page-title">{title || "Untitled card"}</h1><div className="doc-save-status">{status}</div></div></div>
    <Card className="project-detail-card">
      <label className="field-label">Title<input className="input" maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="Give this card a clear title" /></label>
      <label className="field-label">Type<select className="input" value={kind} onChange={event => setKind(event.target.value as CardKind)}>{kinds.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="field-label">Notes<textarea className="input project-notes" maxLength={12000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Write down the idea, next steps, or details you want to remember." /></label>
      <div className="form-actions project-detail-actions"><button className="button ghost" type="button" disabled={busy} onClick={remove}><Trash2 size={15} /> Delete card</button><button className="button" type="button" disabled={busy || !title.trim()} onClick={save}>{busy ? "Saving…" : "Save changes"}</button></div>
    </Card>
  </AppShell>;
}
