'use client';

import { useState } from 'react';
import { BadgeCheck, Pencil, Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, TableWrap, tdCls, thCls, useToast } from '@/components/ui';
import { saveOrganization, toggleOrgVerified, useApp } from '@/lib/store';
import { ORG_TYPE_LABEL } from '@/lib/meta';
import { orgOccupancy } from '@/lib/selectors';
import { LocationPicker, type GeoValue } from '@/components/LocationPicker';
import type { Organization } from '@/lib/types';

export default function Orgs() {
  const { db } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [type, setType] = useState<Organization['type']>('gaushala');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [geo, setGeo] = useState<GeoValue | null>(null);

  const start = (o?: Organization) => {
    setId(o?.id); setName(o?.name ?? ''); setType(o?.type ?? 'gaushala'); setAddress(o?.address ?? ''); setPhone(o?.phone ?? '');
    setCapacity(o?.capacity ? String(o.capacity) : ''); setGeo(o ? { lat: o.lat, lng: o.lng, source: 'map' } : null); setOpen(true);
  };
  const save = () => {
    if (!geo) return toast('Place the organisation on the map.', 'error');
    const cap = capacity.trim() ? Number(capacity) : undefined;
    const r = saveOrganization({ id, name, type, address, phone, lat: geo.lat, lng: geo.lng, capacity: cap });
    if (r.ok) { toast('Organisation saved'); setOpen(false); } else toast(r.error, 'error');
  };
  return (
    <>
      <PageHeader eyebrow="Administration" title="Organisation management" subtitle="Only verified organisations can receive case assignments." actions={<Button onClick={() => start()}><Plus className="h-4 w-4" />Add organisation</Button>} />
      <Card>
        {db.organizations.length ? (
          <TableWrap>
            <thead><tr><th className={thCls}>Organisation</th><th className={thCls}>Type</th><th className={thCls}>Members</th><th className={thCls}>Occupancy</th><th className={thCls}>Status</th><th className={thCls}></th></tr></thead>
            <tbody>
              {db.organizations.map((o) => (
                <tr key={o.id}>
                  <td className={tdCls}><div className="font-medium">{o.name}</div><div className="text-xs text-muted">{o.address}</div></td>
                  <td className={tdCls}>{ORG_TYPE_LABEL[o.type]}</td>
                  <td className={tdCls}>{db.profiles.filter((p) => p.orgId === o.id).length}</td>
                  <td className={tdCls}>{o.type === 'gaushala' ? `${orgOccupancy(db, o.id)}${o.capacity ? ` / ${o.capacity}` : ''}` : '—'}</td>
                  <td className={tdCls}><Badge className={o.verified ? 'bg-ok/15 text-ok ring-ok/30' : 'bg-accent/15 text-accent ring-accent/30'}>{o.verified ? 'Verified' : 'Unverified'}</Badge></td>
                  <td className={tdCls}><div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => start(o)}><Pencil className="h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="secondary" onClick={() => { const r = toggleOrgVerified(o.id); toast(r.ok ? (o.verified ? 'Verification removed' : 'Organisation verified') : r.error, r.ok ? 'ok' : 'error'); }}><BadgeCheck className="h-3.5 w-3.5" />{o.verified ? 'Unverify' : 'Verify'}</Button></div></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : <div className="p-4"><EmptyState title="No organisations" /></div>}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={id ? 'Edit organisation' : 'Add organisation'} footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required className="sm:col-span-2"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as Organization['type'])}>{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Address" required className={type === 'gaushala' ? '' : 'sm:col-span-2'}><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
            {type === 'gaushala' && <Field label="Capacity (animals)"><Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>}
          </div>
          <LocationPicker value={geo} onChange={setGeo} height="220px" />
        </div>
      </Modal>
    </>
  );
}
