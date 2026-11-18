'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { AnimalStatusBadge, Button, Card, Chip, Field, Input, Modal, PageHeader, SearchBox, Select, TableWrap, tdCls, thCls, useToast } from '@/components/ui';
import { IdentifierPills } from '@/components/AnimalCard';
import { guessIdentifierType, registerAnimal, useApp } from '@/lib/store';
import { ANIMAL_STATUSES, ANIMAL_STATUS_LABEL, SPECIES_LABEL } from '@/lib/meta';
import { downloadCsv, formatDate } from '@/lib/utils';
import { lastSeen, orgName } from '@/lib/selectors';
import type { Animal, AnimalStatus, Species } from '@/lib/types';

export default function AnimalDb() {
  const { db } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [st, setSt] = useState<AnimalStatus | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [species, setSpecies] = useState<Species>('cow');
  const [sex, setSex] = useState<Animal['sex']>('unknown');
  const [status, setStatus] = useState<AnimalStatus>('community');
  const [tag, setTag] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return db.animals.filter((a) => (st === 'all' || a.status === st) && (!n || (a.label + a.identifiers.map((i) => i.value).join(' ')).toLowerCase().includes(n))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.animals, q, st]);
  const save = () => {
    const r = registerAnimal({ label, species, sex, status, identifiers: tag.trim() ? [{ type: guessIdentifierType(tag), value: tag }] : [] });
    if (r.ok) { toast('Animal registered'); setOpen(false); setLabel(''); setTag(''); } else toast(r.error, 'error');
  };
  return (
    <>
      <PageHeader eyebrow="Administration" title="Animal database" subtitle={`${db.animals.length} registered animals`} actions={<><Button variant="secondary" onClick={() => downloadCsv('animals.csv', [['Description', 'Species', 'Sex', 'Status', 'Identifiers', 'Custodian', 'Registered'], ...rows.map((a) => [a.label, a.species, a.sex, a.status, a.identifiers.map((i) => `${i.type}:${i.value}`).join(' '), orgName(db, a.orgId), a.createdAt])])}><Download className="h-4 w-4" />CSV</Button><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Register animal</Button></>} />
      <Card>
        <div className="space-y-3 border-b border-line p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search description or tag number…" />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto"><Chip active={st === 'all'} onClick={() => setSt('all')}>All</Chip>{ANIMAL_STATUSES.map((s) => <Chip key={s} active={st === s} onClick={() => setSt(s)}>{ANIMAL_STATUS_LABEL[s]}</Chip>)}</div>
        </div>
        <TableWrap>
          <thead><tr><th className={thCls}>Animal</th><th className={thCls}>Identifiers</th><th className={thCls}>Status</th><th className={thCls}>Last seen</th><th className={thCls}>Registered</th></tr></thead>
          <tbody>
            {rows.map((a) => {
              const s = lastSeen(db, a.id);
              return (
                <tr key={a.id}>
                  <td className={tdCls}><Link href={`/animal/${a.id}`} className="font-medium hover:text-brand hover:underline">{a.label}</Link><div className="text-xs text-muted">{SPECIES_LABEL[a.species]} · {a.sex}</div></td>
                  <td className={tdCls}><IdentifierPills animal={a} /></td>
                  <td className={tdCls}><AnimalStatusBadge status={a.status} /></td>
                  <td className={`${tdCls} text-muted`}>{s ? s.landmark : '—'}</td>
                  <td className={`${tdCls} whitespace-nowrap text-muted`}>{formatDate(a.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
        {!rows.length && <p className="p-6 text-sm text-muted">No animals match.</p>}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Register animal" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Register</Button></>}>
        <div className="space-y-4">
          <Field label="Description" required><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Brown cow, white forehead patch" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Species"><Select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>{Object.entries(SPECIES_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Sex"><Select value={sex} onChange={(e) => setSex(e.target.value as Animal['sex'])}><option value="unknown">Unknown</option><option value="female">Female</option><option value="male">Male</option></Select></Field>
            <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus)}>{ANIMAL_STATUSES.map((s) => <option key={s} value={s}>{ANIMAL_STATUS_LABEL[s]}</option>)}</Select></Field>
          </div>
          <Field label="Tag ID (optional)" hint="UHF chip (24 hex) · 15-digit RFID · 12-digit Pashu Aadhaar · or QR text"><Input value={tag} onChange={(e) => setTag(e.target.value)} className="font-mono" /></Field>
        </div>
      </Modal>
    </>
  );
}
