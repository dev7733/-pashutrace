'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardHeader, Field, Input, Notice, PageHeader, Segmented, Select, Textarea, useToast } from '@/components/ui';
import { ScanPanel } from '@/components/ScanPanel';
import { guessIdentifierType, findAnimalByIdentifier, intakeAnimal, useApp } from '@/lib/store';
import { assignedCases, openIntake } from '@/lib/selectors';
import { CONDITION_LABEL, SPECIES_LABEL } from '@/lib/meta';
import type { Animal, Condition, Species } from '@/lib/types';

export default function Intake() {
  const { db, user } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [orgId, setOrgId] = useState('');
  const [animalId, setAnimalId] = useState('');
  const [label, setLabel] = useState('');
  const [species, setSpecies] = useState<Species>('cow');
  const [sex, setSex] = useState<Animal['sex']>('unknown');
  const [color, setColor] = useState('');
  const [tag, setTag] = useState('');
  const [caseId, setCaseId] = useState('');
  const [condition, setCondition] = useState<Condition>('healthy');
  const [pen, setPen] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  const cases = (user.role === 'admin' ? db.cases : assignedCases(db, user)).filter((c) => ['accepted', 'in_progress', 'under_treatment'].includes(c.status));
  const candidates = db.animals.filter((a) => a.status !== 'deceased' && !openIntake(db, a.id));

  const onScan = (v: string) => {
    const hit = findAnimalByIdentifier(db, v);
    if (hit) {
      if (openIntake(db, hit.id)) toast('That animal is already in a shelter.', 'error');
      else { setMode('existing'); setAnimalId(hit.id); toast(`Matched: ${hit.label}`); }
    } else { setMode('new'); setTag(v); toast('Unknown tag — register it as a new animal.', 'info'); }
  };

  const submit = () => {
    setError(null);
    const r = intakeAnimal({
      orgId: orgId || undefined,
      animalId: mode === 'existing' ? animalId : undefined,
      newAnimal: mode === 'new' ? { label, species, sex, color, identifiers: tag.trim() ? [{ type: guessIdentifierType(tag), value: tag }] : [] } : undefined,
      caseId: caseId || undefined,
      condition, pen, notes,
    });
    if (!r.ok) return setError(r.error);
    toast('Animal admitted');
    router.push('/gaushala/animals');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Gaushala" title="Animal intake" subtitle="Scan the tag to find the animal, or register a new one." />
      <div className="space-y-5">
        <Card><CardHeader title="Scan tag" /><div className="p-4"><ScanPanel onResult={(r) => onScan(r.value)} /></div></Card>
        <Card>
          <CardHeader title="Animal" action={<Segmented value={mode} onChange={setMode} options={[{ value: 'existing', label: 'Existing' }, { value: 'new', label: 'New animal' }]} />} />
          <div className="space-y-4 p-5">
            {user.role === 'admin' && <Field label="Receiving shelter" required><Select value={orgId} onChange={(e) => setOrgId(e.target.value)}><option value="">Choose…</option>{db.organizations.filter((o) => o.type === 'gaushala' && o.verified).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>}
            {mode === 'existing' ? (
              <Field label="Registered animal" required><Select value={animalId} onChange={(e) => setAnimalId(e.target.value)}><option value="">Choose…</option>{candidates.map((a) => <option key={a.id} value={a.id}>{a.label} {a.identifiers[0] ? `· ${a.identifiers[0].value}` : ''}</option>)}</Select></Field>
            ) : (
              <>
                <Field label="Description" required hint="e.g. Brown cow, white patch on forehead"><Input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Species"><Select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>{Object.entries(SPECIES_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                  <Field label="Sex"><Select value={sex} onChange={(e) => setSex(e.target.value as Animal['sex'])}><option value="unknown">Unknown</option><option value="female">Female</option><option value="male">Male</option></Select></Field>
                  <Field label="Colour"><Input value={color} onChange={(e) => setColor(e.target.value)} /></Field>
                </div>
                <Field label="Tag / chip ID (optional)" hint="UHF chip (24 hex), 15-digit RFID, 12-digit Pashu Aadhaar, or QR text"><Input value={tag} onChange={(e) => setTag(e.target.value)} className="font-mono" /></Field>
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Admission" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Condition"><Select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>{Object.entries(CONDITION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Pen / shed"><Input value={pen} onChange={(e) => setPen(e.target.value)} placeholder="Pen A3" /></Field>
            <Field label="Linked rescue case" className="sm:col-span-2"><Select value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">None</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</Select></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
        </Card>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="flex justify-end"><Button size="lg" onClick={submit}>Admit animal</Button></div>
      </div>
    </div>
  );
}
