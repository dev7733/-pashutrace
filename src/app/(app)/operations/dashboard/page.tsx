'use client';

import Link from 'next/link';
import { AlertTriangle, Inbox, Truck, UserCheck, Clock } from 'lucide-react';
import { Card, CardHeader, LinkButton, PageHeader, PriorityBadge, StatTile, StatusBadge } from '@/components/ui';
import { MapView } from '@/components/MapView';
import { BarList } from '@/components/charts';
import { useApp } from '@/lib/store';
import { hotspots, isOpen, sortByUrgency } from '@/lib/selectors';
import { CATEGORY_LABEL, PRIORITY_COLOR } from '@/lib/meta';
import { formatDuration, timeAgo } from '@/lib/utils';

export default function OperationsDashboard() {
  const { db } = useApp();
  const open = db.cases.filter(isOpen);
  const fresh = db.cases.filter((c) => c.status === 'new');
  const critical = open.filter((c) => c.priority === 'critical');
  const transport = open.filter((c) => c.category === 'suspected_transport');
  const unassigned = open.filter((c) => !c.assignedOrgId);
  const urgent = sortByUrgency(open).slice(0, 6);

  // Median time from report to first staff action.
  const gaps = db.cases.flatMap((c) => {
    const first = db.events.filter((e) => e.caseId === c.id && e.type !== 'reported').sort((a, b) => a.at.localeCompare(b.at))[0];
    return first ? [new Date(first.at).getTime() - new Date(c.createdAt).getTime()] : [];
  }).sort((a, b) => a - b);
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)]! : 0;

  const spots = hotspots(open);
  const byCat = (Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>).map((k) => ({ label: CATEGORY_LABEL[k], value: open.filter((c) => c.category === k).length })).filter((d) => d.value > 0);

  return (
    <>
      <PageHeader eyebrow="Operations" title="Command overview" subtitle="Everything that needs a decision, in order of urgency." actions={<><LinkButton href="/operations/inbox"><Inbox className="h-4 w-4" />Open inbox</LinkButton><LinkButton href="/operations/scan" variant="secondary">Scan a tag</LinkButton></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="New reports" value={fresh.length} icon={<Inbox className="h-4 w-4" />} href="/operations/inbox" tone="info" />
        <StatTile label="Critical open" value={critical.length} icon={<AlertTriangle className="h-4 w-4" />} tone="danger" href="/operations/map" />
        <StatTile label="Suspected transport" value={transport.length} icon={<Truck className="h-4 w-4" />} tone="accent" />
        <StatTile label="Unassigned" value={unassigned.length} icon={<UserCheck className="h-4 w-4" />} tone="muted" href="/operations/inbox" />
        <StatTile label="Median first response" value={gaps.length ? formatDuration(median) : '—'} icon={<Clock className="h-4 w-4" />} hint="Report → first action" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Needs attention" action={<Link href="/operations/inbox" className="text-sm font-semibold text-brand">Inbox</Link>} />
          <ul className="divide-y divide-line">
            {urgent.map((c) => (
              <li key={c.id}>
                <Link href={`/operations/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface2/50">
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLOR[c.priority] }} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.title}</span><span className="text-xs text-muted">{c.code} · {c.landmark} · {timeAgo(c.createdAt)}</span></span>
                  <PriorityBadge priority={c.priority} /><span className="hidden sm:block"><StatusBadge status={c.status} /></span>
                </Link>
              </li>
            ))}
            {!urgent.length && <li className="p-5 text-sm text-muted">No open cases. Quiet day.</li>}
          </ul>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Live map" action={<Link href="/operations/map" className="text-sm font-semibold text-brand">Expand</Link>} />
            <div className="p-3">
              <MapView height="240px" markers={open.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, color: PRIORITY_COLOR[c.priority], pulse: c.priority === 'critical', popup: { title: c.title, lines: [c.code], href: `/operations/cases/${c.id}` } }))} ariaLabel="Open cases map" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Open by type" />
            <div className="p-5"><BarList data={byCat} /></div>
          </Card>
          {spots.length > 0 && (
            <Card>
              <CardHeader title="Recurring hotspots" subtitle="Places with 2+ open reports" />
              <ul className="divide-y divide-line text-sm">{spots.slice(0, 4).map((s) => <li key={s.label} className="flex justify-between px-5 py-2.5"><span>{s.label}</span><span className="font-semibold">{s.count}</span></li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
