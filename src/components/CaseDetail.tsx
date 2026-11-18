'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Check, MapPin, Truck, UserCheck } from 'lucide-react';
import {
  addCaseNote,
  addMedicalRecord,
  addSighting,
  assignCase,
  canViewCase,
  changeStatus,
  linkAnimal,
  setPriority,
  useApp,
} from '@/lib/store';
import { allowedTransitions, ASSIGNABLE_FROM, reporterStepIndex, REPORTER_STEPS, type Transition } from '@/lib/workflow';
import { can } from '@/lib/permissions';
import {
  CASE_STATUS_LABEL,
  CATEGORY_LABEL,
  CONDITION_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  SPECIES_LABEL,
} from '@/lib/meta';
import { assignableOrgs, byId, eventsForCase, medicalForAnimal, membersOf, orgName, sightingsForCase, userName } from '@/lib/selectors';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { Condition, MedicalRecord, Priority } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Notice,
  PriorityBadge,
  Select,
  StatusBadge,
  Textarea,
  Timeline,
  useToast,
} from './ui';
import { MapView } from './MapView';
import { AnimalMatch } from './AnimalCard';
import { LocationPicker, type GeoValue } from './LocationPicker';

export function CaseDetail({ caseId, backHref, backLabel }: { caseId: string; backHref: string; backLabel: string }) {
  const { db, user } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const c = byId(db.cases, caseId);

  const [transition, setTransition] = useState<Transition | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [sightingOpen, setSightingOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteVis, setNoteVis] = useState<'public' | 'internal'>('public');

  const transitions = useMemo(() => (user && c ? allowedTransitions(user, c) : []), [user, c]);

  if (!user) return null;
  if (!c) {
    return (
      <EmptyState title="Case not found" body="It may have been removed, or the link is wrong." action={<Link href={backHref} className="text-sm font-semibold text-brand">← {backLabel}</Link>} />
    );
  }
  if (!canViewCase(user, c)) {
    return <EmptyState title="You do not have access to this case" body="Cases are visible to their reporter, the assigned team and operations staff." action={<Link href={backHref} className="text-sm font-semibold text-brand">← {backLabel}</Link>} />;
  }

  const staff = user.role !== 'community';
  const isReporterView = c.reporterId === user.id && !staff;
  const events = eventsForCase(db, c.id, staff);
  const sightings = sightingsForCase(db, c.id);
  const animal = byId(db.animals, c.animalId);
  const medical = animal && staff ? medicalForAnimal(db, animal.id) : [];
  const canAssign = can(user.role, 'assign_cases') && ASSIGNABLE_FROM.includes(c.status) && (user.role !== 'vet' || (c.assignedOrgId === user.orgId));
  const canMedical = can(user.role, 'update_medical') && !!animal;
  const dupOf = byId(db.cases, c.possibleDuplicateOf ?? c.duplicateOf);

  const run = (fn: () => { ok: boolean; error?: string } | { ok: true } | { ok: false; error: string }, okMsg: string) => {
    const r = fn() as { ok: boolean; error?: string };
    if (r.ok) toast(okMsg);
    else toast(r.error ?? 'Something went wrong.', 'error');
    return r.ok;
  };

  const doTransition = () => {
    if (!transition) return;
    setBusy(true);
    const ok = run(() => changeStatus(c.id, transition.to, note), `Status changed to ${CASE_STATUS_LABEL[transition.to]}`);
    setBusy(false);
    if (ok) {
      setTransition(null);
      setNote('');
    }
  };

  const markers = sightings.map((s, i) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    color: PRIORITY_COLOR[c.priority],
    glyph: String(sightings.length - i),
    popup: { title: s.landmark, lines: [timeAgo(s.observedAt), `${CONDITION_LABEL[s.condition]} · ${s.count} animal${s.count === 1 ? '' : 's'}`] },
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted">{c.code}</span>
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
              <Badge className="bg-surface2 text-muted ring-line">{CATEGORY_LABEL[c.category]}</Badge>
              {c.species && <Badge className="bg-brand/10 text-brand ring-brand/25">{SPECIES_LABEL[c.species]}</Badge>}
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{c.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4" />{c.landmark} · reported {timeAgo(c.createdAt)} by {userName(db, c.reporterId)}</p>
          </div>
          {staff && (
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <Button key={t.to} variant={t.tone === 'primary' ? 'primary' : t.tone === 'danger' ? 'danger' : 'secondary'} onClick={() => { setTransition(t); setNote(''); }}>
                  {t.label}
                </Button>
              ))}
              {canAssign && (
                <Button variant="accent" onClick={() => setAssignOpen(true)}>
                  <UserCheck className="h-4 w-4" /> {c.assignedOrgId ? (user.role === 'vet' ? 'Refer to gaushala' : 'Reassign') : 'Assign team'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isReporterView && (
        <Card className="p-5">
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-label="Progress">
            {REPORTER_STEPS.map((s, i) => {
              const cur = reporterStepIndex(c.status);
              const done = i < cur || c.status === 'closed';
              const active = i === cur && c.status !== 'closed';
              return (
                <li key={s.key} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? 'bg-brand text-brand-fg' : active ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`text-sm ${active ? 'font-semibold' : 'text-muted'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
          {['rejected', 'duplicate'].includes(c.status) && (
            <Notice tone="warn" className="mt-4" title={c.status === 'rejected' ? 'This report was closed without action' : 'Merged with an existing report'}>
              {c.status === 'rejected' ? 'See the update below for the reason.' : 'Another report already covers this animal, so the team is tracking it there.'}
            </Notice>
          )}
        </Card>
      )}

      {staff && dupOf && dupOf.id !== c.id && (
        <Notice tone="warn" title={c.status === 'duplicate' ? 'Marked as duplicate' : 'Possible duplicate'}>
          Looks like a repeat of{' '}
          <Link className="font-semibold text-brand underline" href={`/operations/cases/${dupOf.id}`}>{dupOf.code} — {dupOf.title}</Link>.
        </Notice>
      )}

      {c.transport && (c.transport.vehicleNumber || c.transport.vehicleType || c.transport.direction) && staff && (
        <Notice tone="danger" title="Suspected transport details">
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" />{c.transport.vehicleType ?? 'Vehicle'}</span>
            {c.transport.vehicleNumber && <span>Registration: <b className="font-mono">{c.transport.vehicleNumber}</b></span>}
            {c.transport.direction && <span>Heading: {c.transport.direction}</span>}
          </span>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Sightings"
              subtitle={`${sightings.length} record${sightings.length === 1 ? '' : 's'} on the map`}
              action={staff || c.reporterId === user.id ? <Button size="sm" variant="secondary" onClick={() => setSightingOpen(true)}>Add sighting</Button> : undefined}
            />
            <div className="p-4"><MapView height="300px" markers={markers} ariaLabel="Sighting locations" /></div>
            <ul className="divide-y divide-line">
              {sightings.map((s) => (
                <li key={s.id} className="flex gap-3 px-5 py-3 text-sm">
                  {s.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo} alt="Sighting photograph" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.landmark}</div>
                    <div className="text-muted">
                      {CONDITION_LABEL[s.condition]} · {s.count} animal{s.count === 1 ? '' : 's'} · via {s.source.toUpperCase()}
                      {!s.synced && <Badge className="ml-2 bg-accent/15 text-accent ring-accent/30">Queued offline</Badge>}
                    </div>
                    {s.notes && <p className="mt-1">{s.notes}</p>}
                    {staff && s.unknownIdentifier && <p className="mt-1 text-xs text-warn">Unknown tag scanned: <span className="font-mono">{s.unknownIdentifier}</span></p>}
                    <div className="mt-0.5 text-xs text-muted">{formatDateTime(s.observedAt)} · {userName(db, s.reporterId)}{s.accuracy ? ` · ±${s.accuracy} m` : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {animal && (
            <div className="space-y-3">
              <AnimalMatch value={animal.identifiers[0]?.value ?? ''} linkProfile />
              {!animal.identifiers.length && (
                <Card className="p-4 text-sm"><b>{animal.label}</b> — no tag on record.</Card>
              )}
            </div>
          )}

          {staff && (
            <Card>
              <CardHeader
                title="Medical history"
                subtitle={animal ? animal.label : 'Link an animal to see its record'}
                action={
                  animal ? (
                    canMedical && <Button size="sm" variant="secondary" onClick={() => setMedOpen(true)}>Add record</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setLinkOpen(true)}>Link animal</Button>
                  )
                }
              />
              {medical.length ? (
                <ul className="divide-y divide-line">
                  {medical.map((m) => (
                    <li key={m.id} className="px-5 py-3 text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium capitalize">{m.type.replace('_', ' ')}</span>
                        <span className="text-xs text-muted">{formatDateTime(m.at)} · {userName(db, m.vetId)}</span>
                      </div>
                      <div>{m.diagnosis}</div>
                      {(m.treatment || m.medication) && <div className="text-muted">{[m.treatment, m.medication].filter(Boolean).join(' · ')}</div>}
                      {m.followUpDate && <div className="mt-0.5 text-xs text-muted">Follow-up {m.followUpDate}{m.followUpDone ? ' · done' : ''}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 text-sm text-muted">No medical records yet.</div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {staff && (
            <Card>
              <CardHeader title="Case details" />
              <dl className="space-y-3 p-5 text-sm">
                <Row label="Assigned to">{c.assignedOrgId ? orgName(db, c.assignedOrgId) : <span className="text-muted">Unassigned</span>}</Row>
                {c.assignedUserId && <Row label="Handler">{userName(db, c.assignedUserId)}</Row>}
                <Row label="Reporter">{userName(db, c.reporterId)}</Row>
                <Row label="Priority">
                  {user.role === 'operations' || user.role === 'admin' ? (
                    <Select
                      aria-label="Priority"
                      value={c.priority}
                      onChange={(e) => run(() => setPriority(c.id, e.target.value as Priority), 'Priority updated')}
                    >
                      {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                    </Select>
                  ) : PRIORITY_LABEL[c.priority]}
                </Row>
                <Row label="Coordinates"><span className="font-mono text-xs">{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</span></Row>
              </dl>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity" subtitle={staff ? 'Includes internal notes' : 'Updates from the response team'} />
            <div className="p-5">
              <Timeline
                items={[...events].reverse().map((e) => ({
                  id: e.id,
                  at: formatDateTime(e.at),
                  title:
                    e.type === 'reported' ? 'Report submitted'
                    : e.type === 'status' || e.type === 'assigned' ? (e.toStatus ? CASE_STATUS_LABEL[e.toStatus] : 'Update')
                    : e.type === 'referred' ? 'Referred'
                    : e.type === 'sighting' ? 'New sighting'
                    : e.type === 'priority' ? 'Priority changed'
                    : e.type === 'animal_linked' ? 'Animal linked'
                    : e.type === 'synced' ? 'Offline record synced'
                    : 'Note',
                  meta: `${userName(db, e.actorId)}${e.visibility === 'internal' ? ' · internal' : ''}`,
                  body: e.note,
                  tone: e.visibility === 'internal' ? 'muted' : e.toStatus === 'rejected' ? 'danger' : 'brand',
                }))}
              />
              <form
                className="mt-6 space-y-2 border-t border-line pt-4"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (run(() => addCaseNote(c.id, noteText, noteVis), 'Note added')) setNoteText('');
                }}
              >
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={staff ? 'Add an update…' : 'Add more details for the team…'} aria-label="Add a note" className="min-h-[70px]" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {staff ? (
                    <select aria-label="Visibility" value={noteVis} onChange={(e) => setNoteVis(e.target.value as 'public' | 'internal')} className="field-input w-auto text-xs">
                      <option value="public">Visible to reporter</option>
                      <option value="internal">Internal only</option>
                    </select>
                  ) : <span />}
                  <Button type="submit" size="sm" disabled={noteText.trim().length < 2}>Post</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Status change */}
      <Modal
        open={!!transition}
        onClose={() => setTransition(null)}
        title={transition?.label ?? ''}
        description={transition ? `${CASE_STATUS_LABEL[c.status]} → ${CASE_STATUS_LABEL[transition.to]}` : undefined}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setTransition(null)}>Cancel</Button><Button loading={busy} onClick={doTransition}>Confirm</Button></>}
      >
        <Field label={transition?.needsNote ? 'Note (required)' : 'Note (optional)'} hint="Reporters can see this unless the change is an internal send-back.">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} caseId={c.id} />
      <SightingModal open={sightingOpen} onClose={() => setSightingOpen(false)} caseId={c.id} defaultLandmark={c.landmark} defaultGeo={{ lat: c.lat, lng: c.lng, source: 'map' }} />
      {animal && <MedicalModal open={medOpen} onClose={() => setMedOpen(false)} animalId={animal.id} caseId={c.id} />}
      <LinkAnimalModal open={linkOpen} onClose={() => setLinkOpen(false)} caseId={c.id} />
      <button className="sr-only" onClick={() => router.refresh()} tabIndex={-1} aria-hidden>refresh</button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}

function AssignModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { db, user } = useApp();
  const { toast } = useToast();
  const [orgId, setOrgId] = useState('');
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');
  const orgs = assignableOrgs(db).filter((o) => user?.role !== 'vet' || o.type === 'gaushala');
  const members = membersOf(db, orgId);
  const submit = () => {
    const r = assignCase(caseId, orgId, userId || undefined, note);
    if (r.ok) {
      toast('Case assigned');
      setOrgId(''); setUserId(''); setNote('');
      onClose();
    } else toast(r.error, 'error');
  };
  return (
    <Modal open={open} onClose={onClose} title="Assign case" description="Only verified organisations are listed." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!orgId} onClick={submit}>Assign</Button></>}>
      <div className="space-y-4">
        <Field label="Organisation" required>
          <Select value={orgId} onChange={(e) => { setOrgId(e.target.value); setUserId(''); }}>
            <option value="">Choose…</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}
          </Select>
        </Field>
        {members.length > 0 && (
          <Field label="Specific person (optional)" hint="Leave blank to notify everyone in the organisation.">
            <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Whole team</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Instructions (optional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function SightingModal({ open, onClose, caseId, defaultLandmark, defaultGeo }: { open: boolean; onClose: () => void; caseId: string; defaultLandmark: string; defaultGeo: GeoValue }) {
  const { toast } = useToast();
  const [geo, setGeo] = useState<GeoValue | null>(defaultGeo);
  const [landmark, setLandmark] = useState(defaultLandmark);
  const [condition, setCondition] = useState<Condition>('unknown');
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const submit = () => {
    if (!geo) return toast('Choose a location first.', 'error');
    const r = addSighting(caseId, { lat: geo.lat, lng: geo.lng, accuracy: geo.accuracy, landmark, condition, count, notes, source: 'manual' });
    if (r.ok) { toast('Sighting added'); setNotes(''); onClose(); } else toast(r.error, 'error');
  };
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Add a new sighting" description="Spotted the animal somewhere else? Add it so teams can follow the trail." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add sighting</Button></>}>
      <div className="space-y-4">
        <LocationPicker value={geo} onChange={setGeo} height="220px" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Landmark" required className="sm:col-span-3"><Input value={landmark} onChange={(e) => setLandmark(e.target.value)} /></Field>
          <Field label="Condition">
            <Select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
              {Object.entries(CONDITION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="How many animals">
            <Input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
        </div>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export function MedicalModal({ open, onClose, animalId, caseId }: { open: boolean; onClose: () => void; animalId: string; caseId?: string }) {
  const { user } = useApp();
  const { toast } = useToast();
  const [type, setType] = useState<MedicalRecord['type']>(user?.role === 'gaushala' ? 'follow_up' : 'examination');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medication, setMedication] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const types: Array<[MedicalRecord['type'], string]> = user?.role === 'gaushala'
    ? [['follow_up', 'Follow-up check'], ['vaccination', 'Vaccination']]
    : [['examination', 'Examination'], ['treatment', 'Treatment'], ['vaccination', 'Vaccination'], ['surgery', 'Surgery'], ['follow_up', 'Follow-up check']];
  const submit = () => {
    const r = addMedicalRecord({ animalId, caseId, type, diagnosis, treatment, medication, followUpDate: followUpDate || undefined });
    if (r.ok) {
      toast('Medical record saved');
      setDiagnosis(''); setTreatment(''); setMedication(''); setFollowUpDate('');
      onClose();
    } else toast(r.error, 'error');
  };
  return (
    <Modal open={open} onClose={onClose} title="Add medical record" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save record</Button></>}>
      <div className="space-y-4">
        {user?.role === 'gaushala' && <Notice tone="info">Gaushala staff can log follow-ups and vaccinations. Clinical diagnoses are recorded by veterinarians.</Notice>}
        <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as MedicalRecord['type'])}>{types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field label="Diagnosis / observation" required><Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Treatment"><Input value={treatment} onChange={(e) => setTreatment(e.target.value)} /></Field>
          <Field label="Medication"><Input value={medication} onChange={(e) => setMedication(e.target.value)} /></Field>
        </div>
        <Field label="Follow-up date (optional)"><Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function LinkAnimalModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { db } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const matches = db.animals
    .filter((a) => !q.trim() || (a.label + ' ' + a.identifiers.map((i) => i.value).join(' ')).toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <Modal open={open} onClose={onClose} title="Link an animal" description="Search by description or tag number.">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search animals…" aria-label="Search animals" />
      <ul className="mt-3 divide-y divide-line">
        {matches.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-brand"
              onClick={() => {
                const r = linkAnimal(caseId, a.id);
                if (r.ok) { toast('Animal linked'); onClose(); } else toast(r.error, 'error');
              }}
            >
              <span>{a.label}</span>
              <span className="font-mono text-xs text-muted">{a.identifiers[0]?.value ?? 'no tag'}</span>
            </button>
          </li>
        ))}
        {!matches.length && <li className="py-4 text-sm text-muted">No animals match.</li>}
      </ul>
    </Modal>
  );
}
