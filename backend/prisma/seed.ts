import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const user = await db.user.upsert({ where: { email: "demo@cleared.app" }, update: {}, create: { email: "demo@cleared.app", name: "Jordan Lee", profile: { create: { role: "creator", businessName: "Jordan Lee Studio", country: "United States" } } } });
  const clients = ["Northstar Studio", "Kindred Goods", "Sunday Supply", "Field Notes Co.", "Morrow Beauty"];
  for (let index = 0; index < clients.length; index++) {
    const client = await db.client.create({ data: { userId: user.id, name: clients[index] } });
    const deal = await db.deal.create({ data: { userId: user.id, clientId: client.id, title: ["Spring campaign", "Product photography", "Launch partnership", "Editorial package", "Social content"][index], amountCents: [120000, 85000, 240000, 64000, 175000][index], currency: "USD", stage: ["Pitched", "Negotiating", "Signed", "Delivered", "Paid"][index], deliverables: { create: [{ title: "Final assets", dueOn: new Date(Date.now() + (index - 2) * 86400000) }] } } });
    await db.invoice.create({ data: { userId: user.id, dealId: deal.id, clientId: client.id, number: `CL-${1001 + index}`, issueDate: new Date(Date.now() - 20 * 86400000), dueDate: new Date(Date.now() + ([10, -7, -18, 20, 12][index] ?? 30) * 86400000), currency: "USD", totalCents: [120000, 85000, 240000, 64000, 175000][index], status: ["Paid", "Sent", "Sent", "Draft", "Sent"][index], ...(index === 0 ? { paidAt: new Date(), paidAmountCents: 120000 } : {}) } });
  }
}
main().finally(() => db.$disconnect());
