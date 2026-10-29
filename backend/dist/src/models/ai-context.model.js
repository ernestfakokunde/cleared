import { prisma } from "../lib/prisma.js";
export const findInvoiceContext = (id, userId) => prisma.invoice.findFirst({ where: { id, userId, deletedAt: null }, include: { client: true, deal: true } });
export const findPitchContext = (id, userId) => prisma.deal.findFirst({ where: { id, userId, stage: "Pitched", deletedAt: null }, include: { client: true } });
export const findDeliverableContext = (id, userId) => prisma.deliverable.findFirst({ where: { id, deal: { userId, deletedAt: null } }, include: { deal: { include: { client: true } } } });
export const findDealContext = (id, userId) => prisma.deal.findFirst({ where: { id, userId, deletedAt: null }, select: { title: true, amountCents: true, currency: true, usageRightsText: true, notes: true } });
export async function findAskContext(userId) {
    const [deals, invoices, clients, goals] = await Promise.all([
        prisma.deal.findMany({ where: { userId, deletedAt: null }, select: { id: true, title: true, stage: true, amountCents: true, currency: true, client: { select: { name: true } } }, take: 100 }),
        prisma.invoice.findMany({ where: { userId, deletedAt: null }, select: { id: true, number: true, status: true, totalCents: true, currency: true, dueDate: true, client: { select: { name: true } } }, take: 100 }),
        prisma.client.findMany({ where: { userId, deletedAt: null }, select: { id: true, name: true }, take: 100 }),
        prisma.goal.findMany({ where: { userId }, select: { id: true, type: true, target: true, currency: true, periodStart: true }, orderBy: { periodStart: "desc" }, take: 30 }),
    ]);
    return { deals, invoices, clients, goals };
}
