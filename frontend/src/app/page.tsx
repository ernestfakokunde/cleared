"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleDollarSign, FileText, LayoutDashboard, ListChecks, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import "./landing.css";

const personas = {
  Creator: {
    headline: ["Brand deals shouldn’t", "live in your DMs."],
    subhead: "Track every deal, deliverable and usage-rights date. Invoice in a minute and get paid without the awkward follow-ups.",
    deal: { name: "Glow Skincare", client: "3 Reels + story set", amount: "$2,400", state: "Overdue · 6 days", tone: "danger" },
    owed: "$2,400", overdue: "$2,400", paid: "$1,200", attention: "Glow Skincare invoice is overdue", attentionNote: "Glow Skincare · 6 days past due",
  },
  Freelancer: {
    headline: ["Stop chasing", "invoices."],
    subhead: "Send a clean invoice and let polite reminders do the chasing while you do the work.",
    deal: { name: "Northwind Studio", client: "Brand website", amount: "$3,800", state: "Due in 3 days", tone: "warn" },
    owed: "$3,800", overdue: "$0", paid: "$2,100", attention: "Northwind invoice is due soon", attentionNote: "Northwind Studio · Due in 3 days",
  },
  "Side hustle": {
    headline: ["Know what your side", "hustle actually earns."],
    subhead: "See what you’re owed, what’s overdue and what you made this month, all in one place.",
    deal: { name: "Mia’s Candles", client: "Bulk order of 60", amount: "$640", state: "Paid", tone: "accent" },
    owed: "$0", overdue: "$0", paid: "$640", attention: "Mia’s Candles payment cleared", attentionNote: "Mia’s Candles · Paid today",
  },
} as const;
type Persona = keyof typeof personas;

export default function Home() {
  const [persona, setPersona] = useState<Persona>("Creator");
  const current = personas[persona];
  useEffect(() => {
    const options = Object.keys(personas) as Persona[];
    const timer = window.setInterval(() => {
      setPersona(currentPersona => options[(options.indexOf(currentPersona) + 1) % options.length]);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/" aria-label="Cleared home"><Logo size={34} /></Link>
        <div className="landing-nav-links">
          <Link href="/dashboard">Product <ChevronDown size={15} /></Link>
          <Link href="#how-it-works">How it works <ChevronDown size={15} /></Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <div className="landing-nav-actions">
          <Link href="/signin">Sign in</Link>
          <Link href="/today" className="landing-nav-cta">Open app <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-kicker"><span className="kicker-dot" /> A clear view of your work</div>
        <h1 className="persona-headline persona-copy" key={`headline-${persona}`}><span>{current.headline[0]}</span><br /><span className="hero-highlight"><i />{current.headline[1]}</span></h1>
        <p className="landing-subtitle persona-copy" key={`subhead-${persona}`}>{current.subhead}</p>
        <div className="landing-actions">
          <Link href="/today" className="landing-primary">Open Cleared <ArrowRight size={17} /></Link>
          <Link href="#how-it-works" className="landing-secondary">See how it works</Link>
        </div>
        <p className="landing-footnote">No sign-in required to get started.</p>

        <div className="landing-preview-wrap" aria-label="Cleared product preview">
          <div className="preview-window">
            <div className="window-bar">
              <div className="window-dots"><i /><i /><i /></div>
              <div className="window-address"><Search size={12} /> app.cleared.app</div>
              <div className="window-account">JL <ChevronDown size={12} /></div>
            </div>
            <div className="preview-layout">
              <aside className="preview-sidebar">
                <Logo size={26} />
                <div className="preview-nav-item selected"><LayoutDashboard size={13} /> Dashboard</div>
                <div className="preview-nav-item"><ListChecks size={13} /> Deals</div>
                <div className="preview-nav-item"><FileText size={13} /> Invoices</div>
                <div className="preview-nav-item"><CircleDollarSign size={13} /> Settings</div>
                <div className="preview-user"><span>JL</span> Jordan Lee</div>
              </aside>
              <div className="preview-main persona-preview" key={`preview-${persona}`}>
                <div className="preview-heading">
                  <div><small>YOUR WORKSPACE</small><strong>Good morning, Jordan.</strong></div>
                  <span>October 2026 <ChevronDown size={12} /></span>
                </div>
                <div className="preview-stat-row">
                  <div className="preview-stat-card"><span>Owed to you</span><strong>{current.owed}</strong><small>Across active work</small></div>
                  <div className="preview-stat-card"><span>Overdue</span><strong className={current.overdue === "$0" ? "" : "preview-red"}>{current.overdue}</strong><small>{persona === "Creator" ? "Needs a nudge" : "Nothing to chase"}</small></div>
                  <div className="preview-stat-card"><span>Paid this month</span><strong>{current.paid}</strong><small>This month so far</small></div>
                </div>
                <div className="preview-content-row">
                  <div className="preview-table-card">
                    <div className="preview-card-heading"><div><b>Recent deals</b><small>Your latest work</small></div><span>View all <ArrowRight size={11} /></span></div>
                    <div className="preview-table-head"><span>DEAL</span><span>STATUS</span><span>AMOUNT</span></div>
                    <div className="preview-deal-row"><div><b>{current.deal.name}</b><small>{current.deal.client}</small></div><span className={`preview-status ${current.deal.tone}`}><i />{current.deal.state}</span><strong>{current.deal.amount}</strong></div>
                  </div>
                  <div className="preview-attention-card">
                    <div className="preview-card-heading"><div><b>Needs attention</b><small>One next step at a time</small></div></div>
                    <div className="preview-reminder"><span className="reminder-mark"><FileText size={13} /></span><div><b>{current.attention}</b><small>{current.attentionNote}</small></div><ArrowRight size={14} /></div>
                    <div className="preview-income"><small>PAID INCOME · LAST 6 MONTHS</small><div className="preview-bars">{[28, 45, 33, 67, 53, 83].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="preview-months"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-shadow-note"><span className="note-check"><Check size={14} /></span> Every deal has a next step.</div>
        </div>
      </section>

      <section className="landing-benefits" id="how-it-works">
        <div><span className="benefit-number">01</span><h2>Keep every deal moving.</h2><p>Track the client, terms, and deliverables without another spreadsheet.</p></div>
        <div><span className="benefit-number">02</span><h2>Invoice while it is fresh.</h2><p>Turn finished work into a clear invoice, ready to send.</p></div>
        <div><span className="benefit-number">03</span><h2>Know what is still owed.</h2><p>See what is paid, what is late, and what needs a gentle reminder.</p></div>
      </section>

      <footer className="landing-footer"><Logo size={27} /><span>Clear work. Clear payments.</span><div><Link href="/pricing">Pricing</Link><Link href="/signin">Sign in</Link></div></footer>
    </main>
  );
}
