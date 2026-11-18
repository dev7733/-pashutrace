'use client';

import { CaseList } from '@/components/CaseList';
import { PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { isOpen } from '@/lib/selectors';

export default function AssignedCases() {
  const { db } = useApp();
  const cases = db.cases.filter((c) => c.assignedOrgId && isOpen(c));
  return (
    <>
      <PageHeader eyebrow="Operations" title="Assigned cases" subtitle="Open cases currently with a gaushala or clinic." />
      <CaseList cases={cases} href={(c) => `/operations/cases/${c.id}`} exportName="assigned-cases" emptyTitle="No assigned cases" emptyBody="Assign a case from the inbox." />
    </>
  );
}
