'use client';

import { cn } from '@/lib/utils';

export interface Datum {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = [
  'rgb(var(--brand))',
  'rgb(var(--accent))',
  'rgb(var(--info))',
  'rgb(var(--danger))',
  'rgb(var(--warn))',
  'rgb(var(--muted))',
];

/** Horizontal bars — accessible, no SVG needed. */
export function BarList({ data, className, unit = '' }: { data: Datum[]; className?: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-sm text-muted">No data yet.</p>;
  return (
    <ul className={cn('space-y-2.5', className)}>
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{d.label}</span>
            <span className="tabular-nums text-muted">
              {d.value}
              {unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2" role="img" aria-label={`${d.label}: ${d.value}${unit}`}>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? PALETTE[i % PALETTE.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ data, height = 160, className }: { data: Datum[]; height?: number; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / Math.max(data.length, 1);
  return (
    <div className={className}>
      <svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Column chart">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={(height / 4) * (1 - g)} y2={(height / 4) * (1 - g)} stroke="rgb(var(--line))" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 4 - 2);
          return (
            <rect
              key={d.label}
              x={i * barW + barW * 0.18}
              y={height / 4 - h}
              width={barW * 0.64}
              height={Math.max(h, 0.4)}
              rx="1"
              fill={d.color ?? 'rgb(var(--brand))'}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <div className="text-xs font-medium tabular-nums">{d.value}</div>
            <div className="truncate text-[10px] text-muted">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({ data, size = 140, centerLabel }: { data: Datum[]; size?: number; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.915;
  let offset = 25;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label="Distribution chart">
          <circle cx="21" cy="21" r={r} fill="none" stroke="rgb(var(--surface2))" strokeWidth="5" />
          {total > 0 &&
            data.map((d, i) => {
              const frac = (d.value / total) * 100;
              const el = (
                <circle
                  key={d.label}
                  cx="21"
                  cy="21"
                  r={r}
                  fill="none"
                  stroke={d.color ?? PALETTE[i % PALETTE.length]}
                  strokeWidth="5"
                  strokeDasharray={`${frac} ${100 - frac}`}
                  strokeDashoffset={offset}
                >
                  <title>{`${d.label}: ${d.value}`}</title>
                </circle>
              );
              offset -= frac;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display text-2xl font-semibold tabular-nums">{total}</div>
            {centerLabel && <div className="text-[10px] uppercase tracking-wide text-muted">{centerLabel}</div>}
          </div>
        </div>
      </div>
      <ul className="min-w-[140px] flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
              {d.label}
            </span>
            <span className="tabular-nums text-muted">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Gauge({ value, max, label }: { value: number; max: number; label?: string }) {
  const frac = max > 0 ? Math.min(1, value / max) : 0;
  const tone = frac > 0.9 ? 'rgb(var(--danger))' : frac > 0.7 ? 'rgb(var(--accent))' : 'rgb(var(--brand))';
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-display text-3xl font-semibold tabular-nums">
          {value}
          <span className="text-base font-normal text-muted"> / {max}</span>
        </span>
        <span className="text-muted">{Math.round(frac * 100)}% full</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label ?? 'Occupancy'}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${frac * 100}%`, background: tone }} />
      </div>
    </div>
  );
}
