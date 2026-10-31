"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarClock, Check, Circle, LoaderCircle, Plus, Sparkles, Wallet } from "lucide-react";
import { AppShell } from "../app-shell";
import { Card } from "@/components/ui";
import "./today.css";

type Priority = { id: string; kind: string; title: string; dealTitle: string; dueOn: string | null; amountCents: number; currency: string; reason?: string };
type DealOption = { id: string; title: string };
type QuickTask = { id: string; title: string; dueOn: string | null; dealId: string | null; dealTitle: string | null };
type TodayData = { priorities: Priority[]; deals: DealOption[]; tasks: QuickTask[] };
const fallbackCopy: Record<string, string> = { task: "Task", deliverable: "Deliverable", draft_invoice: "Invoice to send", overdue_invoice: "Payment follow-up", pitch: "Pitch follow-up" };
const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date";

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [items, setItems] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [dealId, setDealId] = useState("");
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderedByAi, setOrderedByAi] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/today", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load today's work.");
      setData(result); setItems(result.priorities);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load today's work."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const visibleItems = useMemo(() => items.slice(0, 3), [items]);
  const remaining = useMemo(() => items.slice(3), [items]);

  async function addTask(event: React.FormEvent) {
    event.preventDefault(); if (!taskTitle.trim()) return;
    setSaving(true); setOrderMessage("");
    try {
      const response = await fetch("/api/today", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: taskTitle, dealId: dealId || null }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not add task.");
      setTaskTitle(""); setDealId(""); await load();
    } catch (reason) { setOrderMessage(reason instanceof Error ? reason.message : "Could not add task."); }
    finally { setSaving(false); }
  }

  async function orderDay() {
    if (!items.length) return;
    setOrdering(true); setOrderMessage("");
    try {
      const response = await fetch("/api/today/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not order your day.");
      setItems(result.items); setOrderedByAi(result.aiOrdered);
      setOrderMessage(result.aiOrdered ? "Your priorities are ordered. Each reason is based on your deal and due date." : "AI ordering is unavailable, so items are ordered by urgency.");
    } catch (reason) { setOrderMessage(reason instanceof Error ? reason.message : "Could not order your day."); }
    finally { setOrdering(false); }
  }

  async function completeTask(id: string) {
    const response = await fetch(`/api/today/tasks/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ completed: true }) });
    if (response.ok) await load(); else setOrderMessage("Could not update that task.");
  }
  function moveItem(index: number, offset: number) { const destination = index + offset; if (destination < 0 || destination >= items.length) return; setItems(current => { const next = [...current]; [next[index], next[destination]] = [next[destination], next[index]]; return next; }); setOrderedByAi(false); }

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return <AppShell><div className="today-page">
    <div className="page-heading today-heading"><div><div className="eyebrow">{today}</div><h1 className="page-title">Today</h1><p className="subtle">A short list to move your work and income forward.</p></div><button className="button" onClick={orderDay} disabled={ordering || loading || !items.length}><Sparkles size={16} />{ordering ? "Ordering…" : "Order my day"}</button></div>
    <div className="today-tools"><Link href="/goals">Goals</Link><Link href="/review">Weekly review</Link><Link href="/ai">Ask Cleared · AI tools</Link></div>
    {orderMessage && <p className="today-feedback" role="status">{orderMessage}</p>}
    {error ? <Card className="today-empty"><div className="today-empty-icon"><CalendarClock size={20} /></div><h2>Today could not load.</h2><p>{error}</p><button className="button secondary" onClick={load}>Try again</button></Card> : loading ? <Card className="today-loading"><LoaderCircle size={19} className="spin" /> Loading your priorities…</Card> : <>
      <section className="today-priorities"><div className="today-section-heading"><div><span className="eyebrow">Your top three</span><h2>What matters today</h2></div><span className="today-count">{visibleItems.length} {visibleItems.length === 1 ? "priority" : "priorities"}</span></div>
        {visibleItems.length ? <div className="priority-list">{visibleItems.map((item, index) => <PriorityCard key={item.id} item={item} index={index} onMove={moveItem} orderedByAi={orderedByAi} onComplete={completeTask} />)}</div> : <Card className="today-empty"><div className="today-empty-icon"><Check size={20} /></div><h2>Nothing pressing today.</h2><p>When a deliverable, invoice, pitch, or task needs attention, it will show up here.</p><Link className="button secondary" href="/deals/new"><Plus size={15} /> Add a deal</Link></Card>}
      </section>
      {remaining.length > 0 && <section className="today-more"><div className="today-section-heading"><div><span className="eyebrow">Also on your list</span><h2>Coming up</h2></div></div><div className="priority-list">{remaining.map((item, index) => <PriorityCard key={item.id} item={item} index={index + 3} onMove={moveItem} orderedByAi={orderedByAi} onComplete={completeTask} />)}</div></section>}
      <div className="today-lower-grid"><section className="today-quick-add"><div className="today-section-heading"><div><span className="eyebrow">Quick capture</span><h2>Get it out of your head</h2></div></div><Card><form onSubmit={addTask} className="quick-task-form"><label className="sr-only" htmlFor="quick-task">Add a task</label><input id="quick-task" className="input" value={taskTitle} onChange={event => setTaskTitle(event.target.value)} placeholder="Add a task you need to get done…" maxLength={180} /><select className="input quick-task-deal" value={dealId} onChange={event => setDealId(event.target.value)}><option value="">Link to a deal</option>{data?.deals.map(deal => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select><button className="button" disabled={saving || !taskTitle.trim()}><Plus size={16} />{saving ? "Adding…" : "Add task"}</button></form></Card></section>
        <section className="today-tasks"><div className="today-section-heading"><div><span className="eyebrow">Your tasks</span><h2>Quick tasks</h2></div></div><Card className="quick-task-list">{data?.tasks.length ? data.tasks.slice(0, 4).map(task => <div className="quick-task-row" key={task.id}><button className="task-check" onClick={() => completeTask(task.id)} aria-label={`Complete ${task.title}`}><Circle size={17} /></button><div><strong>{task.title}</strong><small>{task.dealTitle ?? "Personal task"} · {dateLabel(task.dueOn)}</small></div></div>) : <p className="subtle task-empty">Tasks you add will stay here until done.</p>}</Card></section></div>
    </>}
  </div></AppShell>;
}

function PriorityCard({ item, index, onMove, orderedByAi, onComplete }: { item: Priority; index: number; onMove: (index: number, offset: number) => void; orderedByAi: boolean; onComplete: (id: string) => void }) {
  const isTask = item.kind === "task";
  const tone = item.kind === "overdue_invoice" ? "danger" : item.kind === "deliverable" ? "warn" : item.kind === "draft_invoice" ? "accent" : "neutral";
  const href = item.kind === "deliverable" || item.kind === "pitch" ? "/deals" : "/invoices";
  return <Card className={`priority-card priority-${tone}`}><div className="priority-number">{String(index + 1).padStart(2, "0")}</div><div className="priority-icon">{isTask ? <Circle size={18} /> : item.kind.includes("invoice") ? <Wallet size={18} /> : <CalendarClock size={18} />}</div><div className="priority-main"><div className="priority-kind">{fallbackCopy[item.kind] ?? "Priority"}</div><h3>{item.title}</h3><p>{item.dealTitle} <span>·</span> {item.dueOn ? `Due ${dateLabel(item.dueOn)}` : "No due date"}</p>{item.reason && orderedByAi && <small className="priority-reason">{item.reason}</small>}</div><div className="priority-value"><strong>{item.amountCents ? money(item.amountCents, item.currency) : "—"}</strong><small>{item.amountCents ? "at stake" : "linked work"}</small></div>{isTask ? <button className="priority-action task-done" onClick={() => onComplete(item.id.slice("task:".length))}>Done</button> : <Link className="priority-action" href={href}>{item.kind === "overdue_invoice" ? "Follow up" : item.kind === "draft_invoice" ? "Review invoice" : item.kind === "pitch" ? "Open deal" : "Open deal"}</Link>}<div className="priority-reorder"><button onClick={() => onMove(index, -1)} aria-label="Move priority up"><ArrowUp size={14} /></button><button onClick={() => onMove(index, 1)} aria-label="Move priority down"><ArrowDown size={14} /></button></div></Card>;
}
