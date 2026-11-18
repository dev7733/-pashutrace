'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, Chip, PageHeader, PriorityBadge, StatusBadge } from '@/components/ui';
import { MapView } from '@/components/MapView';
import { useApp } from '@/lib/store';
import { hotspots, isOpen, sortByUrgency } from '@/lib/selectors';
import { CATEGORY_LABEL, PRIORITY_COLOR } from '@/lib/meta';
import type { CaseCategory } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

export default function SightingMap() {
  const { db } = useApp();
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [cat, setCat] = useState<CaseCategory | 'all'>('all');
  const [showSpots, setShowSpots] = useState(true);
  const [sel, setSel] = useState<string | null>(null);

  const cases = useMemo(() => sortByUrgency(db.cases.filter((c) => (!onlyOpen || isOpen(c)) && (cat === 'all' || c.category === cat))), [db.cases, onlyOpen, cat]);
  const spots = useMemo(() => hotspots(cases), [cases]);
  const markers = useMemo(() => cases.map((c) => ({
    id: c.id, lat: c.lat, lng: c.lng, color: PRIORITY_COLOR[c.priority], pulse: c.priority === 'critical' && isOpen(c),
    glyph: c.category === 'suspected_transport' ? 'T' : '', title: c.title,
    popup: { title: c.title, lines: [`${c.code} · ${c.priority}`, c.landmark], href: `/operations/cases/${c.id}`, linkLabel: 'Open case →' },
  })), [cases]);
  const circles = useMemo(() => (showSpots ? spots.map((s) => ({ lat: s.lat, lng: s.lng, radius: 450, color: '#ef4444', label: `${s.count} reports near ${s.label}` })) : []), [spots, showSpots]);

  return (
    <>
      <PageHeader eyebrow="Operations" title="Sighting map" subtitle="Colour shows priority. A “T” marks suspected transport. Red circles are recurring hotspots." />
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={onlyOpen} onClick={() => setOnlyOpen((v) => !v)}>Open cases only</Chip>
        <Chip active={showSpots} onClick={() => setShowSpots((v) => !v)}>Hotspots</Chip>
        <span className="mx-1 w-px bg-line" />
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>All types</Chip>
        {(Object.keys(CATEGORY_LABEL) as CaseCategory[]).map((k) => <Chip key={k} active={cat === k} onClick={() => setCat(k)}>{CATEGORY_LABEL[k]}</Chip>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <MapView height="620px" markers={markers} circles={circles} selectedId={sel} onSelect={setSel} ariaLabel="All sightings" />
        <Card className="max-h-[620px] overflow-y-auto">
          <div className="sticky top-0 border-b border-line bg-surface px-4 py-3 text-sm font-semibold">{cases.length} case{cases.length === 1 ? '' : 's'}</div>
          <ul className="divide-y divide-line">
            {cases.map((c) => (
              <li key={c.id} className={cn('px-4 py-3', sel === c.id && 'bg-brand/8')}>
                <button type="button" className="w-full text-left" onClick={() => setSel(c.id)}>
                  <span className="block text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-muted">{c.code} · {timeAgo(c.createdAt)}</span>
                </button>
                <div className="mt-1.5 flex items-center gap-2"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /><Link href={`/operations/cases/${c.id}`} className="ml-auto text-xs font-semibold text-brand">Open</Link></div>
              </li>
            ))}
            {!cases.length && <li className="p-5 text-sm text-muted">Nothing to show with these filters.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
