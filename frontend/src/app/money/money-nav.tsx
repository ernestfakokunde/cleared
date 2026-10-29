import Link from "next/link";
import "./money.css";

export function MoneyNav({ active }: { active: "Overview" | "Invoices" | "Clients" }) {
  return <div className="money-tabs">{([["Overview", "/money"], ["Invoices", "/invoices"], ["Clients", "/money/clients"]] as const).map(([label, href]) => <Link key={label} href={href} className={active === label ? "money-tab active" : "money-tab"}>{label}</Link>)}</div>;
}
