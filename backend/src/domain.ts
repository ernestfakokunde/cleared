import { z } from "zod";
import { callAiModel, parseAiJson } from "./ai.js";

export const DealExtractionSchema = z.object({
  title: z.string().default(""), clientName: z.string().default(""), contactName: z.string().default(""),
  contactEmail: z.string().default(""), amountCents: z.number().int().nonnegative().nullable(), currency: z.string().length(3).default("USD"),
    termsDays: z.number().int().nonnegative().nullable(), usageRightsText: z.string().default(""), usageRightsExpiresOn: z.string().nullable(),
  deliverables: z.array(z.object({ title: z.string(), dueOn: z.string().nullable() })).default([]), unsureFields: z.array(z.string()).default([]),
});
export type DealExtraction = z.infer<typeof DealExtractionSchema>;

export function formatMoney(cents: number, currency: string, locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);
}
export function getInvoiceStatus(invoice: { status: string; dueDate: Date | string }, now = new Date()) {
  return invoice.status === "Sent" && new Date(invoice.dueDate) < now ? "Overdue" : invoice.status;
}
export function dueDateFromTerms(issueDate: Date, termsDays: number) {
  const due = new Date(issueDate); due.setDate(due.getDate() + termsDays); return due;
}
export function reminderSchedule(dueDate: Date) {
  const dateAt = (offset: number) => { const date = new Date(dueDate); date.setDate(date.getDate() + offset); return date; };
  return [{ kind: "pre_due", scheduledFor: dateAt(-3) }, { kind: "due", scheduledFor: dateAt(0) }, ...[7, 14, 21, 28].map(days => ({ kind: "overdue", scheduledFor: dateAt(days) }))];
}

export type DayPriority = { id: string; kind: string; title: string; dealTitle: string; dueOn: string | null; amountCents: number; currency: string };

export async function orderToday(items: DayPriority[]): Promise<{ items: (DayPriority & { reason: string })[]; aiOrdered: boolean }> {
  if (items.length === 0) return { items: [], aiOrdered: false };

  try {
    const content = await callAiModel("Order supplied work items for a freelancer's day. Prioritize overdue payment follow-ups and deliverables due soon, then drafts to send and old unanswered pitches. Consider money at stake, but never let a large amount outrank an urgent deadline by itself. Return JSON {items:[{id,reason}]} with every supplied id exactly once and a brief reason grounded only in supplied data.", JSON.stringify(items), { json: true, temperature: 0.2 });
    const parsed = parseAiJson<{ items: { id: string; reason: string }[] }>(content);
    if (!Array.isArray(parsed.items) || parsed.items.length !== items.length) throw new Error("AI prioritization response is invalid");
    const reasons = new Map<string, string>();
    for (const entry of parsed.items) if (typeof entry.id === "string" && typeof entry.reason === "string" && items.some(item => item.id === entry.id)) reasons.set(entry.id, entry.reason.slice(0, 180));
    if (reasons.size !== items.length || new Set(parsed.items.map((entry: { id: string }) => entry.id)).size !== items.length) throw new Error("AI did not return every priority");
    return { items: parsed.items.map((entry: { id: string }) => ({ ...items.find(item => item.id === entry.id)!, reason: reasons.get(entry.id)! })), aiOrdered: true };
  } catch {
    return { items: urgencyOrder(items).map(item => ({ ...item, reason: defaultPriorityReason(item) })), aiOrdered: false };
  }
}

function urgencyOrder(items: DayPriority[]) {
  const rank: Record<string, number> = { overdue_invoice: 0, deliverable: 1, draft_invoice: 2, task: 3, pitch: 4 };
  return [...items].sort((a, b) => (rank[a.kind] ?? 5) - (rank[b.kind] ?? 5) || (a.dueOn ? new Date(a.dueOn).getTime() : Number.MAX_SAFE_INTEGER) - (b.dueOn ? new Date(b.dueOn).getTime() : Number.MAX_SAFE_INTEGER));
}

function defaultPriorityReason(item: DayPriority) {
  if (item.kind === "overdue_invoice") return "This payment is overdue and needs a follow-up.";
  if (item.kind === "deliverable") return "This deliverable is coming due.";
  if (item.kind === "draft_invoice") return "Sending this invoice moves completed work toward payment.";
  if (item.kind === "pitch") return "This pitch has been waiting for a reply.";
  return "This task is on your list for today.";
}

export async function extractDeal(text: string): Promise<DealExtraction> {
  const content = await callAiModel("Extract only fields explicitly present in deal text. Return JSON matching {title,clientName,contactName,contactEmail,amountCents,currency,termsDays,usageRightsText,usageRightsExpiresOn,deliverables,unsureFields}. Convert money to integer cents. Represent unknown numeric/date values as null. Put missing or uncertain field names in unsureFields. Do not infer missing values.", text, { json: true, temperature: 0, maxTokens: 3000 });
  return DealExtractionSchema.parse(parseAiJson(content));
}
