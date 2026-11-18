'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardHeader, LinkButton, PageHeader } from '@/components/ui';
import { ScanFeedback, ScanPanel, type ScanResult } from '@/components/ScanPanel';
import { AnimalMatch } from '@/components/AnimalCard';
import { findAnimalByIdentifier, useApp } from '@/lib/store';
import { sightingsForAnimal } from '@/lib/selectors';
import { formatDateTime } from '@/lib/utils';

export default function ScanPage() {
  const { db } = useApp();
  const [result, setResult] = useState<ScanResult | null>(null);
  const animal = result ? findAnimalByIdentifier(db, result.value) : undefined;
  const seen = animal ? sightingsForAnimal(db, animal.id).slice(0, 5) : [];
  const cases = animal ? db.cases.filter((c) => c.animalId === animal.id) : [];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Field tools" title="Scan an ear tag" subtitle="Pair the handheld scanner, use the camera or type the ID to see an animal's record instantly." />
      <Card><div className="p-5"><ScanPanel onResult={setResult} /></div></Card>
      {result && (
        <div className="mt-5 space-y-4">
          <ScanFeedback result={result} found={!!animal} />
          <AnimalMatch value={result.value} />
          {animal && (
            <Card>
              <CardHeader title="Recent sightings" />
              <ul className="divide-y divide-line text-sm">
                {seen.map((s) => <li key={s.id} className="flex justify-between gap-3 px-5 py-2.5"><span>{s.landmark}</span><span className="text-muted">{formatDateTime(s.observedAt)}</span></li>)}
                {!seen.length && <li className="px-5 py-3 text-muted">No sightings recorded.</li>}
              </ul>
              {cases.length > 0 && <div className="border-t border-line px-5 py-3 text-sm">Cases: {cases.map((c) => <Link key={c.id} href={`/operations/cases/${c.id}`} className="mr-3 font-semibold text-brand hover:underline">{c.code}</Link>)}</div>}
            </Card>
          )}
          <LinkButton href="/community/report/new" variant="secondary">File a report for this animal</LinkButton>
        </div>
      )}
    </div>
  );
}
