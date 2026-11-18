'use client';

import { Plus } from 'lucide-react';
import { CaseList } from '@/components/CaseList';
import { LinkButton, PageHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { myReports } from '@/lib/selectors';

export default function MyReports() {
  const { db, user } = useApp();
  return (
    <>
      <PageHeader title="My reports" subtitle="Everything you have reported, and where it stands." actions={<LinkButton href="/community/report/new"><Plus className="h-4 w-4" />New sighting</LinkButton>} />
      <CaseList cases={myReports(db, user)} href={(c) => `/community/reports/${c.id}`} showReporter={false} emptyTitle="You have not reported anything yet" emptyBody="When you spot an animal in need, file a sighting and follow it here." defaultSort="newest" />
    </>
  );
}
