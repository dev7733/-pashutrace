'use client';

import { useParams } from 'next/navigation';
import { CaseDetail } from '@/components/CaseDetail';
import { useApp } from '@/lib/store';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const staff = user && user.role !== 'community';
  return <CaseDetail caseId={id} backHref={staff ? '/operations/cases' : '/community/reports'} backLabel={staff ? 'Cases' : 'My reports'} />;
}
