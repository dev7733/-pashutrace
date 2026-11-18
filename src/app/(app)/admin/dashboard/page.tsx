'use client';

import Link from 'next/link';
import { Building2, ClipboardList, PawPrint, Users } from 'lucide-react';
import { Button, Card, CardHeader, PageHeader, StatTile, useToast } from '@/components/ui';
import { Donut } from '@/components/charts';
import { decideAccess, resetDemo, useApp } from '@/lib/store';
import { userName, orgName } from '@/lib/selectors';
import { CASE_STATUS_LABEL, CASE_STATUSES, ACCESS_ROLE_LABEL, STATUS_COLOR } from '@/lib/meta';
import { timeAgo } from '@/lib/utils';

export default function AdminDashboard() {
  const { db } = useApp();
  const { toast } = useToast();
  const pending = db.memberships.filter((m) => m.status === 'pending');
  const statusData = CASE_STATUSES.map((s) => ({ label: CASE_STATUS_LABEL[s], value: db.cases.filter((c) => c.status === s).length, color: STATUS_COLOR[s] })).filter((d) => d.value > 0);
  return (
    <>
      <PageHeader eyebrow="Administration" title="System overview" subtitle="Users, organisations, animals and cases at a glance." actions={<Button variant="secondary" onClick={() => { if (confirm('Reset all demo data to the original sample set?')) { resetDemo(); toast('Demo data reset'); } }}>Reset demo data</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Users" value={db.profiles.length} icon={<Users className="h-4 w-4" />} href="/admin/users" hint={`${db.profiles.filter((p) => p.status === 'suspended').length} suspended`} />
        <StatTile label="Organisations" value={db.organizations.length} icon={<Building2 className="h-4 w-4" />} tone="accent" href="/admin/organizations" hint={`${db.organizations.filter((o) => !o.verified).length} unverified`} />
        <StatTile label="Animals" value={db.animals.length} icon={<PawPrint className="h-4 w-4" />} tone="info" href="/admin/animals" />
        <StatTile label="Cases" value={db.cases.length} icon={<ClipboardList className="h-4 w-4" />} tone="danger" href="/admin/cases" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Access requests" subtitle={`${pending.length} waiting`} />
          <ul className="divide-y divide-line">
            {pending.map((m) => (
              <li key={m.id} className="space-y-2 px-5 py-4 text-sm">
                <div><b>{userName(db, m.userId)}</b> wants <b>{ACCESS_ROLE_LABEL[m.requestedRole]}</b> at {orgName(db, m.orgId)}{!db.organizations.find((o) => o.id === m.orgId)?.verified && <span className="text-warn"> (unverified org)</span>}</div>
                {m.message && <p className="text-muted">“{m.message}”</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { const r = decideAccess(m.id, true, true); toast(r.ok ? 'Approved' : r.error, r.ok ? 'ok' : 'error'); }}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => { const r = decideAccess(m.id, false); toast(r.ok ? 'Declined' : r.error, r.ok ? 'ok' : 'error'); }}>Decline</Button>
                </div>
              </li>
            ))}
            {!pending.length && <li className="p-5 text-sm text-muted">No pending requests.</li>}
          </ul>
        </Card>
        <Card><CardHeader title="Cases by status" /><div className="p-5"><Donut data={statusData} centerLabel="cases" /></div></Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" action={<Link href="/admin/audit-logs" className="text-sm font-semibold text-brand">Audit log</Link>} />
          <ul className="divide-y divide-line text-sm">
            {db.audit.slice(0, 8).map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5"><span><b>{userName(db, a.actorId)}</b> <span className="font-mono text-xs text-muted">{a.action}</span> {a.details}</span><span className="text-xs text-muted">{timeAgo(a.at)}</span></li>)}
          </ul>
        </Card>
      </div>
    </>
  );
}
