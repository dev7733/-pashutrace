import type { Role } from './types';

export type PermKey =
  | 'report_animal'
  | 'upload_photo'
  | 'see_own_reports'
  | 'see_all_cases'
  | 'update_medical'
  | 'accept_assignment'
  | 'update_intake'
  | 'assign_cases'
  | 'manage_users'
  | 'manage_orgs'
  | 'suspend_accounts'
  | 'view_audit';

export type PermLevel = 'yes' | 'no' | 'limited';

export const PERMISSION_LABELS: Record<PermKey, string> = {
  report_animal: 'Report animal',
  upload_photo: 'Upload photograph',
  see_own_reports: 'See own reports',
  see_all_cases: 'See all assigned cases',
  update_medical: 'Update medical history',
  accept_assignment: 'Accept rescue assignment',
  update_intake: 'Update shelter intake',
  assign_cases: 'Assign cases',
  manage_users: 'Manage users',
  manage_orgs: 'Manage organisations',
  suspend_accounts: 'Suspend accounts',
  view_audit: 'View audit history',
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermKey[];

const Y: PermLevel = 'yes';
const N: PermLevel = 'no';
const L: PermLevel = 'limited';

export const PERMISSIONS: Record<PermKey, Record<Role, PermLevel>> = {
  report_animal: { community: Y, vet: Y, gaushala: Y, operations: Y, admin: Y },
  upload_photo: { community: Y, vet: Y, gaushala: Y, operations: Y, admin: Y },
  see_own_reports: { community: Y, vet: Y, gaushala: Y, operations: Y, admin: Y },
  see_all_cases: { community: N, vet: Y, gaushala: Y, operations: Y, admin: Y },
  update_medical: { community: N, vet: Y, gaushala: L, operations: N, admin: Y },
  accept_assignment: { community: N, vet: N, gaushala: Y, operations: N, admin: Y },
  update_intake: { community: N, vet: N, gaushala: Y, operations: N, admin: Y },
  assign_cases: { community: N, vet: L, gaushala: N, operations: Y, admin: Y },
  manage_users: { community: N, vet: N, gaushala: N, operations: N, admin: Y },
  manage_orgs: { community: N, vet: N, gaushala: N, operations: N, admin: Y },
  suspend_accounts: { community: N, vet: N, gaushala: N, operations: N, admin: Y },
  view_audit: { community: N, vet: L, gaushala: L, operations: L, admin: Y },
};

export function permLevel(role: Role | undefined, key: PermKey): PermLevel {
  if (!role) return 'no';
  return PERMISSIONS[key][role];
}

/** True for both "yes" and "limited". Callers enforce the "limited" scope themselves. */
export function can(role: Role | undefined, key: PermKey): boolean {
  return permLevel(role, key) !== 'no';
}

export function canFully(role: Role | undefined, key: PermKey): boolean {
  return permLevel(role, key) === 'yes';
}
