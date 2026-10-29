import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
  const due = await prisma.reminder.findMany({ where: { status: "scheduled", scheduledFor: { lte: new Date() }, invoice: { status: "Sent", remindersEnabled: true, deletedAt: null } }, include: { invoice: { include: { client: true, user: { include: { profile: true } } } } }, take: 100 });
  let sent = 0;
  for (const reminder of due) {
    const { invoice } = reminder; if (!invoice.client?.contactEmail) continue;
    const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(invoice.totalCents / 100);
    const days = Math.max(0, Math.floor((Date.now() - invoice.dueDate.getTime()) / 86400000));
    const subject = reminder.kind === "pre_due" ? `A note about invoice ${invoice.number}` : `Invoice ${invoice.number} payment reminder`;
    const note = reminder.kind === "pre_due" ? `A quick note that this invoice is due ${invoice.dueDate.toLocaleDateString("en-US")}.` : reminder.kind === "due" ? `This invoice is due today. Please let us know if you have any questions.` : `This invoice is ${days} days past due. Please let us know if anything is needed to process payment.`;
    const result = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: invoice.client.contactEmail, subject, html: `<p>Hello ${invoice.client.contactName ?? invoice.client.name},</p><p>${note}</p><p>Invoice ${invoice.number} · ${amount}</p><p>${invoice.paymentInstructionsSnapshot ?? ""}</p><p>Thank you.</p>` }) });
    if (!result.ok) continue;
    await prisma.$transaction([prisma.reminder.update({ where: { id: reminder.id }, data: { sentAt: new Date(), status: "sent" } }), prisma.activity.create({ data: { userId: reminder.userId, invoiceId: invoice.id, dealId: invoice.dealId, type: "reminder_sent", message: `${reminder.kind} reminder sent for invoice ${invoice.number}` } })]); sent++;
  }
  return NextResponse.json({ sent, checked: due.length });
}
