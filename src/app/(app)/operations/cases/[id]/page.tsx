'use client';

import { useParams } from 'next/navigation';
import { CaseDetail } from '@/components/CaseDetail';
import { useApp } from '@/lib/store';
import { ROLE_HOME } from '@/lib/meta';

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const back = user?.role === 'operations' ? '/operations/cases' : user?.role === 'admin' ? '/admin/cases' : user ? ROLE_HOME[user.role] : '/';
  const label = user?.role === 'operations' || user?.role === 'admin' ? 'Cases' : 'Dashboard';
  return <CaseDetail caseId={id} backHref={back} backLabel={label} />;
}
