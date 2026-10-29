import { brand } from "@/config/brand";
import { Logo } from "@/components/logo";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";

const swatches = [
  ["Ink", "#0E1116"], ["Paper", "#F6F4EF"], ["Surface", "#FFFFFF"], ["Line", "#E4E0D6"],
  ["Muted", "#6B6F76"], ["Accent", "#0F8A5F"], ["Accent bright", "#3DDC97"], ["Warn", "#B7791F"], ["Danger", "#B42318"],
];
const statuses = [
  ["Pitched", "neutral"], ["Negotiating", "warn"], ["Signed", "outline"], ["In progress", "accent"],
  ["Delivered", "accent"], ["Invoiced", "outline"], ["Paid", "accent"], ["Overdue", "danger"],
  ["Draft", "neutral"], ["Sent", "outline"], ["Void", "neutral"],
];

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") return null;
  return <main className="design-page">
    <header className="design-header"><Logo /><div className="eyebrow">Design system · Review build</div></header>
    <h1>Quiet clarity for every deal.</h1>
    <p className="subtle">The foundations for {brand.name}: calm, precise, and focused on what is owed.</p>
    <section className="section"><h2>Colour</h2><div className="swatches">{swatches.map(([name, color]) => <div className="swatch" key={name}><div className="swatch-color" style={{ background: color }} /><div className="swatch-label"><strong>{name}</strong>{color}</div></div>)}</div></section>
    <section className="section"><h2>Type</h2><Card><div className="eyebrow">Instrument Serif · Display</div><div style={{ font: "400 44px/1.1 var(--font-instrument), serif", margin: "8px 0 20px" }}>Know what you earned.</div><div className="eyebrow">Geist Sans · Interface</div><p style={{ margin: "8px 0 18px" }}>A clear view of every deal, invoice, and payment.</p><div className="eyebrow">Geist Mono · Money</div><div className="stat-value">$4,250.00</div></Card></section>
    <section className="section"><h2>Controls and statuses</h2><div className="sample-grid">
      <Card><p className="card-title">Buttons</p><div className="button-row"><Button>New deal</Button><Button className="secondary">Secondary</Button><Button className="ghost">Cancel</Button></div></Card>
      <Card><p className="card-title">Fields</p><div className="field-stack" style={{ alignItems: "stretch", flexDirection: "column" }}><Input placeholder="Brand or client name" /><Textarea placeholder="Add a note" /></div></Card>
      <Card><p className="card-title">Status labels</p><div className="badge-row">{statuses.map(([label, tone]) => <Badge key={label} tone={tone}>{label}</Badge>)}</div></Card>
      <Card><p className="card-title">Stat card</p><div className="eyebrow">Owed to you</div><div className="stat-value">$2,840.00</div><span className="subtle">Across 3 unpaid invoices</span></Card>
    </div></section>
    <section className="section"><h2>Empty state and table</h2><div className="sample-grid">
      <Card className="empty-state"><div className="empty-mark">＋</div><p className="card-title">No deals yet</p><p className="subtle">Your deals will appear here, from first pitch to final payment.</p><Button>Add your first deal</Button></Card>
      <Card className="table-wrap"><table><thead><tr><th>Deal</th><th>Stage</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead><tbody><tr><td><strong>Spring campaign</strong><br /><span className="subtle">Northstar Studio</span></td><td><Badge tone="accent">In progress</Badge></td><td className="amount">$1,200.00</td></tr></tbody></table></Card>
    </div></section>
  </main>;
}
