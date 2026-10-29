import { prisma } from "../lib/prisma.js";
export function getPreviousWeekRange(now = new Date()) {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    return { start, end };
}
export async function getWeeklyReviewData(userId) {
    const { start, end } = getPreviousWeekRange();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const [paid, monthPaid, monthForecast, slipped, completed, pitches, goals] = await Promise.all([
        prisma.invoice.aggregate({ where: { userId, status: "Paid", paidAt: { gte: start, lt: end }, deletedAt: null }, _sum: { paidAmountCents: true, totalCents: true }, _count: true }),
        prisma.invoice.aggregate({ where: { userId, status: "Paid", paidAt: { gte: monthStart, lt: nextMonth }, deletedAt: null }, _sum: { paidAmountCents: true, totalCents: true } }),
        prisma.invoice.aggregate({ where: { userId, status: "Sent", dueDate: { gte: monthStart, lt: nextMonth }, deletedAt: null }, _sum: { totalCents: true } }),
        prisma.deliverable.findMany({ where: { deal: { userId, deletedAt: null }, dueOn: { gte: start, lt: end }, OR: [{ doneAt: null }, { doneAt: { gt: end } }] }, select: { id: true, title: true, dueOn: true, deal: { select: { id: true, title: true } } } }),
        prisma.deliverable.findMany({ where: { deal: { userId, deletedAt: null }, doneAt: { gte: start, lt: end }, dueOn: { not: null } }, select: { dueOn: true, doneAt: true } }),
        prisma.deal.count({ where: { userId, stage: "Pitched", createdAt: { gte: start, lt: end } } }),
        prisma.goal.findMany({ where: { userId, periodStart: monthStart }, select: { id: true, type: true, target: true, currency: true } }),
    ]);
    const onTimePercent = completed.length ? Math.round(completed.filter(item => item.doneAt <= item.dueOn).length / completed.length * 100) : null;
    const paidCents = monthPaid._sum.paidAmountCents ?? monthPaid._sum.totalCents ?? 0;
    const forecastCents = monthForecast._sum.totalCents ?? 0;
    return {
        period: { start, end }, earningsCents: paid._sum.paidAmountCents ?? paid._sum.totalCents ?? 0, paidInvoices: paid._count,
        slipped, completedCount: completed.length, onTimePercent, pitches,
        goals: goals.map(goal => ({ ...goal, current: goal.type === "monthly_income" ? paidCents + forecastCents : goal.type === "weekly_pitches" ? pitches : onTimePercent ?? 0 })),
    };
}
