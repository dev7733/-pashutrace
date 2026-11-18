'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type {
  AppState,
  Animal,
  AnimalStatus,
  Case,
  CaseCategory,
  CaseEvent,
  CaseStatus,
  Condition,
  DB,
  Identifier,
  IdentifierType,
  Intake,
  MedicalRecord,
  Notification,
  Organization,
  Priority,
  Profile,
  Result,
  Role,
  Sighting,
  SightingSource,
  Species,
  TransportInfo,
} from './types';
import { buildSeed, DB_VERSION } from './seed';
import {
  CATEGORY_LABEL,
  CASE_STATUS_LABEL,
  OPEN_STATUSES,
  ROLE_ORG_TYPE,
} from './meta';
import { can } from './permissions';
import { allowedTransitions, ASSIGNABLE_FROM, isCaseAssignee } from './workflow';
import { haversineKm, isValidEmail } from './utils';

const KEY = 'pashutrace.demo.v3';

const EMPTY_DB: DB = {
  version: 0,
  profiles: [],
  organizations: [],
  memberships: [],
  animals: [],
  sightings: [],
  cases: [],
  events: [],
  medical: [],
  intakes: [],
  notifications: [],
  audit: [],
};

const SERVER_STATE: AppState = { db: EMPTY_DB, sessionUserId: null, simulateOffline: false, ready: false };

let state: AppState = SERVER_STATE;
let initialized = false;
const listeners = new Set<() => void>();

/* -------------------------------------------------------------------------- */
/* Persistence + subscription                                                 */
/* -------------------------------------------------------------------------- */

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed.db && parsed.db.version === DB_VERSION) {
        return {
          db: parsed.db,
          sessionUserId: parsed.sessionUserId ?? null,
          simulateOffline: !!parsed.simulateOffline,
          ready: true,
        };
      }
    }
  } catch {
    /* corrupted storage — fall through to a fresh seed */
  }
  return { db: buildSeed(), sessionUserId: null, simulateOffline: false, ready: true };
}

function persist() {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ db: state.db, sessionUserId: state.sessionUserId, simulateOffline: state.simulateOffline }),
    );
  } catch {
    /* storage full or blocked — the app keeps working in memory */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  state = load();
  emit();
}

export function getSnapshot(): AppState {
  if (typeof window === 'undefined') return SERVER_STATE;
  if (!initialized) {
    initialized = true;
    state = load();
    persist();
    window.addEventListener('storage', onStorage);
  }
  return state;
}

export function getServerSnapshot(): AppState {
  return SERVER_STATE;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function mutate<T>(fn: (db: DB) => T): T {
  getSnapshot();
  const db = structuredClone(state.db);
  const out = fn(db);
  state = { ...state, db };
  persist();
  emit();
  return out;
}

function setMeta(patch: Partial<Pick<AppState, 'sessionUserId' | 'simulateOffline'>>) {
  getSnapshot();
  state = { ...state, ...patch };
  persist();
  emit();
}

/* -------------------------------------------------------------------------- */
/* React hook                                                                 */
/* -------------------------------------------------------------------------- */

export interface AppView extends AppState {
  user: Profile | null;
}

export function useApp(): AppView {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const user = s.db.profiles.find((p) => p.id === s.sessionUserId && p.status === 'active') ?? null;
    return { ...s, user };
  }, [s]);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = <T = undefined,>(error: string): Result<T> => ({ ok: false, error });

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function actor(): Profile | null {
  const s = getSnapshot();
  return s.db.profiles.find((p) => p.id === s.sessionUserId && p.status === 'active') ?? null;
}

export function isEffectivelyOnline(): boolean {
  const s = getSnapshot();
  const nav = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return nav && !s.simulateOffline;
}

function audit(db: DB, actorId: string, action: string, entity: string, entityId: string, details?: string) {
  db.audit.unshift({ id: uid('au'), at: nowIso(), actorId, action, entity, entityId, details });
  if (db.audit.length > 600) db.audit.length = 600;
}

function hrefForUser(user: Profile, caseId: string): string {
  return user.role === 'community' ? `/community/reports/${caseId}` : `/operations/cases/${caseId}`;
}

function notifyUsers(
  db: DB,
  userIds: Array<string | undefined>,
  excludeId: string | undefined,
  title: string,
  body: string,
  caseId?: string,
  fixedHref?: string,
) {
  const seen = new Set<string>();
  for (const uidv of userIds) {
    if (!uidv || uidv === excludeId || seen.has(uidv)) continue;
    seen.add(uidv);
    const u = db.profiles.find((p) => p.id === uidv);
    if (!u || u.status !== 'active') continue;
    db.notifications.unshift({
      id: uid('nt'),
      userId: uidv,
      at: nowIso(),
      title,
      body,
      href: fixedHref ?? (caseId ? hrefForUser(u, caseId) : undefined),
      read: false,
    } satisfies Notification);
  }
  if (db.notifications.length > 800) db.notifications.length = 800;
}

function usersWithRole(db: DB, ...roles: Role[]): string[] {
  return db.profiles.filter((p) => roles.includes(p.role) && p.status === 'active').map((p) => p.id);
}

function addEvent(db: DB, ev: Omit<CaseEvent, 'id' | 'at'> & { at?: string }) {
  db.events.push({ id: uid('ev'), at: ev.at ?? nowIso(), ...ev });
}

function nextCaseCode(db: DB): string {
  let max = 100;
  for (const c of db.cases) {
    const m = /PT-\d{4}-(\d+)/.exec(c.code);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  return `PT-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`;
}

export function validateIdentifier(type: IdentifierType, raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Enter an identifier.';
  if (type === 'RFID') {
    if (!/^\d{15}$/.test(value)) return 'An animal RFID (ISO 11784) number has 15 digits.';
  } else if (type === 'UHF_EPC') {
    if (!/^([0-9a-fA-F]{24}|[0-9a-fA-F]{32})$/.test(value)) return 'A UHF chip ID (EPC) is 24 or 32 hexadecimal characters.';
  } else if (type === 'PASHU_AADHAAR') {
    if (!/^\d{12}$/.test(value)) return 'A Pashu Aadhaar / ear-tag ID has 12 digits.';
  } else if (value.length > 64 || /\s/.test(value)) {
    return 'QR codes must be 64 characters or fewer with no spaces.';
  }
  return null;
}

/** Guess the identifier type from a scanned string. */
export function guessIdentifierType(raw: string): IdentifierType {
  const v = raw.trim();
  if (/^\d{15}$/.test(v)) return 'RFID';
  if (/^\d{12}$/.test(v)) return 'PASHU_AADHAAR';
  if (/^([0-9a-fA-F]{24}|[0-9a-fA-F]{32})$/.test(v)) return 'UHF_EPC';
  return 'QR';
}

export function findAnimalByIdentifier(db: DB, raw: string): Animal | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  return db.animals.find((a) => a.identifiers.some((i) => i.value.toLowerCase() === v));
}

function identifierConflict(db: DB, identifiers: Identifier[], exceptAnimalId?: string): string | null {
  for (const i of identifiers) {
    const hit = findAnimalByIdentifier(db, i.value);
    if (hit && hit.id !== exceptAnimalId) {
      return `Identifier ${i.value} is already registered to “${hit.label}”.`;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export function login(email: string, password: string): Result<Profile> {
  const s = getSnapshot();
  const p = s.db.profiles.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!p || p.password !== password) return fail('Incorrect email or password.');
  if (p.status === 'suspended') return fail('This account has been suspended. Contact an administrator.');
  mutate((db) => audit(db, p.id, 'auth.login', 'user', p.id));
  setMeta({ sessionUserId: p.id });
  return ok(p);
}

export function logout() {
  const u = actor();
  if (u) mutate((db) => audit(db, u.id, 'auth.logout', 'user', u.id));
  setMeta({ sessionUserId: null });
}

export function register(input: { name: string; email: string; phone?: string; password: string }): Result<Profile> {
  const s = getSnapshot();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return fail('Please enter your full name.');
  if (!isValidEmail(email)) return fail('Please enter a valid email address.');
  if (input.password.length < 8) return fail('Password must be at least 8 characters.');
  if (input.phone && !/^[0-9+\-\s]{8,15}$/.test(input.phone.trim())) return fail('Enter a valid phone number or leave it blank.');
  if (s.db.profiles.some((p) => p.email.toLowerCase() === email)) return fail('An account with this email already exists.');
  const profile: Profile = {
    id: uid('usr'),
    name,
    email,
    phone: input.phone?.trim() || undefined,
    password: input.password,
    role: 'community',
    status: 'active',
    createdAt: nowIso(),
  };
  mutate((db) => {
    db.profiles.push(profile);
    audit(db, profile.id, 'auth.register', 'user', profile.id, 'Registered as Community Reporter');
  });
  setMeta({ sessionUserId: profile.id });
  return ok(profile);
}

/** Simulated email magic link: signs in an existing user or creates a community account. */
export function magicLink(email: string): Result<Profile> {
  const e = email.trim().toLowerCase();
  if (!isValidEmail(e)) return fail('Please enter a valid email address.');
  const s = getSnapshot();
  const existing = s.db.profiles.find((p) => p.email.toLowerCase() === e);
  if (existing) {
    if (existing.status === 'suspended') return fail('This account has been suspended. Contact an administrator.');
    setMeta({ sessionUserId: existing.id });
    mutate((db) => audit(db, existing.id, 'auth.magic_link', 'user', existing.id));
    return ok(existing);
  }
  const name = e.split('@')[0]!.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return register({ name: name.length >= 2 ? name : 'New User', email: e, password: uid('ml') });
}

export function updateProfile(patch: { name?: string; phone?: string }): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  if (patch.name !== undefined && patch.name.trim().length < 2) return fail('Please enter your full name.');
  if (patch.phone && !/^[0-9+\-\s]{8,15}$/.test(patch.phone.trim())) return fail('Enter a valid phone number or leave it blank.');
  mutate((db) => {
    const p = db.profiles.find((x) => x.id === u.id)!;
    if (patch.name !== undefined) p.name = patch.name.trim();
    if (patch.phone !== undefined) p.phone = patch.phone.trim() || undefined;
    audit(db, u.id, 'user.profile_updated', 'user', u.id);
  });
  return ok(undefined);
}

export function requestAccess(input: { orgId: string; role: 'gaushala' | 'vet' | 'operations'; message?: string }): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  if (u.role !== 'community') return fail('You already have institutional access.');
  const s = getSnapshot();
  const org = s.db.organizations.find((o) => o.id === input.orgId);
  if (!org) return fail('Choose an organisation.');
  if (org.type !== ROLE_ORG_TYPE[input.role]) return fail('That role does not match the type of organisation you selected.');
  if (s.db.memberships.some((m) => m.userId === u.id && m.status === 'pending')) {
    return fail('You already have a pending request.');
  }
  mutate((db) => {
    const id = uid('mem');
    db.memberships.push({
      id,
      userId: u.id,
      orgId: input.orgId,
      requestedRole: input.role,
      message: input.message?.trim() || undefined,
      status: 'pending',
      createdAt: nowIso(),
    });
    notifyUsers(
      db,
      usersWithRole(db, 'admin'),
      u.id,
      'Access request pending',
      `${u.name} requested ${input.role} access for ${org.name}.`,
      undefined,
      '/admin/users',
    );
    audit(db, u.id, 'access.requested', 'membership', id, `${input.role} @ ${org.name}`);
  });
  return ok(undefined);
}

export function decideAccess(membershipId: string, approve: boolean, verifyOrg = false): Result {
  const u = actor();
  if (!u || !can(u.role, 'manage_users')) return fail('Only administrators can verify access requests.');
  const s = getSnapshot();
  const m = s.db.memberships.find((x) => x.id === membershipId);
  if (!m || m.status !== 'pending') return fail('This request has already been handled.');
  mutate((db) => {
    const mm = db.memberships.find((x) => x.id === membershipId)!;
    const target = db.profiles.find((p) => p.id === mm.userId)!;
    const org = db.organizations.find((o) => o.id === mm.orgId)!;
    mm.status = approve ? 'approved' : 'rejected';
    mm.decidedAt = nowIso();
    mm.decidedBy = u.id;
    if (approve) {
      target.role = mm.requestedRole;
      target.orgId = mm.orgId;
      if (verifyOrg && !org.verified) {
        org.verified = true;
        audit(db, u.id, 'org.verified', 'organization', org.id, org.name);
      }
    }
    notifyUsers(
      db,
      [target.id],
      u.id,
      approve ? 'Institutional access approved' : 'Access request declined',
      approve
        ? `You now have ${mm.requestedRole} access for ${org.name}. Your institutional dashboard is unlocked.`
        : `Your request for ${org.name} was not approved. Contact an administrator for details.`,
      undefined,
      approve ? '/community/profile' : '/community/profile',
    );
    audit(db, u.id, approve ? 'access.approved' : 'access.rejected', 'membership', mm.id, `${target.name} → ${org.name}`);
  });
  return ok(undefined);
}

/* -------------------------------------------------------------------------- */
/* Reports and cases                                                          */
/* -------------------------------------------------------------------------- */

export interface ReportInput {
  category: CaseCategory;
  species?: Species;
  title?: string;
  animalId?: string;
  unknownIdentifier?: string;
  source: SightingSource;
  lat: number;
  lng: number;
  accuracy?: number;
  landmark: string;
  condition: Condition;
  count: number;
  notes?: string;
  photo?: string;
  transport?: TransportInfo;
}

function derivePriority(i: Pick<ReportInput, 'category' | 'condition' | 'count'>): Priority {
  switch (i.category) {
    case 'suspected_transport':
      return i.count >= 10 || i.condition === 'critical' ? 'critical' : 'high';
    case 'injured':
      return i.condition === 'critical' ? 'critical' : 'high';
    case 'abandoned':
      return ['weak', 'sick', 'critical', 'injured'].includes(i.condition) ? 'high' : 'medium';
    case 'stray':
      return i.condition === 'healthy' ? 'low' : 'medium';
    default:
      return 'low';
  }
}

export function createReport(input: ReportInput): Result<Case> {
  const u = actor();
  if (!u) return fail('Please sign in to submit a report.');
  if (!can(u.role, 'report_animal')) return fail('Your account cannot submit reports.');
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) return fail('Choose a location on the map.');
  if (input.landmark.trim().length < 3) return fail('Add a landmark or short address so teams can find the place.');
  if (input.count < 1 || input.count > 500) return fail('Number of animals must be between 1 and 500.');
  const s = getSnapshot();
  if (input.animalId && !s.db.animals.some((a) => a.id === input.animalId)) return fail('That animal no longer exists.');
  const online = isEffectivelyOnline();

  const created = mutate((db) => {
    const caseId = uid('case');
    const priority = derivePriority(input);
    const now = Date.now();
    // Duplicate detection: same animal (72 h) or same category within ~150 m (24 h).
    const dup = db.cases.find((c) => {
      if (!OPEN_STATUSES.includes(c.status)) return false;
      const age = now - new Date(c.createdAt).getTime();
      if (input.animalId && c.animalId === input.animalId && age < 72 * 3_600_000) return true;
      return (
        c.category === input.category &&
        age < 24 * 3_600_000 &&
        haversineKm([c.lat, c.lng], [input.lat, input.lng]) < 0.15
      );
    });
    const animal = input.animalId ? db.animals.find((a) => a.id === input.animalId) : undefined;
    const title =
      input.title?.trim() ||
      `${CATEGORY_LABEL[input.category]} — ${animal ? animal.label : input.landmark.trim()}`.slice(0, 120);
    const c: Case = {
      id: caseId,
      code: nextCaseCode(db),
      title,
      category: input.category,
      species: input.species ?? animal?.species,
      priority,
      status: 'new',
      animalId: input.animalId,
      reporterId: u.id,
      transport: input.category === 'suspected_transport' ? input.transport : undefined,
      possibleDuplicateOf: dup?.id,
      lat: input.lat,
      lng: input.lng,
      landmark: input.landmark.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.cases.push(c);
    db.sightings.push({
      id: uid('sg'),
      caseId,
      animalId: input.animalId,
      unknownIdentifier: input.unknownIdentifier,
      reporterId: u.id,
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy,
      landmark: input.landmark.trim(),
      observedAt: nowIso(),
      condition: input.condition,
      count: input.count,
      notes: input.notes?.trim() || undefined,
      photo: input.photo,
      source: input.source,
      synced: online,
    } satisfies Sighting);
    addEvent(db, {
      caseId,
      actorId: u.id,
      type: 'reported',
      toStatus: 'new',
      note: input.notes?.trim() || undefined,
      visibility: 'public',
    });
    const urgent = priority === 'critical' || priority === 'high';
    notifyUsers(
      db,
      usersWithRole(db, 'operations', 'admin'),
      u.id,
      `${urgent ? (priority === 'critical' ? 'Critical report' : 'High-priority report') : 'New report'}: ${title}`,
      `${c.code} at ${c.landmark}${dup ? ' — possible duplicate flagged.' : '.'}${input.unknownIdentifier ? ' Unknown tag ID flagged for review.' : ''}`,
      caseId,
    );
    audit(db, u.id, 'case.created', 'case', c.code, `${CATEGORY_LABEL[c.category]} @ ${c.landmark}${online ? '' : ' (queued offline)'}`);
    return c;
  });
  return ok(created);
}

function canViewCaseInternal(u: Profile, c: Case): boolean {
  if (u.role === 'admin' || u.role === 'operations') return true;
  if (c.reporterId === u.id) return true;
  if (u.role === 'vet' || u.role === 'gaushala') return isCaseAssignee(u, c);
  return false;
}
export { canViewCaseInternal as canViewCase };

export function changeStatus(caseId: string, to: CaseStatus, note?: string): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  const c = getSnapshot().db.cases.find((x) => x.id === caseId);
  if (!c) return fail('Case not found.');
  const t = allowedTransitions(u, c).find((x) => x.to === to);
  if (!t) return fail('That status change is not allowed for your role at this stage.');
  const cleanNote = note?.trim();
  if (t.needsNote && !cleanNote) return fail('Add a short note explaining this change.');
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    const from = cc.status;
    cc.status = to;
    cc.updatedAt = nowIso();
    if (to === 'duplicate') cc.duplicateOf = cc.possibleDuplicateOf;
    const declined = (from === 'assigned' || from === 'accepted') && to === 'under_review';
    const declinedBy = cc.assignedOrgId;
    if (declined) {
      cc.assignedOrgId = undefined;
      cc.assignedUserId = undefined;
    }
    addEvent(db, {
      caseId,
      actorId: u.id,
      type: 'status',
      fromStatus: from,
      toStatus: to,
      note: cleanNote,
      visibility: declined ? 'internal' : 'public',
    });
    // Keep the animal record in step with the case.
    if (cc.animalId) {
      const a = db.animals.find((x) => x.id === cc.animalId);
      if (a) {
        const openIntake = db.intakes.some((i) => i.animalId === a.id && !i.exitedAt);
        if (to === 'under_treatment') a.status = 'under_treatment';
        else if (from === 'under_treatment' && (to === 'in_progress' || to === 'resolved')) {
          a.status = openIntake ? 'in_shelter' : a.status === 'under_treatment' ? 'community' : a.status;
        }
      }
    }
    const reporterMsg = `${cc.code} is now “${CASE_STATUS_LABEL[to]}”.${cleanNote && to !== 'under_review' ? ` ${cleanNote}` : ''}`;
    notifyUsers(db, [cc.reporterId], u.id, `Update on your report: ${CASE_STATUS_LABEL[to]}`, reporterMsg, caseId);
    if (u.role !== 'operations' && u.role !== 'admin') {
      notifyUsers(
        db,
        usersWithRole(db, 'operations'),
        u.id,
        declined ? `Assignment declined: ${cc.code}` : `${cc.code} → ${CASE_STATUS_LABEL[to]}`,
        declined
          ? `${u.name} sent the case back for review${cleanNote ? `: ${cleanNote}` : '.'}`
          : `${u.name} updated the case status.`,
        caseId,
      );
    }
    void declinedBy;
    audit(db, u.id, `case.${to}`, 'case', cc.code, cleanNote);
  });
  return ok(undefined);
}

export function assignCase(caseId: string, orgId: string, userId?: string, note?: string): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  if (!can(u.role, 'assign_cases')) return fail('Your role cannot assign cases.');
  const s = getSnapshot();
  const c = s.db.cases.find((x) => x.id === caseId);
  const org = s.db.organizations.find((o) => o.id === orgId);
  if (!c) return fail('Case not found.');
  if (!org) return fail('Choose an organisation.');
  if (!org.verified) return fail('Only verified organisations can receive assignments.');
  if (!ASSIGNABLE_FROM.includes(c.status)) return fail('This case can no longer be assigned.');
  if (org.type === 'municipal') return fail('Assign cases to a gaushala or a veterinary clinic.');
  if (u.role === 'vet') {
    if (!isCaseAssignee(u, c)) return fail('You can only refer cases that are assigned to you.');
    if (org.type !== 'gaushala') return fail('Veterinarians can refer cases to a gaushala only.');
  }
  if (userId) {
    const target = s.db.profiles.find((p) => p.id === userId);
    if (!target || target.orgId !== orgId || target.status !== 'active') return fail('That person is not an active member of the organisation.');
  }
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    const from = cc.status;
    const reset = ['new', 'under_review', 'assigned', 'accepted'].includes(from);
    cc.assignedOrgId = orgId;
    cc.assignedUserId = userId;
    cc.updatedAt = nowIso();
    if (reset) cc.status = 'assigned';
    addEvent(db, {
      caseId,
      actorId: u.id,
      type: reset ? 'assigned' : 'referred',
      fromStatus: from,
      toStatus: cc.status,
      note: `${reset ? 'Assigned to' : 'Referred to'} ${org.name}${note?.trim() ? ` — ${note.trim()}` : ''}`,
      visibility: 'public',
    });
    const recipients = userId ? [userId] : db.profiles.filter((p) => p.orgId === orgId && p.status === 'active').map((p) => p.id);
    notifyUsers(db, recipients, u.id, `New assignment: ${cc.title}`, `${cc.code} at ${cc.landmark}${note?.trim() ? ` — ${note.trim()}` : ''}`, caseId);
    notifyUsers(db, [cc.reporterId], u.id, 'A team has been assigned to your report', `${org.name} is handling ${cc.code}.`, caseId);
    audit(db, u.id, 'case.assigned', 'case', cc.code, `→ ${org.name}`);
  });
  return ok(undefined);
}

export function setPriority(caseId: string, priority: Priority): Result {
  const u = actor();
  if (!u || (u.role !== 'operations' && u.role !== 'admin')) return fail('Only operations officers can change priority.');
  const c = getSnapshot().db.cases.find((x) => x.id === caseId);
  if (!c) return fail('Case not found.');
  if (c.priority === priority) return ok(undefined);
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    const from = cc.priority;
    cc.priority = priority;
    cc.updatedAt = nowIso();
    addEvent(db, { caseId, actorId: u.id, type: 'priority', note: `Priority ${from} → ${priority}`, visibility: 'internal' });
    audit(db, u.id, 'case.priority', 'case', cc.code, `${from} → ${priority}`);
  });
  return ok(undefined);
}

export function addCaseNote(caseId: string, note: string, visibility: 'public' | 'internal'): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  const c = getSnapshot().db.cases.find((x) => x.id === caseId);
  if (!c) return fail('Case not found.');
  if (!canViewCaseInternal(u, c)) return fail('You do not have access to this case.');
  const text = note.trim();
  if (text.length < 2) return fail('Write a short note first.');
  if (u.role === 'community' && visibility === 'internal') return fail('Reporters can only add public updates.');
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    cc.updatedAt = nowIso();
    addEvent(db, { caseId, actorId: u.id, type: 'note', note: text, visibility });
    if (visibility === 'public') {
      const targets = [cc.reporterId, cc.assignedUserId, ...usersWithRole(db, 'operations')];
      if (cc.assignedOrgId) targets.push(...db.profiles.filter((p) => p.orgId === cc.assignedOrgId).map((p) => p.id));
      notifyUsers(db, targets, u.id, `New note on ${cc.code}`, text.slice(0, 140), caseId);
    }
    audit(db, u.id, 'case.note', 'case', cc.code, visibility);
  });
  return ok(undefined);
}

export function linkAnimal(caseId: string, animalId: string): Result {
  const u = actor();
  if (!u || u.role === 'community') return fail('Not allowed.');
  const s = getSnapshot();
  const c = s.db.cases.find((x) => x.id === caseId);
  const a = s.db.animals.find((x) => x.id === animalId);
  if (!c || !a) return fail('Case or animal not found.');
  if (!canViewCaseInternal(u, c)) return fail('You do not have access to this case.');
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    cc.animalId = animalId;
    cc.updatedAt = nowIso();
    addEvent(db, { caseId, actorId: u.id, type: 'animal_linked', note: `Linked animal “${a.label}”`, visibility: 'internal' });
    audit(db, u.id, 'case.animal_linked', 'case', cc.code, a.label);
  });
  return ok(undefined);
}

export function addSighting(
  caseId: string,
  input: { lat: number; lng: number; accuracy?: number; landmark: string; condition: Condition; count: number; notes?: string; animalId?: string; source: SightingSource },
): Result {
  const u = actor();
  if (!u) return fail('Please sign in.');
  const c = getSnapshot().db.cases.find((x) => x.id === caseId);
  if (!c) return fail('Case not found.');
  if (!canViewCaseInternal(u, c)) return fail('You do not have access to this case.');
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) return fail('A location is required.');
  if (input.landmark.trim().length < 3) return fail('Add a landmark.');
  const online = isEffectivelyOnline();
  mutate((db) => {
    const cc = db.cases.find((x) => x.id === caseId)!;
    db.sightings.push({
      id: uid('sg'),
      caseId,
      animalId: input.animalId ?? cc.animalId,
      reporterId: u.id,
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy,
      landmark: input.landmark.trim(),
      observedAt: nowIso(),
      condition: input.condition,
      count: input.count,
      notes: input.notes?.trim() || undefined,
      source: input.source,
      synced: online,
    });
    cc.updatedAt = nowIso();
    addEvent(db, { caseId, actorId: u.id, type: 'sighting', note: `New sighting at ${input.landmark.trim()}`, visibility: 'public' });
    audit(db, u.id, 'sighting.added', 'case', cc.code, input.landmark);
  });
  return ok(undefined);
}

/* -------------------------------------------------------------------------- */
/* Medical + shelter                                                          */
/* -------------------------------------------------------------------------- */

export function addMedicalRecord(input: {
  animalId: string;
  caseId?: string;
  type: MedicalRecord['type'];
  diagnosis: string;
  treatment?: string;
  medication?: string;
  followUpDate?: string;
}): Result {
  const u = actor();
  if (!u || !can(u.role, 'update_medical')) return fail('Your role cannot update medical history.');
  const s = getSnapshot();
  const animal = s.db.animals.find((a) => a.id === input.animalId);
  if (!animal) return fail('Choose an animal.');
  if (input.diagnosis.trim().length < 3) return fail('Enter a diagnosis or observation.');
  if (u.role === 'gaushala') {
    if (!['follow_up', 'vaccination'].includes(input.type)) return fail('Gaushala staff can add follow-up and vaccination entries only. Clinical diagnoses are entered by veterinarians.');
    if (animal.orgId !== u.orgId) return fail('You can only update animals in your own shelter.');
  }
  if (input.followUpDate && Number.isNaN(Date.parse(input.followUpDate))) return fail('Enter a valid follow-up date.');
  mutate((db) => {
    const id = uid('med');
    db.medical.push({
      id,
      animalId: input.animalId,
      caseId: input.caseId,
      vetId: u.id,
      at: nowIso(),
      type: input.type,
      diagnosis: input.diagnosis.trim(),
      treatment: input.treatment?.trim() || undefined,
      medication: input.medication?.trim() || undefined,
      followUpDate: input.followUpDate || undefined,
      followUpDone: input.followUpDate ? false : undefined,
    });
    if (input.caseId) {
      const cc = db.cases.find((x) => x.id === input.caseId);
      if (cc) {
        cc.updatedAt = nowIso();
        addEvent(db, { caseId: cc.id, actorId: u.id, type: 'note', note: `Medical record added: ${input.diagnosis.trim()}`, visibility: 'internal' });
      }
    }
    audit(db, u.id, 'medical.added', 'animal', animal.id, `${input.type}: ${input.diagnosis.trim()}`);
  });
  return ok(undefined);
}

export function completeFollowUp(recordId: string): Result {
  const u = actor();
  if (!u || !can(u.role, 'update_medical')) return fail('Not allowed.');
  const r = getSnapshot().db.medical.find((m) => m.id === recordId);
  if (!r || !r.followUpDate) return fail('Follow-up not found.');
  mutate((db) => {
    const rr = db.medical.find((m) => m.id === recordId)!;
    rr.followUpDone = true;
    audit(db, u.id, 'medical.followup_done', 'animal', rr.animalId, rr.diagnosis);
  });
  return ok(undefined);
}

export interface IntakeInput {
  orgId?: string;
  animalId?: string;
  newAnimal?: { label: string; species: Species; sex: Animal['sex']; color?: string; identifiers: Identifier[] };
  caseId?: string;
  condition: Condition;
  pen?: string;
  notes?: string;
}

export function intakeAnimal(input: IntakeInput): Result<Intake> {
  const u = actor();
  if (!u || !can(u.role, 'update_intake')) return fail('Your role cannot record shelter intake.');
  const orgId = u.role === 'admin' ? input.orgId : u.orgId;
  if (!orgId) return fail('Choose the receiving shelter.');
  const s = getSnapshot();
  const org = s.db.organizations.find((o) => o.id === orgId);
  if (!org || org.type !== 'gaushala') return fail('Intake can only be recorded for a gaushala.');
  if (!org.verified) return fail('This shelter is not verified yet.');
  const open = s.db.intakes.filter((i) => i.orgId === orgId && !i.exitedAt).length;
  if (org.capacity && open >= org.capacity) return fail(`${org.name} is at capacity (${org.capacity}). Release or transfer an animal first.`);
  if (!input.animalId && !input.newAnimal) return fail('Select an existing animal or register a new one.');
  if (input.animalId) {
    const a = s.db.animals.find((x) => x.id === input.animalId);
    if (!a) return fail('Animal not found.');
    if (s.db.intakes.some((i) => i.animalId === a.id && !i.exitedAt)) return fail('This animal is already admitted to a shelter.');
    if (a.status === 'deceased') return fail('This animal is recorded as deceased.');
  }
  if (input.newAnimal) {
    if (input.newAnimal.label.trim().length < 3) return fail('Describe the animal (e.g. “Brown cow, white patch”).');
    for (const i of input.newAnimal.identifiers) {
      const err = validateIdentifier(i.type, i.value);
      if (err) return fail(err);
    }
    const conflict = identifierConflict(s.db, input.newAnimal.identifiers);
    if (conflict) return fail(conflict);
  }
  if (input.caseId) {
    const c = s.db.cases.find((x) => x.id === input.caseId);
    if (!c) return fail('Case not found.');
    if (u.role !== 'admin' && c.assignedOrgId !== orgId) return fail('That case is not assigned to your shelter.');
  }
  const created = mutate((db) => {
    let animalId = input.animalId;
    if (!animalId && input.newAnimal) {
      animalId = uid('ani');
      db.animals.push({
        id: animalId,
        label: input.newAnimal.label.trim(),
        species: input.newAnimal.species,
        sex: input.newAnimal.sex,
        color: input.newAnimal.color?.trim() || undefined,
        status: 'in_shelter',
        identifiers: input.newAnimal.identifiers.map((i) => ({ type: i.type, value: i.value.trim() })),
        orgId,
        createdAt: nowIso(),
      });
      audit(db, u.id, 'animal.registered', 'animal', animalId, input.newAnimal.label.trim());
    }
    const animal = db.animals.find((a) => a.id === animalId)!;
    animal.status = 'in_shelter';
    animal.orgId = orgId;
    const intake: Intake = {
      id: uid('in'),
      orgId,
      animalId: animal.id,
      caseId: input.caseId,
      at: nowIso(),
      condition: input.condition,
      pen: input.pen?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      recordedBy: u.id,
    };
    db.intakes.push(intake);
    if (input.caseId) {
      const cc = db.cases.find((x) => x.id === input.caseId)!;
      if (!cc.animalId) cc.animalId = animal.id;
      cc.updatedAt = nowIso();
      addEvent(db, { caseId: cc.id, actorId: u.id, type: 'note', note: `Admitted to ${org.name}${intake.pen ? ` (${intake.pen})` : ''}`, visibility: 'public' });
      if (cc.status === 'accepted') {
        cc.status = 'in_progress';
        addEvent(db, { caseId: cc.id, actorId: u.id, type: 'status', fromStatus: 'accepted', toStatus: 'in_progress', note: 'Animal received at shelter.', visibility: 'public' });
      }
      notifyUsers(db, [cc.reporterId, ...usersWithRole(db, 'operations')], u.id, `Animal admitted: ${cc.code}`, `${animal.label} is now at ${org.name}.`, cc.id);
    }
    audit(db, u.id, 'shelter.intake', 'animal', animal.id, `${org.name}${intake.pen ? ` · ${intake.pen}` : ''}`);
    return intake;
  });
  return ok(created);
}

export function exitAnimal(intakeId: string, reason: 'released' | 'transferred' | 'deceased', note?: string): Result {
  const u = actor();
  if (!u || !can(u.role, 'update_intake')) return fail('Your role cannot update shelter records.');
  const i = getSnapshot().db.intakes.find((x) => x.id === intakeId);
  if (!i || i.exitedAt) return fail('This intake is already closed.');
  if (u.role !== 'admin' && i.orgId !== u.orgId) return fail('You can only update your own shelter.');
  if (note !== undefined && note.trim().length < 3 && reason !== 'released') return fail('Add a short note for this exit.');
  mutate((db) => {
    const ii = db.intakes.find((x) => x.id === intakeId)!;
    ii.exitedAt = nowIso();
    ii.exitReason = reason;
    ii.exitNote = note?.trim() || undefined;
    const a = db.animals.find((x) => x.id === ii.animalId);
    if (a) {
      a.status = reason as AnimalStatus;
      a.orgId = undefined;
    }
    audit(db, u.id, `shelter.${reason}`, 'animal', ii.animalId, note?.trim());
  });
  return ok(undefined);
}

/* -------------------------------------------------------------------------- */
/* Animal database                                                            */
/* -------------------------------------------------------------------------- */

export function registerAnimal(input: {
  label: string;
  species: Species;
  sex: Animal['sex'];
  color?: string;
  status: AnimalStatus;
  identifiers: Identifier[];
  notes?: string;
}): Result<Animal> {
  const u = actor();
  if (!u || (u.role !== 'admin' && u.role !== 'operations')) return fail('Only operations officers and administrators can register animals.');
  if (input.label.trim().length < 3) return fail('Describe the animal (e.g. “Brown cow, white patch”).');
  for (const i of input.identifiers) {
    const err = validateIdentifier(i.type, i.value);
    if (err) return fail(err);
  }
  const conflict = identifierConflict(getSnapshot().db, input.identifiers);
  if (conflict) return fail(conflict);
  const animal: Animal = {
    id: uid('ani'),
    label: input.label.trim(),
    species: input.species,
    sex: input.sex,
    color: input.color?.trim() || undefined,
    status: input.status,
    identifiers: input.identifiers.map((i) => ({ type: i.type, value: i.value.trim() })),
    notes: input.notes?.trim() || undefined,
    createdAt: nowIso(),
  };
  mutate((db) => {
    db.animals.push(animal);
    audit(db, u.id, 'animal.registered', 'animal', animal.id, animal.label);
  });
  return ok(animal);
}

export function updateAnimal(
  id: string,
  patch: Partial<Pick<Animal, 'label' | 'species' | 'sex' | 'color' | 'status' | 'notes' | 'ownerNote'>>,
): Result {
  const u = actor();
  if (!u || (u.role !== 'admin' && u.role !== 'operations')) return fail('Only operations officers and administrators can edit animals.');
  const a = getSnapshot().db.animals.find((x) => x.id === id);
  if (!a) return fail('Animal not found.');
  if (patch.label !== undefined && patch.label.trim().length < 3) return fail('Description is too short.');
  mutate((db) => {
    const aa = db.animals.find((x) => x.id === id)!;
    Object.assign(aa, patch);
    if (patch.label !== undefined) aa.label = patch.label.trim();
    audit(db, u.id, 'animal.updated', 'animal', id, Object.keys(patch).join(', '));
  });
  return ok(undefined);
}

export function addIdentifier(animalId: string, identifier: Identifier): Result {
  const u = actor();
  if (!u || (u.role !== 'admin' && u.role !== 'operations')) return fail('Only operations officers and administrators can add identifiers.');
  const err = validateIdentifier(identifier.type, identifier.value);
  if (err) return fail(err);
  const s = getSnapshot();
  if (!s.db.animals.some((a) => a.id === animalId)) return fail('Animal not found.');
  const conflict = identifierConflict(s.db, [identifier], animalId);
  if (conflict) return fail(conflict);
  mutate((db) => {
    const a = db.animals.find((x) => x.id === animalId)!;
    if (a.identifiers.some((i) => i.value === identifier.value.trim())) return;
    a.identifiers.push({ type: identifier.type, value: identifier.value.trim() });
    audit(db, u.id, 'animal.identifier_added', 'animal', animalId, `${identifier.type} ${identifier.value.trim()}`);
  });
  return ok(undefined);
}

/* -------------------------------------------------------------------------- */
/* Administration                                                             */
/* -------------------------------------------------------------------------- */

export function setUserRole(userId: string, role: Role, orgId?: string): Result {
  const u = actor();
  if (!u || !can(u.role, 'manage_users')) return fail('Only administrators can manage users.');
  const s = getSnapshot();
  const target = s.db.profiles.find((p) => p.id === userId);
  if (!target) return fail('User not found.');
  if (target.id === u.id) return fail('You cannot change your own role.');
  if (role !== 'community' && role !== 'admin') {
    const org = s.db.organizations.find((o) => o.id === orgId);
    if (!org) return fail('Choose an organisation for this staff role.');
    if (org.type !== ROLE_ORG_TYPE[role as 'gaushala' | 'vet' | 'operations']) return fail('That role does not match the organisation type.');
  }
  if (target.role === 'admin' && role !== 'admin' && s.db.profiles.filter((p) => p.role === 'admin' && p.status === 'active').length <= 1) {
    return fail('At least one active administrator is required.');
  }
  mutate((db) => {
    const t = db.profiles.find((p) => p.id === userId)!;
    t.role = role;
    t.orgId = role === 'community' || role === 'admin' ? undefined : orgId;
    audit(db, u.id, 'user.role_changed', 'user', userId, `${target.name}: ${target.role} → ${role}`);
    notifyUsers(db, [userId], u.id, 'Your role was updated', `You are now a ${role}.`, undefined, '/community/profile');
  });
  return ok(undefined);
}

export function toggleSuspend(userId: string): Result {
  const u = actor();
  if (!u || !can(u.role, 'suspend_accounts')) return fail('Only administrators can suspend accounts.');
  const s = getSnapshot();
  const target = s.db.profiles.find((p) => p.id === userId);
  if (!target) return fail('User not found.');
  if (target.id === u.id) return fail('You cannot suspend your own account.');
  if (target.role === 'admin' && target.status === 'active' && s.db.profiles.filter((p) => p.role === 'admin' && p.status === 'active').length <= 1) {
    return fail('At least one active administrator is required.');
  }
  mutate((db) => {
    const t = db.profiles.find((p) => p.id === userId)!;
    t.status = t.status === 'active' ? 'suspended' : 'active';
    audit(db, u.id, t.status === 'suspended' ? 'user.suspended' : 'user.reinstated', 'user', userId, t.name);
  });
  return ok(undefined);
}

export function saveOrganization(
  input: { id?: string; name: string; type: Organization['type']; address: string; phone?: string; lat: number; lng: number; capacity?: number },
): Result {
  const u = actor();
  if (!u || !can(u.role, 'manage_orgs')) return fail('Only administrators can manage organisations.');
  if (input.name.trim().length < 3) return fail('Enter the organisation name.');
  if (input.address.trim().length < 3) return fail('Enter an address.');
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) return fail('Enter valid coordinates.');
  if (input.type === 'gaushala' && input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) return fail('Capacity must be a whole number.');
  mutate((db) => {
    if (input.id) {
      const o = db.organizations.find((x) => x.id === input.id);
      if (!o) return;
      Object.assign(o, {
        name: input.name.trim(),
        type: input.type,
        address: input.address.trim(),
        phone: input.phone?.trim() || undefined,
        lat: input.lat,
        lng: input.lng,
        capacity: input.type === 'gaushala' ? input.capacity : undefined,
      });
      audit(db, u.id, 'org.updated', 'organization', o.id, o.name);
    } else {
      const o: Organization = {
        id: uid('org'),
        name: input.name.trim(),
        type: input.type,
        district: 'Rohtak',
        address: input.address.trim(),
        phone: input.phone?.trim() || undefined,
        lat: input.lat,
        lng: input.lng,
        capacity: input.type === 'gaushala' ? input.capacity : undefined,
        verified: false,
        createdAt: nowIso(),
      };
      db.organizations.push(o);
      audit(db, u.id, 'org.created', 'organization', o.id, o.name);
    }
  });
  return ok(undefined);
}

export function toggleOrgVerified(orgId: string): Result {
  const u = actor();
  if (!u || !can(u.role, 'manage_orgs')) return fail('Only administrators can manage organisations.');
  if (!getSnapshot().db.organizations.some((o) => o.id === orgId)) return fail('Organisation not found.');
  mutate((db) => {
    const o = db.organizations.find((x) => x.id === orgId)!;
    o.verified = !o.verified;
    audit(db, u.id, o.verified ? 'org.verified' : 'org.unverified', 'organization', o.id, o.name);
  });
  return ok(undefined);
}

/* -------------------------------------------------------------------------- */
/* Notifications, sync, demo                                                  */
/* -------------------------------------------------------------------------- */

export function markNotificationRead(id: string) {
  const u = actor();
  if (!u) return;
  const n = getSnapshot().db.notifications.find((x) => x.id === id);
  if (!n || n.read || n.userId !== u.id) return;
  mutate((db) => {
    db.notifications.find((x) => x.id === id)!.read = true;
  });
}

export function markAllNotificationsRead() {
  const u = actor();
  if (!u) return;
  mutate((db) => {
    for (const n of db.notifications) if (n.userId === u.id) n.read = true;
  });
}

export function pendingSyncCount(db: DB): number {
  return db.sightings.filter((s) => !s.synced).length;
}

/** Marks queued offline records as synced. In production this posts them to the API. */
export function flushQueue(): number {
  const s = getSnapshot();
  const pending = s.db.sightings.filter((x) => !x.synced);
  if (!pending.length) return 0;
  const u = actor();
  mutate((db) => {
    for (const sg of db.sightings) {
      if (sg.synced) continue;
      sg.synced = true;
      const c = db.cases.find((x) => x.id === sg.caseId);
      if (c) addEvent(db, { caseId: c.id, actorId: sg.reporterId, type: 'synced', note: 'Offline record synchronised', visibility: 'internal' });
    }
    audit(db, u?.id ?? 'system', 'sync.flushed', 'system', 'queue', `${pending.length} offline record(s) synchronised`);
  });
  return pending.length;
}

export function setSimulateOffline(value: boolean) {
  setMeta({ simulateOffline: value });
  if (!value && typeof navigator !== 'undefined' && navigator.onLine) flushQueue();
}

export function resetDemo() {
  getSnapshot();
  const db = buildSeed();
  const keep = state.sessionUserId && db.profiles.some((p) => p.id === state.sessionUserId) ? state.sessionUserId : null;
  state = { ...state, db, sessionUserId: keep };
  persist();
  emit();
}
