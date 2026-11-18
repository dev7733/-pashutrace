'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClipboardList, Download } from 'lucide-react';
import type { Case, CaseStatus, Priority } from '@/lib/types';
import { useApp } from '@/lib/store';
import { CASE_STATUS_LABEL, CASE_STATUSES, CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_RANK } from '@/lib/meta';
import { orgName, userName } from '@/lib/selectors';
import { downloadCsv, timeAgo } from '@/lib/utils';
import { Button, Card, Chip, EmptyState, PriorityBadge, SearchBox, StatusBadge, TableWrap, tdCls, thCls } from './ui';

export function CaseList({
  cases,
  href,
  showReporter = true,
  showOrg = true,
  emptyTitle = 'No cases found',
  emptyBody,
  exportName,
  defaultSort = 'urgency',
}: {
  cases: Case[];
  href: (c: Case) => string;
  showReporter?: boolean;
  showOrg?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  exportName?: string;
  defaultSort?: 'urgency' | 'newest';
}) {
  const { db } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CaseStatus | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [sort, setSort] = useState<'urgency' | 'newest'>(defaultSort);

  const statuses = useMemo(() => CASE_STATUSES.filter((s) => cases.some((c) => c.status === s)), [cases]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = cases.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (priority !== 'all' && c.priority !== priority) return false;
      if (!needle) return true;
      return [c.code, c.title, c.landmark, CATEGORY_LABEL[c.category], orgName(db, c.assignedOrgId), userName(db, c.reporterId)].join(' ').toLowerCase().includes(needle);
    });
    return list.sort((a, b) => {
      if (sort === 'urgency') {
        const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (p !== 0) return p;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [cases, q, status, priority, sort, db]);

  const exportCsv = () =>
    downloadCsv(`${exportName ?? 'cases'}-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Code', 'Title', 'Category', 'Priority', 'Status', 'Landmark', 'Lat', 'Lng', 'Assigned to', 'Reporter', 'Created'],
      ...rows.map((c) => [c.code, c.title, CATEGORY_LABEL[c.category], c.priority, c.status, c.landmark, c.lat.toFixed(5), c.lng.toFixed(5), orgName(db, c.assignedOrgId), userName(db, c.reporterId), c.createdAt]),
    ]);

  return (
    <Card>
      <div className="space-y-3 border-b border-line p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search code, place, organisation…" /></div>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as 'urgency' | 'newest')} className="field-input sm:w-44">
            <option value="urgency">Most urgent first</option>
            <option value="newest">Newest first</option>
          </select>
          {exportName && (
            <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          )}
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <Chip active={status === 'all'} onClick={() => setStatus('all')}>All statuses</Chip>
          {statuses.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{CASE_STATUS_LABEL[s]}</Chip>
          ))}
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <Chip active={priority === 'all'} onClick={() => setPriority('all')}>Any priority</Chip>
          {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
            <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>{PRIORITY_LABEL[p]}</Chip>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyState icon={<ClipboardList className="h-5 w-5" />} title={cases.length ? 'Nothing matches those filters' : emptyTitle} body={cases.length ? 'Try clearing the search or filters.' : emptyBody} />
        </div>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thCls}>Case</th>
              <th className={thCls}>Priority</th>
              <th className={thCls}>Status</th>
              {showOrg && <th className={thCls}>Assigned to</th>}
              {showReporter && <th className={thCls}>Reporter</th>}
              <th className={thCls}>Reported</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-surface2/50">
                <td className={tdCls}>
                  <Link href={href(c)} className="block max-w-[320px]">
                    <span className="font-medium hover:text-brand hover:underline">{c.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{c.code} · {c.landmark}</span>
                  </Link>
                </td>
                <td className={tdCls}><PriorityBadge priority={c.priority} /></td>
                <td className={tdCls}><StatusBadge status={c.status} /></td>
                {showOrg && <td className={`${tdCls} text-muted`}>{orgName(db, c.assignedOrgId)}</td>}
                {showReporter && <td className={`${tdCls} text-muted`}>{userName(db, c.reporterId)}</td>}
                <td className={`${tdCls} whitespace-nowrap text-muted`}>{timeAgo(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}
