import type { Animal, Case, CaseEvent, DB, Intake, MedicalRecord, Organization, Profile, Sighting } from './types';
import { OPEN_STATUSES, PRIORITY_RANK } from './meta';
import { isCaseAssignee } from './workflow';
import { haversineKm } from './utils';

export const byId = <T extends { id: string }>(list: T[], id?: string): T | undefined =>
  id ? list.find((x) => x.id === id) : undefined;

export function userName(db: DB, id?: string): string {
  return byId(db.profiles, id)?.name ?? (id === 'system' ? 'System' : 'Unknown');
}

export function orgName(db: DB, id?: string): string {
  return byId(db.organizations, id)?.name ?? '—';
}

export function visibleCases(db: DB, user: Profile | null): Case[] {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'operations') return db.cases;
  if (user.role === 'community') return db.cases.filter((c) => c.reporterId === user.id);
  return db.cases.filter((c) => c.reporterId === user.id || isCaseAssignee(user, c));
}

export function myReports(db: DB, user: Profile | null): Case[] {
  if (!user) return [];
  return db.cases.filter((c) => c.reporterId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function assignedCases(db: DB, user: Profile | null): Case[] {
  if (!user) return [];
  return db.cases.filter((c) => isCaseAssignee(user, c));
}

export function sortByUrgency(list: Case[]): Case[] {
  return [...list].sort((a, b) => {
    const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    return p !== 0 ? p : b.createdAt.localeCompare(a.createdAt);
  });
}

export function isOpen(c: Case): boolean {
  return OPEN_STATUSES.includes(c.status);
}

export function sightingsForAnimal(db: DB, animalId: string): Sighting[] {
  return db.sightings.filter((s) => s.animalId === animalId).sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export function lastSeen(db: DB, animalId: string): Sighting | undefined {
  return sightingsForAnimal(db, animalId)[0];
}

export function eventsForCase(db: DB, caseId: string, includeInternal: boolean): CaseEvent[] {
  return db.events
    .filter((e) => e.caseId === caseId && (includeInternal || e.visibility === 'public'))
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function sightingsForCase(db: DB, caseId: string): Sighting[] {
  return db.sightings.filter((s) => s.caseId === caseId).sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export function medicalForAnimal(db: DB, animalId: string): MedicalRecord[] {
  return db.medical.filter((m) => m.animalId === animalId).sort((a, b) => b.at.localeCompare(a.at));
}

export function openIntake(db: DB, animalId: string): Intake | undefined {
  return db.intakes.find((i) => i.animalId === animalId && !i.exitedAt);
}

export function orgOccupancy(db: DB, orgId: string): number {
  return db.intakes.filter((i) => i.orgId === orgId && !i.exitedAt).length;
}

export function membersOf(db: DB, orgId?: string): Profile[] {
  return orgId ? db.profiles.filter((p) => p.orgId === orgId && p.status === 'active') : [];
}

export function assignableOrgs(db: DB): Organization[] {
  return db.organizations.filter((o) => o.verified && o.type !== 'municipal');
}

export function primaryIdentifier(a: Animal): string {
  const order = ['RFID', 'UHF_EPC', 'PASHU_AADHAAR', 'QR'] as const;
  for (const t of order) {
    const hit = a.identifiers.find((i) => i.type === t);
    if (hit) return hit.value;
  }
  return 'No tag';
}

export function followUpState(m: MedicalRecord, now = Date.now()): 'overdue' | 'today' | 'soon' | 'later' | 'done' | 'none' {
  if (!m.followUpDate) return 'none';
  if (m.followUpDone) return 'done';
  const due = new Date(m.followUpDate + 'T23:59:59').getTime();
  const start = new Date(m.followUpDate + 'T00:00:00').getTime();
  if (now > due) return 'overdue';
  if (now >= start) return 'today';
  if (start - now < 7 * 24 * 3_600_000) return 'soon';
  return 'later';
}

/** Group open cases into ~600 m grid cells to find recurring hotspots. */
export function hotspots(cases: Case[], minCount = 2): Array<{ lat: number; lng: number; count: number; label: string }> {
  const cells = new Map<string, Case[]>();
  for (const c of cases) {
    const key = `${(c.lat / 0.006).toFixed(0)}:${(c.lng / 0.006).toFixed(0)}`;
    const arr = cells.get(key) ?? [];
    arr.push(c);
    cells.set(key, arr);
  }
  return [...cells.values()]
    .filter((a) => a.length >= minCount)
    .map((a) => ({
      lat: a.reduce((s, c) => s + c.lat, 0) / a.length,
      lng: a.reduce((s, c) => s + c.lng, 0) / a.length,
      count: a.length,
      label: a[0]!.landmark,
    }))
    .sort((x, y) => y.count - x.count);
}

export function nearestOrg(db: DB, lat: number, lng: number, type: Organization['type']): Organization | undefined {
  return db.organizations
    .filter((o) => o.type === type && o.verified)
    .sort((a, b) => haversineKm([a.lat, a.lng], [lat, lng]) - haversineKm([b.lat, b.lng], [lat, lng]))[0];
}
