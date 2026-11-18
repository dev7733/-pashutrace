'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, Field, Input, Notice, PageHeader, Select, Textarea, useToast, Badge } from '@/components/ui';
import { requestAccess, updateProfile, useApp } from '@/lib/store';
import { ACCESS_ROLE_LABEL, ORG_TYPE_LABEL, ROLE_LABEL, ROLE_ORG_TYPE } from '@/lib/meta';
import { formatDate } from '@/lib/utils';

export default function Profile() {
  const { db, user } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [role, setRole] = useState<'gaushala' | 'vet' | 'operations'>('gaushala');
  const [orgId, setOrgId] = useState('');
  const [message, setMessage] = useState('');
  if (!user) return null;

  const memberships = db.memberships.filter((m) => m.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = memberships.find((m) => m.status === 'pending');
  const orgs = db.organizations.filter((o) => o.type === ROLE_ORG_TYPE[role]);
  const myOrg = db.organizations.find((o) => o.id === user.orgId);

  const save = () => {
    const r = updateProfile({ name, phone });
    toast(r.ok ? 'Profile saved' : r.error, r.ok ? 'ok' : 'error');
  };
  const request = () => {
    const r = requestAccess({ orgId, role, message });
    if (r.ok) { toast('Request sent to the administrators'); setMessage(''); } else toast(r.error, 'error');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My profile" subtitle={user.email} />
      <Card>
        <CardHeader title="Your details" action={<Badge className="bg-brand/12 text-brand ring-brand/30">{ROLE_LABEL[user.role]}</Badge>} />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pn"><Input id="pn" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Phone" htmlFor="pp"><Input id="pp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <div className="sm:col-span-2 flex items-center justify-between text-sm text-muted">
            <span>Member since {formatDate(user.createdAt)}{myOrg ? ` · ${myOrg.name}` : ''}</span>
            <Button onClick={save}>Save changes</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6" id="access">
        <CardHeader title="Institutional access" subtitle="For gaushala, veterinary and municipal staff. An administrator verifies every request." />
        <div className="space-y-4 p-5">
          {user.role !== 'community' ? (
            <Notice tone="ok" title={`You have ${ROLE_LABEL[user.role]} access`}>{myOrg ? myOrg.name : 'System-wide'}</Notice>
          ) : pending ? (
            <Notice tone="info" title="Request pending">
              {ACCESS_ROLE_LABEL[pending.requestedRole]} at {db.organizations.find((o) => o.id === pending.orgId)?.name}, sent {formatDate(pending.createdAt)}. You will be notified when an administrator decides.
            </Notice>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Role you need">
                  <Select value={role} onChange={(e) => { setRole(e.target.value as typeof role); setOrgId(''); }}>
                    {(Object.keys(ACCESS_ROLE_LABEL) as Array<keyof typeof ACCESS_ROLE_LABEL>).map((k) => <option key={k} value={k}>{ACCESS_ROLE_LABEL[k]}</option>)}
                  </Select>
                </Field>
                <Field label={ORG_TYPE_LABEL[ROLE_ORG_TYPE[role]]}>
                  <Select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                    <option value="">Select your organisation…</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}{o.verified ? '' : ' (unverified)'}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Message to the administrator (optional)"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your position and how we can verify it" /></Field>
              <Button onClick={request} disabled={!orgId}>Request access</Button>
            </>
          )}
          {memberships.filter((m) => m.status !== 'pending' && user.role === 'community').map((m) => (
            <p key={m.id} className="text-sm text-muted">Previous request ({formatDate(m.createdAt)}): <b>{m.status}</b></p>
          ))}
        </div>
      </Card>
    </div>
  );
}
