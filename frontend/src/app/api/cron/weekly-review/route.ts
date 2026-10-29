import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { askModel, recordAiUsage, jsonFromAi } from "@/lib/ai";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET; if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: "Set RESEND_API_KEY and EMAIL_FROM to enable weekly email." }, { status: 503 });
  const resend = new Resend(process.env.RESEND_API_KEY); const now = new Date(); const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7)); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 7); const periodKey = start.toISOString().slice(0, 10);
  const users = await prisma.user.findMany({ where: { profile: { isNot: null } }, select: { id: true, email: true, name: true } }); let sent = 0;
  for (const user of users) {
    const marker = `weekly-review:${periodKey}`; if (await prisma.activity.findFirst({ where: { userId: user.id, type: "weekly_review_email", message: marker } })) continue;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [paid, monthPaid, slipped, completed, pitches, goals] = await Promise.all([
      prisma.invoice.aggregate({ where: { userId: user.id, status: "Paid", paidAt: { gte: start, lt: end }, deletedAt: null }, _sum: { paidAmountCents: true, totalCents: true }, _count: true }),
      prisma.invoice.aggregate({ where: { userId: user.id, status: "Paid", paidAt: { gte: monthStart }, deletedAt: null }, _sum: { paidAmountCents: true, totalCents: true } }),
      prisma.deliverable.findMany({ where: { deal: { userId: user.id, deletedAt: null }, dueOn: { gte: start, lt: end }, OR: [{ doneAt: null }, { doneAt: { gt: end } }] }, select: { title: true, deal: { select: { title: true } } } }),
      prisma.deliverable.findMany({ where: { deal: { userId: user.id, deletedAt: null }, doneAt: { gte: start, lt: end }, dueOn: { not: null } }, select: { dueOn: true, doneAt: true } }),
      prisma.deal.count({ where: { userId: user.id, stage: "Pitched", createdAt: { gte: start, lt: end } } }),
      prisma.goal.findMany({ where: { userId: user.id }, select: { type: true, target: true, currency: true } }),
    ]);
    const earned = paid._sum.paidAmountCents ?? paid._sum.totalCents ?? 0; const monthEarned = monthPaid._sum.paidAmountCents ?? monthPaid._sum.totalCents ?? 0; const onTime = completed.length ? Math.round(completed.filter(item => item.doneAt! <= item.dueOn!).length / completed.length * 100) : 0;
    const summary = { earningsCents: earned, paidInvoices: paid._count, slipped, goals: goals.map(g => ({ ...g, current: g.type === "monthly_income" ? monthEarned : g.type === "weekly_pitches" ? pitches : onTime })) };
    let priorities = ["Review slipped deliverables and reset dates.", "Follow up on outstanding invoices.", "Choose a focused income or pitch target for the week."];
    if (await recordAiUsage(user.id, "weekly-review-email")) { try { const result = jsonFromAi<{ priorities: string[] }>(await askModel("Suggest three concise priorities for next week based only on these records. Return JSON {priorities:string[]}. Do not invent facts.", JSON.stringify(summary))); if (result.priorities?.length) priorities = result.priorities.slice(0, 3); } catch { /* send the useful deterministic fallback */ } }
    const dollars = (summary.earningsCents / 100).toLocaleString("en-US", { style: "currency", currency: goals[0]?.currency ?? "USD" });
    const goalLabels: Record<string, string> = { monthly_income: "Monthly income", on_time_deliverables: "On-time deliveries", weekly_pitches: "Weekly pitches" };
    const goalLines = summary.goals.map(g => `${goalLabels[g.type] ?? g.type}: ${g.type === "monthly_income" ? (g.current / 100).toLocaleString("en-US", { style: "currency", currency: g.currency, maximumFractionDigits: 0 }) : g.current + (g.type === "on_time_deliverables" ? "%" : "")} / ${g.type === "monthly_income" ? (g.target / 100).toLocaleString("en-US", { style: "currency", currency: g.currency, maximumFractionDigits: 0 }) : g.target + (g.type === "on_time_deliverables" ? "%" : "")}`);
    const lines = [`Your Cleared week (${start.toLocaleDateString()}–${new Date(end.getTime() - 1).toLocaleDateString()})`, "", `Earnings received: ${dollars} across ${paid._count} paid invoice(s).`, `Items that slipped: ${slipped.length ? slipped.map(item => `${item.title} (${item.deal.title})`).join("; ") : "None"}.`, "", "Goal progress:", ...(goalLines.length ? goalLines : ["Set a goal in Cleared to see your progress here."]), "", "A few priorities for this week:", ...priorities.map((p, i) => `${i + 1}. ${p}`), "", "Open Cleared to plan your week."];
    const result = await resend.emails.send({ from: process.env.EMAIL_FROM, to: user.email, subject: "Your Cleared weekly review", text: lines.join("\n") });
    if (result.error) continue;
    await prisma.activity.create({ data: { userId: user.id, type: "weekly_review_email", message: marker } }); sent++;
  }
  return NextResponse.json({ sent, period: periodKey });
}
