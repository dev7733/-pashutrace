import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('h-9 w-9', className)} role="img" aria-label="PashuTrace logo">
      <rect width="48" height="48" rx="13" fill="rgb(var(--brand))" />
      {/* ear tag */}
      <path d="M24 9c-6.1 0-11 4.5-11 10.2 0 3.6 2 6.6 5 8.4V35a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7.4c3-1.8 5-4.8 5-8.4C35 13.5 30.100 9 24 9Z" fill="rgb(var(--brand-fg))" opacity=".95" />
      <circle cx="24" cy="19.500" r="4.200" fill="rgb(var(--brand))" />
      <circle cx="24" cy="19.500" r="1.600" fill="rgb(var(--accent))" />
      {/* signal arcs */}
      <path d="M9 12.500a19 19 0 0 0 0 23" fill="none" stroke="rgb(var(--brand-fg))" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      <path d="M39 12.500a19 19 0 0 1 0 23" fill="none" stroke="rgb(var(--brand-fg))" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

export function Logo({ href = '/', className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5', className)} aria-label="PashuTrace home">
      <LogoMark className="transition group-hover:rotate-[-4deg]" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-xl font-semibold tracking-tight">PashuTrace</span>
          <span className="mt-0.5 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Identify · Trace · Protect</span>
        </span>
      )}
    </Link>
  );
}
