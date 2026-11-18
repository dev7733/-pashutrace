'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, Field, Modal, PageHeader, SearchBox, Select, TableWrap, tdCls, thCls, useToast, Avatar } from '@/components/ui';
import { decideAccess, setUserRole, toggleSuspend, useApp } from '@/lib/store';
import { orgName } from '@/lib/selectors';
import { ALL_ROLES, ROLE_LABEL, ROLE_ORG_TYPE, ACCESS_ROLE_LABEL } from '@/lib/meta';
import type { Profile, Role } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function Users() {
  const { db, user: me } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState<Role | 'all'>('all');
  const [edit, setEdit] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>('community');
  const [orgId, setOrgId] = useState('');
  const pending = db.memberships.filter((m) => m.status === 'pending');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return db.profiles.filter((p) => (roleF === 'all' || p.role === roleF) && (!n || (p.name + p.email).toLowerCase().includes(n))).sort((a, b) => a.name.localeCompare(b.name));
  }, [db.profiles, q, roleF]);
  const orgType = role !== 'community' && role !== 'admin' ? ROLE_ORG_TYPE[role as 'gaushala' | 'vet' | 'operations'] : null;

  return (
    <>
      <PageHeader eyebrow="Administration" title="User management" subtitle="Verify access requests, change roles and suspend accounts." />
      {pending.length > 0 && (
        <Card className="mb-6 border-accent/40">
          <div className="border-b border-line px-5 py-3 font-display text-lg font-semibold">Pending access requests</div>
          <ul className="divide-y divide-line">
            {pending.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1"><b>{db.profiles.find((p) => p.id === m.userId)?.name}</b> → {ACCESS_ROLE_LABEL[m.requestedRole]} · {orgName(db, m.orgId)}{m.message && <div className="text-muted">“{m.message}”</div>}</div>
                <Button size="sm" onClick={() => { const r = decideAccess(m.id, true, true); toast(r.ok ? 'Approved — organisation verified' : r.error, r.ok ? 'ok' : 'error'); }}>Verify & approve</Button>
                <Button size="sm" variant="danger" onClick={() => { const r = decideAccess(m.id, false); toast(r.ok ? 'Declined' : r.error, r.ok ? 'ok' : 'error'); }}>Decline</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search name or email…" /></div>
          <select aria-label="Filter by role" className="field-input sm:w-56" value={roleF} onChange={(e) => setRoleF(e.target.value as Role | 'all')}><option value="all">All roles</option>{ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
        </div>
        <TableWrap>
          <thead><tr><th className={thCls}>User</th><th className={thCls}>Role</th><th className={thCls}>Organisation</th><th className={thCls}>Joined</th><th className={thCls}>Status</th><th className={thCls}></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className={tdCls}><div className="flex items-center gap-3"><Avatar name={p.name} /><div><div className="font-medium">{p.name}</div><div className="text-xs text-muted">{p.email}</div></div></div></td>
                <td className={tdCls}>{ROLE_LABEL[p.role]}</td>
                <td className={`${tdCls} text-muted`}>{orgName(db, p.orgId)}</td>
                <td className={`${tdCls} whitespace-nowrap text-muted`}>{formatDate(p.createdAt)}</td>
                <td className={tdCls}><Badge className={p.status === 'active' ? 'bg-ok/15 text-ok ring-ok/30' : 'bg-danger/12 text-danger ring-danger/25'}>{p.status}</Badge></td>
                <td className={tdCls}>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" disabled={p.id === me?.id} onClick={() => { setEdit(p); setRole(p.role); setOrgId(p.orgId ?? ''); }}>Role</Button>
                    <Button size="sm" variant={p.status === 'active' ? 'danger' : 'secondary'} disabled={p.id === me?.id} onClick={() => { const r = toggleSuspend(p.id); toast(r.ok ? (p.status === 'active' ? 'Account suspended' : 'Account reinstated') : r.error, r.ok ? 'ok' : 'error'); }}>{p.status === 'active' ? 'Suspend' : 'Reinstate'}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} size="sm" title={`Change role · ${edit?.name ?? ''}`} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => { const r = setUserRole(edit!.id, role, orgId || undefined); if (r.ok) { toast('Role updated'); setEdit(null); } else toast(r.error, 'error'); }}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Role"><Select value={role} onChange={(e) => { setRole(e.target.value as Role); setOrgId(''); }}>{ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
          {orgType && <Field label="Organisation" required><Select value={orgId} onChange={(e) => setOrgId(e.target.value)}><option value="">Choose…</option>{db.organizations.filter((o) => o.type === orgType).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>}
        </div>
      </Modal>
    </>
  );
}
