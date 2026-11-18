import { cn } from './utils';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg hover:brightness-110 shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface2',
  ghost: 'text-ink hover:bg-surface2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15',
  accent: 'bg-accent text-white hover:brightness-110 shadow-sm dark:text-black',
};
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

