'use client';

import { CaseList } from '@/components/CaseList';
import { PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { assignedCases } from '@/lib/selectors';

export default function VetCases() {
  const { db, user } = useApp();
  const list = user?.role === 'admin' ? db.cases : assignedCases(db, user);
  return (
    <>
      <PageHeader eyebrow="Veterinary" title="Assigned examinations" subtitle="Cases assigned to you or your clinic." />
      <CaseList cases={list} href={(c) => `/operations/cases/${c.id}`} showOrg={false} exportName="examinations" emptyTitle="No assigned cases" emptyBody="Operations will assign cases that need an examination." />
    </>
  );
}
