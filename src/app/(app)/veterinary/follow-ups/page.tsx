'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, useToast } from '@/components/ui';
import { completeFollowUp, useApp } from '@/lib/store';
import { byId, followUpState } from '@/lib/selectors';
import { formatDate } from '@/lib/utils';

const GROUPS = [
  { key: 'overdue', label: 'Overdue', tone: 'bg-danger/12 text-danger ring-danger/25' },
  { key: 'today', label: 'Due today', tone: 'bg-accent/15 text-accent ring-accent/30' },
  { key: 'soon', label: 'This week', tone: 'bg-info/12 text-info ring-info/25' },
  { key: 'later', label: 'Later', tone: 'bg-muted/15 text-muted ring-muted/25' },
] as const;

export default function FollowUps() {
  const { db, user } = useApp();
  const { toast } = useToast();
  if (!user) return null;
  const list = db.medical.filter((m) => m.followUpDate && !m.followUpDone && (user.role === 'admin' || m.vetId === user.id)).sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));
  const done = db.medical.filter((m) => m.followUpDone && (user.role === 'admin' || m.vetId === user.id)).length;
  return (
    <>
      <PageHeader eyebrow="Veterinary" title="Follow-ups" subtitle={`${list.length} open · ${done} completed`} />
      {!list.length && <EmptyState title="No open follow-ups" body="Add a follow-up date when saving a medical record." />}
      <div className="space-y-6">
        {GROUPS.map((g) => {
          const items = list.filter((m) => followUpState(m) === g.key);
          if (!items.length) return null;
          return (
            <Card key={g.key}>
              <CardHeader title={<span className="flex items-center gap-2">{g.label}<Badge className={g.tone}>{items.length}</Badge></span>} />
              <ul className="divide-y divide-line">
                {items.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/animal/${m.animalId}`} className="text-sm font-medium hover:text-brand hover:underline">{byId(db.animals, m.animalId)?.label}</Link>
                      <div className="text-xs text-muted">{m.diagnosis} · due {formatDate(m.followUpDate!)}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => { const r = completeFollowUp(m.id); toast(r.ok ? 'Follow-up completed' : r.error, r.ok ? 'ok' : 'error'); }}><Check className="h-4 w-4" />Done</Button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
