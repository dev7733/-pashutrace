'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge, AnimalStatusBadge, useToast } from '@/components/ui';
import { MapView } from '@/components/MapView';
import { IdentifierPills } from '@/components/AnimalCard';
import { MedicalModal } from '@/components/CaseDetail';
import { addIdentifier, updateAnimal, useApp, guessIdentifierType } from '@/lib/store';
import { byId, medicalForAnimal, openIntake, orgName, sightingsForAnimal, userName } from '@/lib/selectors';
import { ANIMAL_STATUSES, ANIMAL_STATUS_LABEL, SPECIES_LABEL } from '@/lib/meta';
import { can } from '@/lib/permissions';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { AnimalStatus } from '@/lib/types';

export default function AnimalPage() {
  const { id } = useParams<{ id: string }>();
  const { db, user } = useApp();
  const { toast } = useToast();
  const [med, setMed] = useState(false);
  const [idOpen, setIdOpen] = useState(false);
  const [idVal, setIdVal] = useState('');
  const a = byId(db.animals, id);
  if (!user) return null;
  if (!a) return <EmptyState title="Animal not found" action={<Link href="/operations/scan" className="text-sm font-semibold text-brand">Scan a tag</Link>} />;

  const sightings = sightingsForAnimal(db, a.id);
  const cases = db.cases.filter((c) => c.animalId === a.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const medical = medicalForAnimal(db, a.id);
  const intake = openIntake(db, a.id);
  const editor = user.role === 'admin' || user.role === 'operations';
  const trail = [...sightings].reverse().map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <>
      <PageHeader eyebrow="Animal profile" title={a.label} subtitle={`${SPECIES_LABEL[a.species]} · ${a.sex}${a.color ? ` · ${a.color}` : ''} · registered ${timeAgo(a.createdAt)}`} actions={<AnimalStatusBadge status={a.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Movement trail" subtitle={`${sightings.length} sighting${sightings.length === 1 ? '' : 's'}`} />
            <div className="p-3">
              {sightings.length ? <MapView height="320px" path={trail} markers={sightings.map((s, i) => ({ id: s.id, lat: s.lat, lng: s.lng, color: i === 0 ? '#dc2626' : '#16a34a', glyph: String(sightings.length - i), popup: { title: s.landmark, lines: [formatDateTime(s.observedAt)] } }))} ariaLabel="Movement trail" /> : <p className="p-4 text-sm text-muted">No sightings yet.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Medical history" action={can(user.role, 'update_medical') && <Button size="sm" variant="secondary" onClick={() => setMed(true)}>Add record</Button>} />
            {medical.length ? (
              <ul className="divide-y divide-line">
                {medical.map((m) => (
                  <li key={m.id} className="px-5 py-3 text-sm">
                    <div className="flex flex-wrap gap-2"><span className="font-medium capitalize">{m.type.replace('_', ' ')}</span><span className="text-xs text-muted">{formatDateTime(m.at)} · {userName(db, m.vetId)}</span></div>
                    <div>{m.diagnosis}</div>
                    {(m.treatment || m.medication) && <div className="text-muted">{[m.treatment, m.medication].filter(Boolean).join(' · ')}</div>}
                  </li>
                ))}
              </ul>
            ) : <p className="p-5 text-sm text-muted">No medical records.</p>}
          </Card>
          <Card>
            <CardHeader title="Cases" />
            <ul className="divide-y divide-line">
              {cases.map((c) => <li key={c.id}><Link href={`/operations/cases/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface2/50"><span>{c.code} · {c.title}</span><StatusBadge status={c.status} /></Link></li>)}
              {!cases.length && <li className="p-5 text-sm text-muted">No cases linked.</li>}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Identity" action={editor && <Button size="sm" variant="secondary" onClick={() => setIdOpen(true)}>Add ID</Button>} />
            <div className="space-y-3 p-5 text-sm">
              <IdentifierPills animal={a} />
              <div className="flex justify-between"><span className="text-muted">Custodian</span><span>{a.orgId ? orgName(db, a.orgId) : '—'}</span></div>
              {intake && <div className="flex justify-between"><span className="text-muted">Pen</span><span>{intake.pen ?? '—'}</span></div>}
              {a.notes && <p className="text-muted">{a.notes}</p>}
              {editor && (
                <Field label="Status">
                  <Select value={a.status} onChange={(e) => { const r = updateAnimal(a.id, { status: e.target.value as AnimalStatus }); toast(r.ok ? 'Status updated' : r.error, r.ok ? 'ok' : 'error'); }}>
                    {ANIMAL_STATUSES.map((s) => <option key={s} value={s}>{ANIMAL_STATUS_LABEL[s]}</option>)}
                  </Select>
                </Field>
              )}
            </div>
          </Card>
        </div>
      </div>
      <MedicalModal open={med} onClose={() => setMed(false)} animalId={a.id} />
      <Modal open={idOpen} onClose={() => setIdOpen(false)} size="sm" title="Add identifier" description="RFID (15 digits), Pashu Aadhaar (12 digits) or QR text." footer={<><Button variant="ghost" onClick={() => setIdOpen(false)}>Cancel</Button><Button onClick={() => { const r = addIdentifier(a.id, { type: guessIdentifierType(idVal), value: idVal }); if (r.ok) { toast('Identifier added'); setIdVal(''); setIdOpen(false); } else toast(r.error, 'error'); }}>Add</Button></>}>
        <Field label="Identifier"><Input value={idVal} onChange={(e) => setIdVal(e.target.value)} className="font-mono" /></Field>
      </Modal>
    </>
  );
}
