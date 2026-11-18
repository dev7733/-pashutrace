'use client';

import Link from 'next/link';
import { CalendarClock, ClipboardList, HeartPulse, Stethoscope } from 'lucide-react';
import { Card, CardHeader, LinkButton, PageHeader, PriorityBadge, StatTile, StatusBadge } from '@/components/ui';
import { useApp } from '@/lib/store';
import { assignedCases, byId, followUpState, isOpen, sortByUrgency } from '@/lib/selectors';
import { timeAgo } from '@/lib/utils';

export default function VetDashboard() {
  const { db, user } = useApp();
  if (!user) return null;
  const mine = sortByUrgency(user.role === 'admin' ? db.cases.filter(isOpen) : assignedCases(db, user).filter(isOpen));
  const records = db.medical.filter((m) => user.role === 'admin' || m.vetId === user.id);
  const due = records.filter((m) => ['overdue', 'today'].includes(followUpState(m)));
  const week = records.filter((m) => Date.now() - new Date(m.at).getTime() < 7 * 86_400_000).length;
  return (
    <>
      <PageHeader eyebrow="Veterinary" title="Clinical overview" subtitle="Your examinations, treatments and follow-ups." actions={<LinkButton href="/operations/scan" variant="secondary">Scan a tag</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Assigned cases" value={mine.length} icon={<ClipboardList className="h-4 w-4" />} href="/veterinary/cases" />
        <StatTile label="Under treatment" value={mine.filter((c) => c.status === 'under_treatment').length} icon={<HeartPulse className="h-4 w-4" />} tone="danger" />
        <StatTile label="Follow-ups due" value={due.length} icon={<CalendarClock className="h-4 w-4" />} tone="accent" href="/veterinary/follow-ups" hint="Today or overdue" />
        <StatTile label="Records this week" value={week} icon={<Stethoscope className="h-4 w-4" />} tone="info" href="/veterinary/medical-records" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Examinations waiting" action={<Link href="/veterinary/cases" className="text-sm font-semibold text-brand">All</Link>} />
          <ul className="divide-y divide-line">
            {mine.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/operations/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface2/50"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.title}</span><span className="text-xs text-muted">{c.code} · {timeAgo(c.createdAt)}</span></span><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></Link></li>
            ))}
            {!mine.length && <li className="p-5 text-sm text-muted">No cases assigned to you right now.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Follow-ups due" action={<Link href="/veterinary/follow-ups" className="text-sm font-semibold text-brand">All</Link>} />
          <ul className="divide-y divide-line">
            {due.slice(0, 6).map((m) => (
              <li key={m.id} className="px-5 py-3 text-sm"><div className="font-medium">{byId(db.animals, m.animalId)?.label}</div><div className="text-muted">{m.diagnosis} · due {m.followUpDate}</div></li>
            ))}
            {!due.length && <li className="p-5 text-sm text-muted">Nothing due. Nicely done.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
