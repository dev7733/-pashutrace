'use client';

import { CaseList } from '@/components/CaseList';
import { PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';

export default function AdminCases() {
  const { db } = useApp();
  return (
    <>
      <PageHeader eyebrow="Administration" title="Reports and cases" subtitle={`${db.cases.length} total across the system.`} />
      <CaseList cases={db.cases} href={(c) => `/operations/cases/${c.id}`} exportName="all-cases" />
    </>
  );
}
