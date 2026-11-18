'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { Button, Card, EmptyState, Field, Modal, PageHeader, SearchBox, Select, TableWrap, tdCls, thCls } from '@/components/ui';
import { MedicalModal } from '@/components/CaseDetail';
import { useApp } from '@/lib/store';
import { byId, userName } from '@/lib/selectors';
import { downloadCsv, formatDate } from '@/lib/utils';

export default function MedicalRecords() {
  const { db, user } = useApp();
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return db.medical
      .filter((m) => user?.role === 'admin' || m.vetId === user?.id)
      .filter((m) => !n || [byId(db.animals, m.animalId)?.label, m.diagnosis, m.treatment, m.medication, m.type].join(' ').toLowerCase().includes(n))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [db, q, user]);
  if (!user) return null;
  return (
    <>
      <PageHeader eyebrow="Veterinary" title="Medical records" subtitle="Every examination, treatment and vaccination you have recorded." actions={<><Button variant="secondary" disabled={!rows.length} onClick={() => downloadCsv('medical-records.csv', [['Date', 'Animal', 'Type', 'Diagnosis', 'Treatment', 'Medication', 'Follow-up', 'Vet'], ...rows.map((m) => [m.at, byId(db.animals, m.animalId)?.label, m.type, m.diagnosis, m.treatment, m.medication, m.followUpDate, userName(db, m.vetId)])])}><Download className="h-4 w-4" />CSV</Button><Button onClick={() => setPick(true)}><Plus className="h-4 w-4" />New record</Button></>} />
      <Card>
        <div className="border-b border-line p-4"><SearchBox value={q} onChange={setQ} placeholder="Search animal, diagnosis, medication…" /></div>
        {rows.length ? (
          <TableWrap>
            <thead><tr><th className={thCls}>Date</th><th className={thCls}>Animal</th><th className={thCls}>Type</th><th className={thCls}>Diagnosis</th><th className={thCls}>Treatment</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className={`${tdCls} whitespace-nowrap text-muted`}>{formatDate(m.at)}</td>
                  <td className={tdCls}><Link href={`/animal/${m.animalId}`} className="font-medium hover:text-brand hover:underline">{byId(db.animals, m.animalId)?.label ?? '—'}</Link></td>
                  <td className={`${tdCls} capitalize`}>{m.type.replace('_', ' ')}</td>
                  <td className={tdCls}>{m.diagnosis}</td>
                  <td className={`${tdCls} text-muted`}>{[m.treatment, m.medication].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : <div className="p-4"><EmptyState title="No records" body="Add a record from a case, or create one here." /></div>}
      </Card>
      <Modal open={pick} onClose={() => setPick(false)} size="sm" title="Which animal?" footer={<><Button variant="ghost" onClick={() => setPick(false)}>Cancel</Button><Button disabled={!animalId} onClick={() => { setPick(false); setOpen(true); }}>Continue</Button></>}>
        <Field label="Animal"><Select value={animalId} onChange={(e) => setAnimalId(e.target.value)}><option value="">Choose…</option>{db.animals.filter((a) => a.status !== 'deceased').map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</Select></Field>
      </Modal>
      {animalId && <MedicalModal open={open} onClose={() => setOpen(false)} animalId={animalId} />}
    </>
  );
}
