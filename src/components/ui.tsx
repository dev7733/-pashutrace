'use client';

import Link from 'next/link';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnimalStatus, CaseStatus, Priority } from '@/lib/types';
import {
  ANIMAL_STATUS_LABEL,
  ANIMAL_TONE,
  CASE_STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_TONE,
} from '@/lib/meta';

/* ----------------------------------------------------------------------------
 * Buttons
 * -------------------------------------------------------------------------- */

import { buttonClass, type Variant, type Size } from '@/lib/button-class';
export { buttonClass };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------------------------
 * Layout primitives
 * -------------------------------------------------------------------------- */

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'accent' | 'danger' | 'info' | 'muted';
  href?: string;
}) {
  const toneCls = {
    brand: 'bg-brand/12 text-brand',
    accent: 'bg-accent/15 text-accent',
    danger: 'bg-danger/12 text-danger',
    info: 'bg-info/12 text-info',
    muted: 'bg-muted/15 text-muted',
  }[tone];
  const body = (
    <Card className={cn('p-4 transition', href && 'hover:-translate-y-0.5 hover:border-brand/40')}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
        {icon && <div className={cn('grid h-8 w-8 place-items-center rounded-lg', toneCls)}>{icon}</div>}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface2 text-muted">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface2', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function Notice({ tone = 'info', title, children, className }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; title?: ReactNode; children?: ReactNode; className?: string }) {
  const map = {
    info: ['bg-info/10 border-info/25 text-ink', <Info key="i" className="h-4 w-4 text-info" />],
    warn: ['bg-warn/10 border-warn/30 text-ink', <AlertTriangle key="i" className="h-4 w-4 text-warn" />],
    danger: ['bg-danger/10 border-danger/30 text-ink', <AlertTriangle key="i" className="h-4 w-4 text-danger" />],
    ok: ['bg-ok/10 border-ok/30 text-ink', <CheckCircle2 key="i" className="h-4 w-4 text-ok" />],
  } as const;
  const [cls, icon] = map[tone];
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', cls, className)} role={tone === 'danger' ? 'alert' : 'note'}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(title ? 'mt-0.5 text-muted' : undefined)}>{children}</div>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Badges
 * -------------------------------------------------------------------------- */

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <Badge className={STATUS_TONE[status]}>{CASE_STATUS_LABEL[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={PRIORITY_TONE[priority]}>
      {priority === 'critical' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />}
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}

export function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  return <Badge className={ANIMAL_TONE[status]}>{ANIMAL_STATUS_LABEL[status]}</Badge>;
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand', className)} aria-hidden>
      {letters || '?'}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * Form controls
 * -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  const autoId = useId();
  let control = children;
  let controlId = htmlFor ?? autoId;
  if (isValidElement<{ id?: string }>(children)) {
    controlId = children.props.id ?? htmlFor ?? autoId;
    if (children.props.id === undefined) control = cloneElement(children, { id: controlId });
  }
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={controlId} className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {control}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field-input', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field-input appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field-input min-h-[88px] resize-y', className)} {...rest} />;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode }>;
  className?: string;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface2 p-1 no-scrollbar', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition',
        active ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field-input pl-9"
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Modal
 * -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
      first?.focus();
    }, 30);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:rounded-3xl', width)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button data-close type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-ink" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface2/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Toasts
 * -------------------------------------------------------------------------- */

interface ToastItem {
  id: number;
  tone: 'ok' | 'error' | 'info';
  text: string;
}
const ToastCtx = createContext<{ toast: (text: string, tone?: ToastItem['tone']) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const toast = useCallback((text: string, tone: ToastItem['tone'] = 'ok') => {
    const id = ++idRef.current;
    setItems((s) => [...s.slice(-3), { id, tone, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[2000] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex max-w-md animate-rise items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-pop',
              t.tone === 'ok' && 'border-ok/30 bg-surface text-ink',
              t.tone === 'error' && 'border-danger/40 bg-surface text-ink',
              t.tone === 'info' && 'border-info/30 bg-surface text-ink',
            )}
            role={t.tone === 'error' ? 'alert' : 'status'}
          >
            {t.tone === 'ok' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />}
            {t.tone === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
            {t.tone === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ----------------------------------------------------------------------------
 * Theme
 * -------------------------------------------------------------------------- */

function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
}

export function setTheme(mode: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  try {
    localStorage.setItem('pt-theme', mode);
  } catch {
    /* ignore */
  }
}

/* ----------------------------------------------------------------------------
 * Data table wrapper
 * -------------------------------------------------------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>;
}
export const thCls = 'whitespace-nowrap border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted';
export const tdCls = 'border-b border-line/70 px-4 py-3 align-middle';

export function Timeline({
  items,
}: {
  items: Array<{ id: string; at: string; title: ReactNode; body?: ReactNode; tone?: 'brand' | 'accent' | 'danger' | 'muted'; icon?: ReactNode; meta?: ReactNode }>;
}) {
  return (
    <ol className="relative space-y-5 border-l border-line pl-6">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            className={cn(
              'absolute -left-[34px] top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-surface text-[10px]',
              it.tone === 'accent' && 'bg-accent text-white',
              it.tone === 'danger' && 'bg-danger text-white',
              it.tone === 'muted' && 'bg-muted text-white',
              (!it.tone || it.tone === 'brand') && 'bg-brand text-brand-fg',
            )}
          >
            {it.icon}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium">{it.title}</span>
            {it.meta && <span className="text-xs text-muted">{it.meta}</span>}
          </div>
          {it.body && <div className="mt-0.5 text-sm text-muted">{it.body}</div>}
          <div className="mt-0.5 text-xs text-muted/80" suppressHydrationWarning>
            {it.at}
          </div>
        </li>
      ))}
    </ol>
  );
}
