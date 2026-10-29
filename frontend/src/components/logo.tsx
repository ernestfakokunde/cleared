import { brand } from "@/config/brand";

type LogoProps = { variant?: "tile" | "wordmark"; size?: number; className?: string };

export function Logo({ variant = "wordmark", size = 40, className = "" }: LogoProps) {
  return (
    <span className={`logo ${className}`} aria-label={brand.name}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="#0E1116" />
        <path d="M14 25.5L21 32.5L34.5 16" stroke="#3DDC97" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {variant === "wordmark" && <span className="logo-word">cleared</span>}
    </span>
  );
}
