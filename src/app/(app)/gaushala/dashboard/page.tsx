'use client';

import Link from 'next/link';
import { PawPrint, Truck, Warehouse, HeartPulse } from 'lucide-react';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, StatTile } from '@/components/ui';
import { Gauge } from '@/components/charts';
import { useApp } from '@/lib/store';
import { assignedCases, byId, isOpen, orgOccupancy } from '@/lib/selectors';
import { CONDITION_LABEL } from '@/lib/meta';
import { timeAgo } from '@/lib/utils';

export default function GaushalaDashboard() {
  const { db, user } = useApp();
  if (!user) return null;
  const org = byId(db.organizations, user.orgId);
  if (!org) return <EmptyState title="Choose a shelter" body="Administrators can manage shelters from Organisations." action={<LinkButton href="/admin/organizations">Organisations</LinkButton>} />;
  const occupancy = orgOccupancy(db, org.id);
  const intakes = db.intakes.filter((i) => i.orgId === org.id && !i.exitedAt);
  const awaiting = assignedCases(db, user).filter((c) => c.status === 'assigned');
  const active = assignedCases(db, user).filter((c) => ['accepted', 'in_progress', 'under_treatment'].includes(c.status));
  const needsCare = intakes.filter((i) => ['weak', 'injured', 'sick', 'critical'].includes(i.condition));
  return (
    <>
      <PageHeader eyebrow="Gaushala" title={org.name} subtitle={org.address} actions={<LinkButton href="/gaushala/intake">Record intake</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="In shelter" value={occupancy} icon={<Warehouse className="h-4 w-4" />} href="/gaushala/animals" />
        <StatTile label="Awaiting acceptance" value={awaiting.length} icon={<Truck className="h-4 w-4" />} tone="accent" href="/gaushala/assignments" />
        <StatTile label="Active rescues" value={active.length} icon={<PawPrint className="h-4 w-4" />} tone="info" />
        <StatTile label="Need extra care" value={needsCare.length} icon={<HeartPulse className="h-4 w-4" />} tone="danger" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {org.capacity ? <Card><CardHeader title="Capacity" /><div className="p-5"><Gauge value={occupancy} max={org.capacity} /></div></Card> : null}
        <Card>
          <CardHeader title="Rescue assignments" action={<Link href="/gaushala/assignments" className="text-sm font-semibold text-brand">All</Link>} />
          <ul className="divide-y divide-line">
            {[...awaiting, ...active].slice(0, 5).map((c) => <li key={c.id}><Link href={`/operations/cases/${c.id}`} className="block px-5 py-3 hover:bg-surface2/50"><div className="text-sm font-medium">{c.title}</div><div className="text-xs text-muted">{c.code} · {c.landmark} · {timeAgo(c.createdAt)}</div></Link></li>)}
            {!awaiting.length && !active.length && <li className="p-5 text-sm text-muted">No active assignments.</li>}
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Animals needing extra care" />
          <ul className="divide-y divide-line">
            {needsCare.map((i) => <li key={i.id}><Link href={`/animal/${i.animalId}`} className="flex justify-between gap-3 px-5 py-3 text-sm hover:bg-surface2/50"><span className="font-medium">{byId(db.animals, i.animalId)?.label}</span><span className="text-muted">{CONDITION_LABEL[i.condition]} · {i.pen ?? 'no pen'}</span></Link></li>)}
            {!needsCare.length && <li className="p-5 text-sm text-muted">Every animal is stable.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
