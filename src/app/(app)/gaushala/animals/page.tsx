'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Field, Modal, PageHeader, SearchBox, Segmented, Select, Textarea, useToast, Badge, TableWrap, tdCls, thCls } from '@/components/ui';
import { exitAnimal, useApp } from '@/lib/store';
import { byId, orgName } from '@/lib/selectors';
import { CONDITION_LABEL } from '@/lib/meta';
import { formatDate } from '@/lib/utils';

export default function ShelterRecords() {
  const { db, user } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const [q, setQ] = useState('');
  const [exitId, setExitId] = useState<string | null>(null);
  const [reason, setReason] = useState<'released' | 'transferred' | 'deceased'>('released');
  const [note, setNote] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return db.intakes
      .filter((i) => (user?.role === 'admin' || i.orgId === user?.orgId) && (tab === 'current' ? !i.exitedAt : !!i.exitedAt))
      .filter((i) => { const a = byId(db.animals, i.animalId); return !n || [a?.label, a?.identifiers.map((x) => x.value).join(' '), i.pen].join(' ').toLowerCase().includes(n); })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [db, tab, q, user]);
  if (!user) return null;
  return (
    <>
      <PageHeader eyebrow="Gaushala" title="Shelter records" subtitle="Every animal admitted, and where they went." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'current', label: 'In shelter' }, { value: 'past', label: 'Past' }]} />
          <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search animal, tag or pen…" /></div>
        </div>
        {rows.length ? (
          <TableWrap>
            <thead><tr><th className={thCls}>Animal</th>{user.role === 'admin' && <th className={thCls}>Shelter</th>}<th className={thCls}>Pen</th><th className={thCls}>Condition</th><th className={thCls}>Admitted</th><th className={thCls}>{tab === 'current' ? '' : 'Outcome'}</th></tr></thead>
            <tbody>
              {rows.map((i) => {
                const a = byId(db.animals, i.animalId);
                return (
                  <tr key={i.id}>
                    <td className={tdCls}><Link href={`/animal/${i.animalId}`} className="font-medium hover:text-brand hover:underline">{a?.label}</Link><div className="font-mono text-xs text-muted">{a?.identifiers[0]?.value ?? 'no tag'}</div></td>
                    {user.role === 'admin' && <td className={`${tdCls} text-muted`}>{orgName(db, i.orgId)}</td>}
                    <td className={tdCls}>{i.pen ?? '—'}</td>
                    <td className={tdCls}>{CONDITION_LABEL[i.condition]}</td>
                    <td className={`${tdCls} whitespace-nowrap text-muted`}>{formatDate(i.at)}</td>
                    <td className={tdCls}>{tab === 'current' ? <Button size="sm" variant="secondary" onClick={() => { setExitId(i.id); setReason('released'); setNote(''); }}>Release / transfer</Button> : <Badge className="bg-muted/15 text-muted ring-muted/25 capitalize">{i.exitReason}</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : <div className="p-4"><EmptyState title={tab === 'current' ? 'No animals in the shelter' : 'No past records'} /></div>}
      </Card>
      <Modal open={!!exitId} onClose={() => setExitId(null)} size="sm" title="Close shelter record" footer={<><Button variant="ghost" onClick={() => setExitId(null)}>Cancel</Button><Button onClick={() => { const r = exitAnimal(exitId!, reason, note); if (r.ok) { toast('Record updated'); setExitId(null); } else toast(r.error, 'error'); }}>Confirm</Button></>}>
        <div className="space-y-4">
          <Field label="Outcome"><Select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}><option value="released">Released / returned to owner</option><option value="transferred">Transferred to another shelter</option><option value="deceased">Deceased</option></Select></Field>
          <Field label={reason === 'released' ? 'Note (optional)' : 'Note (required)'}><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  );
}
