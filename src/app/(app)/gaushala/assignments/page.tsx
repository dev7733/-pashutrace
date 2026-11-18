'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { CaseList } from '@/components/CaseList';
import { Button, Card, CardHeader, Field, Modal, PageHeader, PriorityBadge, Textarea, useToast } from '@/components/ui';
import { changeStatus, useApp } from '@/lib/store';
import { assignedCases } from '@/lib/selectors';
import { timeAgo } from '@/lib/utils';

export default function Assignments() {
  const { db, user } = useApp();
  const { toast } = useToast();
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  if (!user) return null;
  const mine = user.role === 'admin' ? db.cases.filter((c) => c.assignedOrgId) : assignedCases(db, user);
  const awaiting = mine.filter((c) => c.status === 'assigned');
  return (
    <>
      <PageHeader eyebrow="Gaushala" title="Rescue assignments" subtitle="Accept a rescue to start work. If you cannot take it, send it back with a reason." />
      {awaiting.length > 0 && (
        <Card className="mb-6 border-accent/40">
          <CardHeader title="Awaiting your acceptance" subtitle={`${awaiting.length} case${awaiting.length === 1 ? '' : 's'}`} />
          <ul className="divide-y divide-line">
            {awaiting.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/operations/cases/${c.id}`} className="font-medium hover:text-brand hover:underline">{c.title}</Link>
                  <div className="text-xs text-muted">{c.code} · {c.landmark} · {timeAgo(c.createdAt)}</div>
                </div>
                <PriorityBadge priority={c.priority} />
                <Button size="sm" onClick={() => { const r = changeStatus(c.id, 'accepted'); toast(r.ok ? 'Rescue accepted' : r.error, r.ok ? 'ok' : 'error'); }}><Check className="h-4 w-4" />Accept</Button>
                <Button size="sm" variant="danger" onClick={() => { setDeclineId(c.id); setReason(''); }}><X className="h-4 w-4" />Decline</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <CaseList cases={mine} href={(c) => `/operations/cases/${c.id}`} showOrg={false} exportName="rescue-assignments" emptyTitle="No assignments yet" emptyBody="Operations will assign nearby rescues to your shelter." />
      <Modal open={!!declineId} onClose={() => setDeclineId(null)} size="sm" title="Decline assignment" footer={<><Button variant="ghost" onClick={() => setDeclineId(null)}>Cancel</Button><Button variant="danger" onClick={() => { const r = changeStatus(declineId!, 'under_review', reason); if (r.ok) { toast('Sent back to operations'); setDeclineId(null); } else toast(r.error, 'error'); }}>Send back</Button></>}>
        <Field label="Reason (required)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Shelter at capacity, no transport available" /></Field>
      </Modal>
    </>
  );
}
