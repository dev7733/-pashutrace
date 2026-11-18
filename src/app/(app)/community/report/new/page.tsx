'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Camera, ScanLine, X } from 'lucide-react';
import { Button, Card, CardHeader, Field, Input, Notice, PageHeader, Select, Textarea, useToast } from '@/components/ui';
import { ScanFeedback, ScanPanel, type ScanResult } from '@/components/ScanPanel';
import { AnimalMatch } from '@/components/AnimalCard';
import { LocationPicker, type GeoValue } from '@/components/LocationPicker';
import { createReport, findAnimalByIdentifier, isEffectivelyOnline, useApp } from '@/lib/store';
import { CATEGORY_HINT, CATEGORY_LABEL, CONDITION_LABEL, REPORT_SPECIES, ROLE_HOME, SPECIES_LABEL } from '@/lib/meta';
import { AnimalBadge, artForSpecies } from '@/components/AnimalArt';
import { compressImage, cn } from '@/lib/utils';
import type { CaseCategory, Condition, Species } from '@/lib/types';

export default function NewReport() {
  const router = useRouter();
  const { db, user } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CaseCategory>('stray');
  const [species, setSpecies] = useState<Species>('cow');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [geo, setGeo] = useState<GeoValue | null>(null);
  const [landmark, setLandmark] = useState('');
  const [condition, setCondition] = useState<Condition>('unknown');
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [direction, setDirection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const animal = scan ? findAnimalByIdentifier(db, scan.value) : undefined;
  const transport = category === 'suspected_transport';
  const offline = !isEffectivelyOnline();

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setPhoto(await compressImage(f));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not use that photo.', 'error');
    }
  };

  const submit = () => {
    setError(null);
    if (!geo) return setError('Choose the location of the sighting on the map.');
    if (landmark.trim().length < 3) return setError('Add a landmark or short address (at least 3 characters).');
    setBusy(true);
    const r = createReport({
      category,
      species: animal?.species ?? species,
      animalId: animal?.id,
      unknownIdentifier: scan && !animal ? scan.value : undefined,
      source: scan?.source ?? 'manual',
      lat: geo.lat,
      lng: geo.lng,
      accuracy: geo.accuracy,
      landmark,
      condition,
      count,
      notes,
      photo: photo ?? undefined,
      transport: transport ? { vehicleNumber: vehicleNumber.trim() || undefined, vehicleType: vehicleType.trim() || undefined, direction: direction.trim() || undefined } : undefined,
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(offline ? 'Saved on this device — it will sync when you are back online.' : `Report ${r.data.code} submitted. Thank you!`);
    router.push(user && user.role !== 'community' ? `/operations/cases/${r.data.id}` : `/community/reports/${r.data.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="New sighting" title="Report an animal" subtitle="Location and a short description are enough. Add a photo or scan the ear tag if you can." />
      {offline && <Notice tone="warn" className="mb-4" title="You are offline">This report will be stored on your device and sent automatically when the connection returns.</Notice>}

      <div className="space-y-5">
        <Card>
          <CardHeader title="1 · What animal, and what is happening?" />
          <div className="border-b border-line p-4">
            <div className="mb-2 text-sm font-medium">Animal</div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Animal">
              {REPORT_SPECIES.map((sp) => {
                const art = artForSpecies(sp);
                return (
                  <button key={sp} type="button" role="radio" aria-checked={species === sp} onClick={() => setSpecies(sp)}
                    className={cn('flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm transition', species === sp ? 'border-brand bg-brand/10 font-semibold ring-2 ring-brand/25' : 'border-line hover:border-brand/40')}>
                    {art ? <AnimalBadge kind={art} size={30} /> : <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-surface2 text-xs">?</span>}
                    {SPECIES_LABEL[sp]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {(Object.keys(CATEGORY_LABEL) as CaseCategory[]).map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
                className={cn('rounded-xl border p-3.5 text-left transition', category === c ? 'border-brand bg-brand/8 ring-2 ring-brand/25' : 'border-line hover:border-brand/40', c === 'suspected_transport' && category !== c && 'border-danger/30')}>
                <div className="font-medium">{CATEGORY_LABEL[c]}</div>
                <div className="text-xs text-muted">{CATEGORY_HINT[c]}</div>
              </button>
            ))}
          </div>
          {transport && (
            <div className="space-y-4 border-t border-line p-4">
              <Notice tone="danger" title="Do not confront the driver">Stay at a safe distance. Note what you can see and call the police if animals are in immediate danger.</Notice>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Vehicle registration"><Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="HR 26 XX 0000" /></Field>
                <Field label="Vehicle type"><Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Covered truck" /></Field>
                <Field label="Direction of travel"><Input value={direction} onChange={(e) => setDirection(e.target.value)} placeholder="Towards Delhi" /></Field>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="2 · Tag or microchip (optional)" subtitle="Read the chip with the scanner, use the camera, or type the ID." action={!showScan && <Button size="sm" variant="secondary" onClick={() => setShowScan(true)}><ScanLine className="h-4 w-4" /> Scan chip / tag</Button>} />
          {showScan && (
            <div className="space-y-3 p-4">
              <ScanPanel onResult={(r) => setScan(r)} />
              {scan && <ScanFeedback result={scan} found={!!animal} />}
              {scan && <AnimalMatch value={scan.value} linkProfile={false} />}
              {scan && <Button size="sm" variant="ghost" onClick={() => setScan(null)}><X className="h-4 w-4" /> Clear tag</Button>}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="3 · Where?" />
          <div className="space-y-4 p-4">
            <LocationPicker value={geo} onChange={setGeo} />
            <Field label="Landmark or address" required hint="e.g. “Near Bypass Chowk, opposite petrol pump”"><Input value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={120} /></Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="4 · Details" />
          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Condition"><Select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>{Object.entries(CONDITION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Field label="Number of animals" hint={transport ? '10 or more is flagged critical.' : undefined}><Input type="number" inputMode="numeric" min={1} max={500} value={count} onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))} /></Field>
            </div>
            <Field label="What did you see?"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Describe the animal, behaviour, injuries, anything unusual…" /></Field>
            <div>
              <div className="mb-1.5 text-sm font-medium">Photograph</div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} aria-label="Upload photograph" />
              {photo ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Selected photograph" className="max-h-56 rounded-xl border border-line" />
                  <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white" aria-label="Remove photograph"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => fileRef.current?.click()}><Camera className="h-4 w-4" /> Take or choose a photo</Button>
              )}
            </div>
          </div>
        </Card>

        {error && <Notice tone="danger">{error}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push(user ? ROLE_HOME[user.role] : '/')}>Cancel</Button>
          <Button size="lg" onClick={submit} loading={busy}>{offline ? 'Save report offline' : 'Submit report'}</Button>
        </div>
      </div>
    </div>
  );
}
