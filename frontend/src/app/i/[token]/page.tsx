import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { Badge, Card } from "@/components/ui";
export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const invoice = await prisma.invoice.findFirst({ where: { publicToken: params.token, deletedAt: null }, include: { client: true, items: true, user: { include: { profile: true } } } });
  if (!invoice) notFound();
  const business = invoice.user.profile?.businessName ?? invoice.user.name ?? "Cleared customer";
  const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(cents / 100);
  return <main className="public-invoice"><header><Logo /><Badge tone={invoice.status === "Paid" ? "accent" : "outline"}>{invoice.status}</Badge></header><Card><div className="invoice-heading"><div><div className="eyebrow">Invoice</div><h1>{invoice.number}</h1></div><div className="invoice-business"><strong>{business}</strong><span>Bill to {invoice.client?.name ?? "Client"}</span></div></div><div className="invoice-dates"><span>Issued {invoice.issueDate.toLocaleDateString("en-US")}</span><span>Due {invoice.dueDate.toLocaleDateString("en-US")}</span></div><table><thead><tr><th>Description</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>{invoice.items.map(item => <tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td className="amount-cell">{money(item.unitCents * item.quantity)}</td></tr>)}</tbody></table><div className="invoice-total"><span>Total</span><strong>{money(invoice.totalCents)}</strong></div>{invoice.paymentInstructionsSnapshot && <div className="payment-note"><strong>Payment instructions</strong><p>{invoice.paymentInstructionsSnapshot}</p></div>}<p className="thank-you">Thank you for your work together.</p></Card></main>;
}
