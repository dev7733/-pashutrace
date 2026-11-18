'use client';

import { CaseList } from '@/components/CaseList';
import { Notice, PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';

export default function Inbox() {
  const { db } = useApp();
  const cases = db.cases.filter((c) => c.status === 'new' || c.status === 'under_review' || (!c.assignedOrgId && ['assigned'].includes(c.status)));
  const dups = cases.filter((c) => c.possibleDuplicateOf).length;
  return (
    <>
      <PageHeader eyebrow="Operations" title="Incoming reports" subtitle="New and in-review reports waiting to be triaged or assigned." />
      {dups > 0 && <Notice tone="warn" className="mb-4" title={`${dups} possible duplicate${dups === 1 ? '' : 's'}`}>Open the case to compare it with the original before assigning.</Notice>}
      <CaseList cases={cases} href={(c) => `/operations/cases/${c.id}`} exportName="incoming-reports" emptyTitle="Inbox zero" emptyBody="Every report has been triaged." />
    </>
  );
}
