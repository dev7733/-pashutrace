'use client';

import { Card, CardHeader, PageHeader, StatTile } from '@/components/ui';
import { BarList, ColumnChart, Donut } from '@/components/charts';
import { useApp } from '@/lib/store';
import { CATEGORY_LABEL, CASE_STATUS_LABEL, CASE_STATUSES, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR } from '@/lib/meta';
import { isOpen, orgName } from '@/lib/selectors';
import { formatDuration, pct } from '@/lib/utils';
import type { Priority } from '@/lib/types';

export default function Analytics() {
  const { db } = useApp();
  const total = db.cases.length;
  const done = db.cases.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const day = 86_400_000;
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setTime(start.getTime() - (13 - i) * day);
    const n = db.cases.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= start.getTime() && t < start.getTime() + day; }).length;
    return { label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).replace(' ', ' '), value: n };
  });
  const resolved = db.cases.filter((c) => c.status === 'resolved' || c.status === 'closed').map((c) => new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()).sort((a, b) => a - b);
  const median = resolved.length ? resolved[Math.floor(resolved.length / 2)]! : 0;
  const orgLoad = db.organizations.filter((o) => o.type !== 'municipal').map((o) => ({ label: o.name, value: db.cases.filter((c) => c.assignedOrgId === o.id && isOpen(c)).length })).sort((a, b) => b.value - a.value);
  const prio = (['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => ({ label: PRIORITY_LABEL[p], value: db.cases.filter((c) => c.priority === p).length, color: PRIORITY_COLOR[p] }));
  const offline = db.sightings.filter((s) => !s.synced).length;
  return (
    <>
      <PageHeader eyebrow="Administration" title="Analytics" subtitle="How the network is performing." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total reports" value={total} />
        <StatTile label="Resolution rate" value={`${pct(done, total)}%`} tone="info" hint={`${done} of ${total}`} />
        <StatTile label="Median time to resolve" value={resolved.length ? formatDuration(median) : '—'} tone="accent" />
        <StatTile label="Awaiting sync" value={offline} tone="muted" hint="Offline records" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2"><CardHeader title="Reports per day" subtitle="Last 14 days" /><div className="p-5"><ColumnChart data={days} /></div></Card>
        <Card><CardHeader title="By status" /><div className="p-5"><Donut data={CASE_STATUSES.map((s) => ({ label: CASE_STATUS_LABEL[s], value: db.cases.filter((c) => c.status === s).length, color: STATUS_COLOR[s] })).filter((d) => d.value)} centerLabel="cases" /></div></Card>
        <Card><CardHeader title="By priority" /><div className="p-5"><BarList data={prio} /></div></Card>
        <Card><CardHeader title="By category" /><div className="p-5"><BarList data={(Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>).map((k) => ({ label: CATEGORY_LABEL[k], value: db.cases.filter((c) => c.category === k).length }))} /></div></Card>
        <Card><CardHeader title="Open workload by organisation" /><div className="p-5"><BarList data={orgLoad} /></div></Card>
      </div>
    </>
  );
}
