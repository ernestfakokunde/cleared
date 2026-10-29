import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InvoicePdf } from "@/components/invoice-pdf";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: { id: string } }) {
  const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await prisma.invoice.findFirst({ where: { id: context.params.id, userId: session.user.id, deletedAt: null }, include: { client: true, items: true, user: { include: { profile: true } } } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const document = createElement(InvoicePdf, { invoice, businessName: invoice.user.profile?.businessName ?? invoice.user.name ?? "Cleared customer", clientName: invoice.client?.name ?? "Client" }) as unknown as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(document);
  return new Response(new Uint8Array(buffer), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${invoice.number}.pdf"` } });
}
