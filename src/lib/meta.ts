import type {
  AnimalStatus,
  CaseCategory,
  CaseStatus,
  Condition,
  OrgType,
  Priority,
  Role,
  Species,
} from './types';

export const ROLE_LABEL: Record<Role, string> = {
  community: 'Community Reporter',
  vet: 'Veterinary Professional',
  gaushala: 'Gaushala Operator',
  operations: 'Municipal / Operations Officer',
  admin: 'Administrator',
};

export const ROLE_HOME: Record<Role, string> = {
  community: '/community/dashboard',
  operations: '/operations/dashboard',
  vet: '/veterinary/dashboard',
  gaushala: '/gaushala/dashboard',
  admin: '/admin/dashboard',
};

export const STAFF_ROLES: Role[] = ['operations', 'vet', 'gaushala', 'admin'];
export const ALL_ROLES: Role[] = ['community', 'operations', 'vet', 'gaushala', 'admin'];

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  new: 'New',
  under_review: 'Under review',
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In progress',
  under_treatment: 'Under treatment',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  duplicate: 'Duplicate',
};

export const CASE_STATUSES = Object.keys(CASE_STATUS_LABEL) as CaseStatus[];
export const OPEN_STATUSES: CaseStatus[] = [
  'new',
  'under_review',
  'assigned',
  'accepted',
  'in_progress',
  'under_treatment',
];
export const DONE_STATUSES: CaseStatus[] = ['resolved', 'closed', 'rejected', 'duplicate'];

export const ANIMAL_STATUS_LABEL: Record<AnimalStatus, string> = {
  unknown: 'Unknown',
  community: 'Community animal',
  owned: 'Owned',
  in_shelter: 'In shelter',
  under_treatment: 'Under treatment',
  transferred: 'Transferred',
  released: 'Released',
  deceased: 'Deceased',
};
export const ANIMAL_STATUSES = Object.keys(ANIMAL_STATUS_LABEL) as AnimalStatus[];

export const CATEGORY_LABEL: Record<CaseCategory, string> = {
  stray: 'Stray animal',
  injured: 'Injured animal',
  suspected_transport: 'Suspected illegal transport',
  abandoned: 'Abandoned animal',
  other: 'Other concern',
};

export const CATEGORY_HINT: Record<CaseCategory, string> = {
  stray: 'Animal roaming without a handler',
  injured: 'Visible injury, accident or illness',
  suspected_transport: 'Overloaded or covered vehicle, animals being moved suspiciously',
  abandoned: 'Animal or calf left behind',
  other: 'Anything else the team should look at',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
export const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export const CONDITION_LABEL: Record<Condition, string> = {
  healthy: 'Looks healthy',
  weak: 'Weak / thin',
  injured: 'Injured',
  sick: 'Sick',
  critical: 'Critical',
  unknown: 'Cannot tell',
};

export const SPECIES_LABEL: Record<Species, string> = {
  cow: 'Cow',
  bull: 'Bull',
  calf: 'Calf',
  buffalo: 'Buffalo',
  dog: 'Dog',
  cat: 'Cat',
  horse: 'Horse',
  donkey: 'Donkey',
  goat: 'Goat',
  sheep: 'Sheep',
  other: 'Other animal',
};

/** Species offered when reporting a sighting. */
export const REPORT_SPECIES: Species[] = ['cow', 'buffalo', 'dog', 'cat', 'horse', 'goat', 'sheep', 'other'];

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  gaushala: 'Gaushala',
  clinic: 'Veterinary clinic',
  municipal: 'Municipal team',
};

export const ACCESS_ROLE_LABEL = {
  gaushala: 'Gaushala operator',
  vet: 'Veterinary professional',
  operations: 'Municipal / operations officer',
} as const;

/** Which org type is appropriate for a requested staff role. */
export const ROLE_ORG_TYPE: Record<'gaushala' | 'vet' | 'operations', OrgType> = {
  gaushala: 'gaushala',
  vet: 'clinic',
  operations: 'municipal',
};

export const STATUS_TONE: Record<CaseStatus, string> = {
  new: 'bg-info/12 text-info ring-info/25',
  under_review: 'bg-warn/15 text-warn ring-warn/30',
  assigned: 'bg-accent/15 text-accent ring-accent/30',
  accepted: 'bg-accent/15 text-accent ring-accent/30',
  in_progress: 'bg-brand/12 text-brand ring-brand/30',
  under_treatment: 'bg-danger/12 text-danger ring-danger/25',
  resolved: 'bg-ok/15 text-ok ring-ok/30',
  closed: 'bg-muted/15 text-muted ring-muted/25',
  rejected: 'bg-muted/15 text-muted ring-muted/25',
  duplicate: 'bg-muted/15 text-muted ring-muted/25',
};

export const ANIMAL_TONE: Record<AnimalStatus, string> = {
  unknown: 'bg-muted/15 text-muted ring-muted/25',
  community: 'bg-info/12 text-info ring-info/25',
  owned: 'bg-brand/12 text-brand ring-brand/30',
  in_shelter: 'bg-ok/15 text-ok ring-ok/30',
  under_treatment: 'bg-danger/12 text-danger ring-danger/25',
  transferred: 'bg-accent/15 text-accent ring-accent/30',
  released: 'bg-brand/12 text-brand ring-brand/30',
  deceased: 'bg-muted/15 text-muted ring-muted/25',
};

export const PRIORITY_TONE: Record<Priority, string> = {
  low: 'bg-muted/15 text-muted ring-muted/25',
  medium: 'bg-info/12 text-info ring-info/25',
  high: 'bg-accent/15 text-accent ring-accent/30',
  critical: 'bg-danger/15 text-danger ring-danger/30',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#7b8a7f',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

/** Rohtak, Haryana — default map centre for the pilot. */
export const MAP_CENTER: [number, number] = [28.8955, 76.6066];

export const STATUS_COLOR: Record<CaseStatus, string> = {
  new: '#3b82f6',
  under_review: '#f59e0b',
  assigned: '#a855f7',
  accepted: '#06b6d4',
  in_progress: '#16a34a',
  under_treatment: '#ef4444',
  resolved: '#84cc16',
  closed: '#64748b',
  rejected: '#94a3b8',
  duplicate: '#cbd5e1',
};
