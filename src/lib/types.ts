export type Role = 'community' | 'vet' | 'gaushala' | 'operations' | 'admin';

export type CaseStatus =
  | 'new'
  | 'under_review'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'under_treatment'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | 'duplicate';

export type AnimalStatus =
  | 'unknown'
  | 'community'
  | 'owned'
  | 'in_shelter'
  | 'under_treatment'
  | 'transferred'
  | 'released'
  | 'deceased';

export type CaseCategory = 'stray' | 'injured' | 'suspected_transport' | 'abandoned' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type OrgType = 'gaushala' | 'clinic' | 'municipal';
export type IdentifierType = 'RFID' | 'QR' | 'PASHU_AADHAAR' | 'UHF_EPC';
export type Species = 'cow' | 'bull' | 'calf' | 'buffalo' | 'dog' | 'cat' | 'horse' | 'donkey' | 'goat' | 'sheep' | 'other';
export type Condition = 'healthy' | 'weak' | 'injured' | 'sick' | 'critical' | 'unknown';
export type SightingSource = 'manual' | 'rfid' | 'qr' | 'barcode';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string; // demo only — never store plain passwords in production (use Supabase Auth)
  role: Role;
  orgId?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  district: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  capacity?: number;
  verified: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  requestedRole: Exclude<Role, 'community' | 'admin'>;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface Identifier {
  type: IdentifierType;
  value: string;
}

export interface Animal {
  id: string;
  label: string; // human description, e.g. "Brown cow, white patch"
  species: Species;
  sex: 'male' | 'female' | 'unknown';
  color?: string;
  status: AnimalStatus;
  identifiers: Identifier[];
  orgId?: string; // current custodian
  ownerNote?: string;
  notes?: string;
  createdAt: string;
}

export interface Sighting {
  id: string;
  animalId?: string;
  unknownIdentifier?: string;
  caseId: string;
  reporterId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  landmark: string;
  observedAt: string;
  condition: Condition;
  count: number;
  notes?: string;
  photo?: string;
  source: SightingSource;
  synced: boolean;
}

export interface TransportInfo {
  vehicleNumber?: string;
  vehicleType?: string;
  direction?: string;
}

export interface Case {
  id: string;
  code: string;
  title: string;
  category: CaseCategory;
  species?: Species;
  priority: Priority;
  status: CaseStatus;
  animalId?: string;
  reporterId: string;
  assignedOrgId?: string;
  assignedUserId?: string;
  transport?: TransportInfo;
  possibleDuplicateOf?: string;
  duplicateOf?: string;
  lat: number;
  lng: number;
  landmark: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  at: string;
  actorId: string;
  type: 'reported' | 'status' | 'assigned' | 'referred' | 'note' | 'sighting' | 'priority' | 'animal_linked' | 'synced';
  fromStatus?: CaseStatus;
  toStatus?: CaseStatus;
  note?: string;
  visibility: 'public' | 'internal';
}

export interface MedicalRecord {
  id: string;
  animalId: string;
  caseId?: string;
  vetId: string;
  at: string;
  type: 'examination' | 'treatment' | 'vaccination' | 'follow_up' | 'surgery';
  diagnosis: string;
  treatment?: string;
  medication?: string;
  followUpDate?: string;
  followUpDone?: boolean;
}

export interface Intake {
  id: string;
  orgId: string;
  animalId: string;
  caseId?: string;
  at: string;
  condition: Condition;
  pen?: string;
  notes?: string;
  exitedAt?: string;
  exitReason?: 'released' | 'transferred' | 'deceased';
  exitNote?: string;
  recordedBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  at: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
}

export interface DB {
  version: number;
  profiles: Profile[];
  organizations: Organization[];
  memberships: Membership[];
  animals: Animal[];
  sightings: Sighting[];
  cases: Case[];
  events: CaseEvent[];
  medical: MedicalRecord[];
  intakes: Intake[];
  notifications: Notification[];
  audit: AuditEntry[];
}

export interface AppState {
  db: DB;
  sessionUserId: string | null;
  simulateOffline: boolean;
  ready: boolean;
}

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
