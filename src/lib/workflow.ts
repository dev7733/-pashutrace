import type { Case, CaseStatus, Profile } from './types';
import { CASE_STATUS_LABEL } from './meta';

/** Every legal status change in the system. Role checks are layered on top. */
export const STATUS_FLOW: Record<CaseStatus, CaseStatus[]> = {
  new: ['under_review', 'rejected', 'duplicate'],
  under_review: ['rejected', 'duplicate'],
  assigned: ['accepted', 'under_review', 'rejected'],
  accepted: ['in_progress', 'under_review'],
  in_progress: ['under_treatment', 'resolved'],
  under_treatment: ['in_progress', 'resolved'],
  resolved: ['closed', 'in_progress'],
  closed: ['under_review'],
  rejected: ['under_review'],
  duplicate: ['under_review'],
};

export interface Transition {
  to: CaseStatus;
  label: string;
  tone: 'primary' | 'neutral' | 'danger';
  needsNote: boolean;
}

const LABELS: Partial<Record<string, { label: string; tone: Transition['tone']; needsNote?: boolean }>> = {
  'new>under_review': { label: 'Start review', tone: 'primary' },
  'under_review>rejected': { label: 'Reject report', tone: 'danger', needsNote: true },
  'new>rejected': { label: 'Reject report', tone: 'danger', needsNote: true },
  'new>duplicate': { label: 'Mark duplicate', tone: 'neutral', needsNote: true },
  'under_review>duplicate': { label: 'Mark duplicate', tone: 'neutral', needsNote: true },
  'assigned>accepted': { label: 'Accept assignment', tone: 'primary' },
  'assigned>under_review': { label: 'Decline / send back', tone: 'danger', needsNote: true },
  'assigned>rejected': { label: 'Reject report', tone: 'danger', needsNote: true },
  'accepted>in_progress': { label: 'Start work', tone: 'primary' },
  'accepted>under_review': { label: 'Send back for review', tone: 'neutral', needsNote: true },
  'in_progress>under_treatment': { label: 'Move to treatment', tone: 'primary' },
  'in_progress>resolved': { label: 'Mark resolved', tone: 'primary', needsNote: true },
  'under_treatment>in_progress': { label: 'Treatment complete — back to rescue', tone: 'neutral' },
  'under_treatment>resolved': { label: 'Mark resolved', tone: 'primary', needsNote: true },
  'resolved>closed': { label: 'Verify & close case', tone: 'primary' },
  'resolved>in_progress': { label: 'Reopen work', tone: 'neutral', needsNote: true },
  'closed>under_review': { label: 'Reopen case', tone: 'neutral', needsNote: true },
  'rejected>under_review': { label: 'Reopen for review', tone: 'neutral', needsNote: true },
  'duplicate>under_review': { label: 'Reopen for review', tone: 'neutral', needsNote: true },
};

export function isCaseAssignee(user: Profile, c: Case): boolean {
  if (c.assignedUserId && c.assignedUserId === user.id) return true;
  return !!user.orgId && !!c.assignedOrgId && user.orgId === c.assignedOrgId;
}

/** Whether this role may perform the given from>to transition on this case. */
function roleMayTransition(user: Profile, c: Case, to: CaseStatus): boolean {
  const from = c.status;
  if (user.status !== 'active') return false;
  if (user.role === 'admin') return true;
  if (user.role === 'operations') {
    // Operations triage, reject, verify and reopen. They do not do field work.
    return ['under_review', 'rejected', 'duplicate', 'closed'].includes(to) ||
      (from === 'resolved' && to === 'in_progress') ||
      (from === 'assigned' && to === 'under_review') ||
      (from === 'accepted' && to === 'under_review');
  }
  if (user.role === 'gaushala') {
    if (!isCaseAssignee(user, c)) return false;
    return ['accepted', 'in_progress', 'resolved'].includes(to) ||
      (from === 'assigned' && to === 'under_review') ||
      (from === 'accepted' && to === 'under_review');
  }
  if (user.role === 'vet') {
    if (!isCaseAssignee(user, c)) return false;
    return ['accepted', 'in_progress', 'under_treatment', 'resolved'].includes(to) ||
      (from === 'assigned' && to === 'under_review') ||
      (from === 'accepted' && to === 'under_review');
  }
  return false;
}

export function allowedTransitions(user: Profile | null | undefined, c: Case): Transition[] {
  if (!user) return [];
  return STATUS_FLOW[c.status]
    .filter((to) => roleMayTransition(user, c, to))
    // Closed / rejected / duplicate can be reopened by admin only.
    .filter((to) => !(['closed', 'rejected', 'duplicate'].includes(c.status) && user.role !== 'admin' && user.role !== 'operations'))
    .filter((to) => !(c.status === 'closed' && user.role !== 'admin'))
    .map((to) => {
      const meta = LABELS[`${c.status}>${to}`];
      return {
        to,
        label: meta?.label ?? `Move to ${CASE_STATUS_LABEL[to]}`,
        tone: meta?.tone ?? 'neutral',
        needsNote: !!meta?.needsNote,
      };
    });
}

/** Statuses from which a case may be (re)assigned to an organisation. */
export const ASSIGNABLE_FROM: CaseStatus[] = [
  'new',
  'under_review',
  'assigned',
  'accepted',
  'in_progress',
  'under_treatment',
];

/** The progress track shown to community reporters. */
export const REPORTER_STEPS: Array<{ key: string; label: string; statuses: CaseStatus[] }> = [
  { key: 'received', label: 'Report received', statuses: ['new'] },
  { key: 'review', label: 'Being reviewed', statuses: ['under_review'] },
  { key: 'assigned', label: 'Team assigned', statuses: ['assigned', 'accepted'] },
  { key: 'action', label: 'Rescue / treatment', statuses: ['in_progress', 'under_treatment'] },
  { key: 'resolved', label: 'Resolved', statuses: ['resolved', 'closed'] },
];

export function reporterStepIndex(status: CaseStatus): number {
  const i = REPORTER_STEPS.findIndex((s) => s.statuses.includes(status));
  return i < 0 ? 0 : i;
}
