import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InvoicePdf } from "@/components/invoice-pdf";
import { reminderSchedule } from "../../../../../../../backend/src/domain";
export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await prisma.invoice.findFirst({ where: { id: context.params.id, userId: session.user.id, deletedAt: null }, include: { client: true, items: true, user: { include: { profile: true } } } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!invoice.client?.contactEmail) return NextResponse.json({ error: "Add an invoicing contact email before sending." }, { status: 400 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: "Email is not configured. Add RESEND_API_KEY and EMAIL_FROM." }, { status: 503 });
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(invoice.totalCents / 100);
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/i/${invoice.publicToken}`;
  const document = createElement(InvoicePdf, { invoice, businessName: invoice.user.profile?.businessName ?? invoice.user.name ?? "Cleared customer", clientName: invoice.client.name }) as unknown as React.ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(document);
  const lines = invoice.items.map(item => `<li>${item.description} — ${new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(item.unitCents * item.quantity / 100)}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: invoice.client.contactEmail, subject: `Invoice ${invoice.number} from ${invoice.user.profile?.businessName ?? invoice.user.name ?? "Cleared"}`, html: `<p>Hello ${invoice.client.contactName ?? invoice.client.name},</p><p>Please find invoice ${invoice.number} for ${amount}.</p><ul>${lines}</ul><p>Due ${invoice.dueDate.toLocaleDateString("en-US")}.</p><p><a href="${link}">View invoice</a></p><p>${invoice.paymentInstructionsSnapshot ?? ""}</p><p>Thank you.</p>`, attachments: [{ filename: `${invoice.number}.pdf`, content: Buffer.from(pdf).toString("base64") }] }) });
  if (!response.ok) return NextResponse.json({ error: "Email could not be sent. Check your Resend configuration." }, { status: 502 });
  const scheduled = reminderSchedule(invoice.dueDate);
  const now = new Date();
  await prisma.$transaction([
    prisma.invoice.update({ where: { id: invoice.id }, data: { status: "Sent", sentAt: now } }),
    prisma.reminder.createMany({ data: scheduled.filter(item => item.scheduledFor >= now).map(item => ({ userId: session.user!.id!, invoiceId: invoice.id, kind: item.kind, scheduledFor: item.scheduledFor })) }),
    prisma.activity.create({ data: { userId: session.user.id, invoiceId: invoice.id, dealId: invoice.dealId, type: "invoice_sent", message: `Invoice ${invoice.number} sent to ${invoice.client.contactEmail}` } }),
  ]);
  return NextResponse.json({ sent: true, invoice: invoice.number });
}
