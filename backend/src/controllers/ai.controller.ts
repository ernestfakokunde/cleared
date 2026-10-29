import type { Request, Response } from "express";
import { z } from "zod";
import { consumeDailyAiQuota } from "../models/ai-usage.model.js";
import { findAskContext, findDealContext, findDeliverableContext, findInvoiceContext, findPitchContext } from "../models/ai-context.model.js";
import { getWeeklyReviewData } from "../models/review.model.js";
import { generateText, parseJson } from "../services/ai-provider.service.js";
import { DealExtractionSchema, orderToday, type DayPriority } from "../domain.js";
import { HttpError } from "../middleware/error-handler.js";

async function requireQuota(userId: string, feature: string) { if (!await consumeDailyAiQuota(userId, feature)) throw new HttpError(429, "Daily AI limit reached. Try again tomorrow."); }
const json = (res: Response, value: unknown) => res.json(value);

export async function draftMessage(req: Request, res: Response) {
  const userId = req.userId!;
  const input = z.object({ kind: z.enum(["invoice", "pitch", "revision"]), recordId: z.string().min(1), tone: z.enum(["friendly", "neutral", "firm"]) }).parse(req.body);
  let record: unknown;
  if (input.kind === "invoice") record = await findInvoiceContext(input.recordId, userId);
  else if (input.kind === "pitch") record = await findPitchContext(input.recordId, userId);
  else record = await findDeliverableContext(input.recordId, userId);
  if (!record) throw new HttpError(404, "That record was not found.");
  await requireQuota(userId, "draft-message");
  const text = await generateText({ system: "Write a concise, natural business email using only supplied facts. Respect the requested tone. Never claim it has been sent. Return JSON {subject,body}.", prompt: JSON.stringify({ kind: input.kind, tone: input.tone, record }), json: true });
  return json(res, parseJson<{ subject: string; body: string }>(text));
}

export async function summarizeContract(req: Request, res: Response) {
  const userId = req.userId!;
  const input = z.object({ text: z.string().trim().min(40).max(30000), dealId: z.string().optional() }).parse(req.body);
  if (input.dealId && !await findDealContext(input.dealId, userId)) throw new HttpError(404, "Deal not found.");
  await requireQuota(userId, "contract-summary");
  const result = parseJson<{ summary: string; clauses: { title: string; quote: string; note: string }[] }>(await generateText({ system: "Summarize this creator contract in plain language. Return JSON {summary,clauses:[{title,quote,note}]}. Every quote must be verbatim from the source. Include payment, deliverables, revisions, usage rights and termination when present. Do not invent clauses or provide legal advice.", prompt: input.text, json: true }));
  result.clauses = (result.clauses ?? []).filter(clause => clause.quote && input.text.includes(clause.quote)).slice(0, 12);
  return json(res, result);
}

export async function askCleared(req: Request, res: Response) {
  const userId = req.userId!; const input = z.object({ question: z.string().trim().min(2).max(1000) }).parse(req.body);
  await requireQuota(userId, "ask-cleared");
  const records = await findAskContext(userId);
  const result = parseJson<{ answer: string; recordIds: string[] }>(await generateText({ system: "Answer only from the supplied user's records. If information is insufficient, say so. Return JSON {answer:string,recordIds:string[]} citing record IDs used. Read-only: do not claim to change or send anything.", prompt: JSON.stringify({ question: input.question, records }), json: true }));
  const recordMap = new Map<string, { id: string; label: string; type: string }>();
  records.deals.forEach(r => recordMap.set(r.id, { id: r.id, label: r.title, type: "Deal" }));
  records.invoices.forEach(r => recordMap.set(r.id, { id: r.id, label: `Invoice ${r.number}${r.client?.name ? ` · ${r.client.name}` : ""}`, type: "Invoice" }));
  records.clients.forEach(r => recordMap.set(r.id, { id: r.id, label: r.name, type: "Client" }));
  records.goals.forEach(r => recordMap.set(r.id, { id: r.id, label: r.type.replaceAll("_", " "), type: "Goal" }));
  return json(res, { answer: result.answer, sources: [...new Set(result.recordIds ?? [])].map(id => recordMap.get(id)).filter(Boolean) });
}

export async function draftDoc(req: Request, res: Response) {
  const userId = req.userId!; const input = z.object({ action: z.enum(["brief", "checklist"]), notes: z.string().trim().min(10).max(12000), dealId: z.string().optional() }).parse(req.body);
  const deal = input.dealId ? await findDealContext(input.dealId, userId) : null;
  if (input.dealId && !deal) throw new HttpError(404, "Deal not found.");
  await requireQuota(userId, "doc-draft");
  const text = await generateText({ system: input.action === "brief" ? "Draft a concise creator content brief from the supplied notes and deal facts. Preserve uncertainty, do not invent deliverables. Use Markdown headings and bullets." : "Turn the supplied contract into a concise practical checklist. Each checkbox must be explicitly supported by source text. Preserve deadlines and rights; do not invent terms. Use Markdown checkboxes.", prompt: JSON.stringify({ notes: input.notes, deal }) });
  return json(res, { text });
}

export async function orderPriorities(req: Request, res: Response) {
  const userId = req.userId!; const schema = z.object({ items: z.array(z.object({ id: z.string(), kind: z.string(), title: z.string(), dealTitle: z.string(), dueOn: z.string().nullable(), amountCents: z.number().int(), currency: z.string() })).max(20) });
  const input = schema.parse(req.body); await requireQuota(userId, "today-order");
  return json(res, await orderToday(input.items as DayPriority[]));
}

export async function extractDeal(req: Request, res: Response) {
  const userId = req.userId!; const input = z.object({ text: z.string().min(20).max(30000) }).parse(req.body);
  await requireQuota(userId, "deal-extraction");
  const result = parseJson(await generateText({ system: "Extract only explicitly present deal fields. Return JSON matching {title,clientName,contactName,contactEmail,amountCents,currency,termsDays,usageRightsText,usageRightsExpiresOn,deliverables,unsureFields}. Money is integer cents; unknown numeric/date fields are null. Do not infer missing values.", prompt: input.text, json: true, temperature: 0, maxTokens: 3000 }));
  return json(res, DealExtractionSchema.parse(result));
}

export async function suggestReviewPriorities(req: Request, res: Response) {
  const userId = req.userId!; await requireQuota(userId, "weekly-review");
  const review = await getWeeklyReviewData(userId);
  const result = parseJson<{ priorities: string[] }>(await generateText({ system: "Suggest three specific, practical priorities for next week using only this review data. Return JSON {priorities:string[]}. Keep each concise and do not invent commitments.", prompt: JSON.stringify(review), json: true }));
  return json(res, { priorities: (result.priorities ?? []).slice(0, 3) });
}
