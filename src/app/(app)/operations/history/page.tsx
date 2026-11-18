'use client';

import { CaseList } from '@/components/CaseList';
import { PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { isOpen } from '@/lib/selectors';

export default function History() {
  const { db } = useApp();
  return (
    <>
      <PageHeader eyebrow="Operations" title="Case history" subtitle="Resolved, closed, rejected and duplicate cases." />
      <CaseList cases={db.cases.filter((c) => !isOpen(c))} href={(c) => `/operations/cases/${c.id}`} exportName="case-history" defaultSort="newest" emptyTitle="No closed cases yet" />
    </>
  );
}
