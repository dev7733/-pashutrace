'use client';

import Link from 'next/link';
import { AlertTriangle, MapPin, Tag } from 'lucide-react';
import { useApp, findAnimalByIdentifier } from '@/lib/store';
import { lastSeen, orgName } from '@/lib/selectors';
import { SPECIES_LABEL } from '@/lib/meta';
import { timeAgo } from '@/lib/utils';
import type { Animal, Profile } from '@/lib/types';
import { AnimalStatusBadge } from './ui';

export function IdentifierPills({ animal, mask = false }: { animal: Animal; mask?: boolean }) {
  if (!animal.identifiers.length) return <span className="text-xs text-muted">No tag on record</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {animal.identifiers.map((i) => (
        <span key={i.type + i.value} className="inline-flex items-center gap-1 rounded-md bg-surface2 px-2 py-0.5 font-mono text-[11px]">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-muted">{i.type === 'PASHU_AADHAAR' ? 'Aadhaar' : i.type === 'UHF_EPC' ? 'UHF chip' : i.type}</span>
          {mask ? `${i.value.slice(0, 3)}••••${i.value.slice(-3)}` : i.value}
        </span>
      ))}
    </div>
  );
}

export function canSeeFullIds(user: Profile | null): boolean {
  return !!user && user.role !== 'community';
}

export function AnimalMatch({ value, linkProfile = true }: { value: string; linkProfile?: boolean }) {
  const { db, user } = useApp();
  const animal = findAnimalByIdentifier(db, value);
  const staff = canSeeFullIds(user);

  if (!animal) {
    return (
      <div className="flex gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
        <div className="text-sm">
          <div className="font-semibold">Unknown ID — flagged for review</div>
          <p className="mt-0.5 text-muted">
            <span className="font-mono">{value}</span> is not in the PashuTrace database. The report will still be filed and an operations officer will check it
            against Bharat Pashudhan and existing registers.
          </p>
        </div>
      </div>
    );
  }
  const seen = lastSeen(db, animal.id);
  return (
    <div className="rounded-2xl border border-ok/30 bg-ok/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ok">Animal matched</div>
          <div className="mt-0.5 font-display text-lg font-semibold">{animal.label}</div>
          <div className="text-sm text-muted">
            {SPECIES_LABEL[animal.species]} · {animal.sex}
            {animal.color ? ` · ${animal.color}` : ''}
          </div>
        </div>
        <AnimalStatusBadge status={animal.status} />
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted" /><IdentifierPills animal={animal} mask={!staff} /></div>
        {seen && (
          <div className="flex items-center gap-2 text-muted">
            <MapPin className="h-4 w-4" />
            Last observed at {seen.landmark} · {timeAgo(seen.observedAt)}
          </div>
        )}
        {animal.orgId && <div className="text-muted">Custodian: {orgName(db, animal.orgId)}</div>}
      </div>
      {linkProfile && staff && (
        <Link href={`/animal/${animal.id}`} className="mt-3 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline">
          Open full animal profile →
        </Link>
      )}
    </div>
  );
}
