'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Card, CardHeader, PageHeader, SearchBox, TableWrap, tdCls, thCls } from '@/components/ui';
import { useApp } from '@/lib/store';
import { userName } from '@/lib/selectors';
import { PERMISSIONS, PERMISSION_KEYS, PERMISSION_LABELS } from '@/lib/permissions';
import { ALL_ROLES, ROLE_LABEL } from '@/lib/meta';
import { downloadCsv, formatDateTime } from '@/lib/utils';

export default function AuditLogs() {
  const { db } = useApp();
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return db.audit.filter((a) => !n || [a.action, a.entity, a.entityId, a.details, userName(db, a.actorId)].join(' ').toLowerCase().includes(n));
  }, [db, q]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit logs and permissions" subtitle="Every sensitive action is recorded with who, what and when." actions={<Button variant="secondary" onClick={() => downloadCsv('audit-log.csv', [['When', 'Who', 'Action', 'Entity', 'Reference', 'Details'], ...rows.map((a) => [a.at, userName(db, a.actorId), a.action, a.entity, a.entityId, a.details])])}><Download className="h-4 w-4" />CSV</Button>} />
      <Card>
        <div className="border-b border-line p-4"><SearchBox value={q} onChange={(v) => { setQ(v); setLimit(50); }} placeholder="Search action, person, case code…" /></div>
        <TableWrap>
          <thead><tr><th className={thCls}>When</th><th className={thCls}>Who</th><th className={thCls}>Action</th><th className={thCls}>Reference</th><th className={thCls}>Details</th></tr></thead>
          <tbody>
            {rows.slice(0, limit).map((a) => (
              <tr key={a.id}>
                <td className={`${tdCls} whitespace-nowrap text-muted`}>{formatDateTime(a.at)}</td>
                <td className={tdCls}>{userName(db, a.actorId)}</td>
                <td className={`${tdCls} font-mono text-xs`}>{a.action}</td>
                <td className={`${tdCls} font-mono text-xs text-muted`}>{a.entityId}</td>
                <td className={`${tdCls} text-muted`}>{a.details ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        {rows.length > limit && <div className="p-4 text-center"><Button variant="secondary" onClick={() => setLimit((l) => l + 50)}>Show more ({rows.length - limit} left)</Button></div>}
        {!rows.length && <p className="p-6 text-sm text-muted">No entries match.</p>}
      </Card>
      <Card className="mt-6">
        <CardHeader title="Permission matrix" subtitle="Enforced in the app and — when connected to Supabase — by row-level security." />
        <TableWrap>
          <thead><tr><th className={thCls}>Feature</th>{ALL_ROLES.map((r) => <th key={r} className={`${thCls} text-center`}>{ROLE_LABEL[r].split(' ')[0]}</th>)}</tr></thead>
          <tbody>
            {PERMISSION_KEYS.map((k) => (
              <tr key={k}>
                <td className={tdCls}>{PERMISSION_LABELS[k]}</td>
                {ALL_ROLES.map((r) => { const v = PERMISSIONS[k][r]; return <td key={r} className={`${tdCls} text-center ${v === 'yes' ? 'font-medium text-ok' : v === 'limited' ? 'text-accent' : 'text-muted'}`}>{v === 'yes' ? 'Yes' : v === 'limited' ? 'Limited' : 'No'}</td>; })}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
