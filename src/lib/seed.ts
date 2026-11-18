import type {
  Animal,
  AuditEntry,
  Case,
  CaseCategory,
  CaseEvent,
  CaseStatus,
  Condition,
  DB,
  Intake,
  MedicalRecord,
  Membership,
  Notification,
  Organization,
  Priority,
  Profile,
  Sighting,
  Species,
  TransportInfo,
} from './types';

export const DB_VERSION = 5;
export const DEMO_PASSWORD = 'demo1234';

const H = 3_600_000;
const D = 24 * H;

export const DEMO_ACCOUNTS = [
  { email: 'aarav@demo.pashutrace.in', role: 'community', label: 'Community reporter', name: 'Aarav Sharma' },
  { email: 'ops@demo.pashutrace.in', role: 'operations', label: 'Operations officer', name: 'Rajesh Dahiya' },
  { email: 'vet@demo.pashutrace.in', role: 'vet', label: 'Veterinary professional', name: 'Dr. Sunita Hooda' },
  { email: 'gaushala@demo.pashutrace.in', role: 'gaushala', label: 'Gaushala operator', name: 'Mahesh Yadav' },
  { email: 'admin@demo.pashutrace.in', role: 'admin', label: 'Administrator', name: 'System Admin' },
] as const;

interface Place {
  name: string;
  lat: number;
  lng: number;
}

// Approximate locations around Rohtak, Haryana (sample data only).
const P: Record<string, Place> = {
  mdu: { name: 'MDU Campus, Gate 2', lat: 28.8722, lng: 76.6196 },
  busStand: { name: 'Old Bus Stand', lat: 28.8958, lng: 76.6063 },
  sec14: { name: 'Sector 14 Market', lat: 28.8651, lng: 76.6284 },
  delhiRoad: { name: 'Delhi Road, near Bypass Chowk', lat: 28.8893, lng: 76.5802 },
  jhajjar: { name: 'Jhajjar Road Toll Plaza', lat: 28.8607, lng: 76.5567 },
  gohana: { name: 'Gohana Road Flyover', lat: 28.9121, lng: 76.6328 },
  bahadurgarh: { name: 'Bahadurgarh Road, Kharawar', lat: 28.8812, lng: 76.5418 },
  sunaria: { name: 'Sunaria Chowk', lat: 28.9324, lng: 76.6262 },
  railway: { name: 'Railway Road Crossing', lat: 28.8995, lng: 76.5967 },
  sampla: { name: 'Sampla Bypass', lat: 28.8442, lng: 76.6081 },
  kalanaur: { name: 'Kalanaur Road', lat: 28.9102, lng: 76.5611 },
  pgims: { name: 'PGIMS Gate, Delhi Road', lat: 28.8868, lng: 76.5936 },
};

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

export function buildSeed(): DB {
  let n = 0;
  const id = (p: string) => `${p}_${(++n).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const org = (
    key: string,
    name: string,
    type: Organization['type'],
    address: string,
    lat: number,
    lng: number,
    capacity?: number,
    phone?: string,
    verified = true,
  ): Organization => ({
    id: `org_${key}`,
    name,
    type,
    district: 'Rohtak',
    address,
    phone,
    lat,
    lng,
    capacity,
    verified,
    createdAt: iso(120 * D),
  });

  const organizations: Organization[] = [
    org('muni', 'Municipal Animal Management Cell', 'municipal', 'Municipal Corporation Office, Rohtak', 28.8956, 76.6059, undefined, '01262-000-101'),
    org('gau1', 'Krishna Gau Seva Gaushala', 'gaushala', 'Kalanaur Road, Rohtak', 28.9128, 76.5598, 120, '01262-000-102'),
    org('gau2', 'Nandi Raksha Sadan', 'gaushala', 'Bahadurgarh Road, Rohtak', 28.8786, 76.5352, 60, '01262-000-103'),
    org('clinic1', 'Rohtak Veterinary Polyclinic', 'clinic', 'Civil Lines, Rohtak', 28.8932, 76.6101, undefined, '01262-000-104'),
    org('clinic2', 'University Veterinary Outreach Unit', 'clinic', 'MDU Campus, Rohtak', 28.8741, 76.6208, undefined, '01262-000-105'),
    org('gau3', 'Gau Sewa Trust (pending verification)', 'gaushala', 'Sampla Road, Rohtak', 28.8398, 76.6102, 40, undefined, false),
  ];

  const prof = (
    key: string,
    name: string,
    email: string,
    role: Profile['role'],
    orgId?: string,
    phone?: string,
    daysAgo = 90,
    status: Profile['status'] = 'active',
  ): Profile => ({
    id: `usr_${key}`,
    name,
    email,
    phone,
    password: DEMO_PASSWORD,
    role,
    orgId,
    status,
    createdAt: iso(daysAgo * D),
  });

  const profiles: Profile[] = [
    prof('admin', 'System Admin', 'admin@demo.pashutrace.in', 'admin', undefined, '9800000001', 120),
    prof('ops', 'Rajesh Dahiya', 'ops@demo.pashutrace.in', 'operations', 'org_muni', '9800000002', 100),
    prof('ops2', 'Neha Rathee', 'ops2@demo.pashutrace.in', 'operations', 'org_muni', '9800000003', 80),
    prof('vet', 'Dr. Sunita Hooda', 'vet@demo.pashutrace.in', 'vet', 'org_clinic1', '9800000004', 95),
    prof('vet2', 'Dr. Vikram Malik', 'vet2@demo.pashutrace.in', 'vet', 'org_clinic2', '9800000005', 70),
    prof('gau', 'Mahesh Yadav', 'gaushala@demo.pashutrace.in', 'gaushala', 'org_gau1', '9800000006', 90),
    prof('gau2', 'Sushila Devi', 'gaushala2@demo.pashutrace.in', 'gaushala', 'org_gau2', '9800000007', 60),
    prof('aarav', 'Aarav Sharma', 'aarav@demo.pashutrace.in', 'community', undefined, '9800000008', 45),
    prof('priya', 'Priya Malik', 'priya@demo.pashutrace.in', 'community', undefined, '9800000009', 30),
    prof('kunal', 'Kunal Singh', 'kunal@demo.pashutrace.in', 'community', undefined, undefined, 20),
    prof('blocked', 'Test Suspended User', 'suspended@demo.pashutrace.in', 'community', undefined, undefined, 50, 'suspended'),
  ];

  const memberships: Membership[] = [
    {
      id: id('mem'),
      userId: 'usr_kunal',
      orgId: 'org_gau3',
      requestedRole: 'gaushala',
      message: 'I manage intake at Gau Sewa Trust, Sampla Road. Please verify our trust.',
      status: 'pending',
      createdAt: iso(1.4 * D),
    },
    {
      id: id('mem'),
      userId: 'usr_gau',
      orgId: 'org_gau1',
      requestedRole: 'gaushala',
      status: 'approved',
      createdAt: iso(92 * D),
      decidedAt: iso(91 * D),
      decidedBy: 'usr_admin',
    },
  ];

  // ---- Animals --------------------------------------------------------------
  const animal = (
    key: string,
    label: string,
    species: Animal['species'],
    sex: Animal['sex'],
    status: Animal['status'],
    identifiers: Animal['identifiers'],
    color?: string,
    orgId?: string,
    notes?: string,
    daysAgo = 40,
  ): Animal => ({
    id: `ani_${key}`,
    label,
    species,
    sex,
    status,
    identifiers,
    color,
    orgId,
    notes,
    createdAt: iso(daysAgo * D),
  });

  const animals: Animal[] = [
    animal('a1', 'Brown cow, white forehead patch', 'cow', 'female', 'community', [{ type: 'RFID', value: '356000123456789' }, { type: 'PASHU_AADHAAR', value: '104512345678' }], 'Brown / white', undefined, 'Regularly seen near MDU campus.'),
    animal('a2', 'Grey bull, left horn broken', 'bull', 'male', 'under_treatment', [{ type: 'RFID', value: '356000123456790' }], 'Grey', 'org_gau1', 'Road-accident injury to hind leg.', 12),
    animal('a3', 'White calf, black ear', 'calf', 'female', 'in_shelter', [{ type: 'QR', value: 'PT-QR-0003' }], 'White', 'org_gau1', undefined, 9),
    animal('a4', 'Black cow, tag on right ear', 'cow', 'female', 'in_shelter', [{ type: 'RFID', value: '356000123456791' }, { type: 'PASHU_AADHAAR', value: '104512345679' }], 'Black', 'org_gau2', undefined, 25),
    animal('a5', 'Red-brown bull, large hump', 'bull', 'male', 'community', [{ type: 'RFID', value: '356000123456792' }], 'Red-brown', undefined, 'Frequently on Gohana Road.', 33),
    animal('a6', 'Light-brown cow with calf', 'cow', 'female', 'community', [{ type: 'QR', value: 'PT-QR-0006' }], 'Light brown', undefined, undefined, 18),
    animal('a7', 'Spotted calf, abandoned', 'calf', 'unknown', 'under_treatment', [{ type: 'QR', value: 'PT-QR-0007' }], 'Spotted', 'org_gau2', 'Found abandoned near railway crossing.', 6),
    animal('a8', 'Buffalo, dark grey', 'buffalo', 'female', 'owned', [{ type: 'PASHU_AADHAAR', value: '104512345680' }, { type: 'RFID', value: '356000123456793' }], 'Dark grey', undefined, 'Owner informed after sighting.', 60),
    animal('a9', 'White cow, injured foreleg', 'cow', 'female', 'released', [{ type: 'RFID', value: '356000123456794' }], 'White', undefined, 'Treated and returned to owner.', 50),
    animal('a10', 'Brown calf, no tag', 'calf', 'male', 'unknown', [], 'Brown', undefined, undefined, 3),
    animal('a11', 'Black bull, scar on flank', 'bull', 'male', 'transferred', [{ type: 'RFID', value: '356000123456795' }], 'Black', undefined, 'Transferred to another district gaushala.', 70),
    animal('a12', 'Pale cow, very thin', 'cow', 'female', 'in_shelter', [{ type: 'RFID', value: '356000123456796' }], 'Pale', 'org_gau1', 'Under nutritional recovery plan.', 15),
    animal('a13', 'Brindle cow', 'cow', 'female', 'deceased', [{ type: 'RFID', value: '356000123456797' }], 'Brindle', undefined, 'Died despite treatment.', 80),
    animal('a14', 'Tan cow, tagged', 'cow', 'female', 'community', [{ type: 'RFID', value: '356000123456798' }, { type: 'QR', value: 'PT-QR-0014' }], 'Tan', undefined, undefined, 22),
    animal('a15', 'Brown street dog, notched left ear', 'dog', 'male', 'community', [{ type: 'UHF_EPC', value: 'E28068940000400200000001' }], 'Brown', undefined, 'Regular on the MDU campus road. Vaccinated.', 28),
    animal('a16', 'Orange tabby, community cat', 'cat', 'female', 'community', [{ type: 'UHF_EPC', value: 'E28068940000400200000002' }], 'Orange', undefined, 'Fed by shopkeepers near Sector 14.', 21),
    animal('a17', 'Bay cart horse, very thin', 'horse', 'male', 'owned', [{ type: 'UHF_EPC', value: 'E28068940000400200000003' }], 'Bay', undefined, 'Working horse. Owner traced through the chip.', 14),
    animal('a18', 'Spotted goat kid', 'goat', 'female', 'community', [{ type: 'UHF_EPC', value: 'E28068940000400200000004' }], 'Spotted', undefined, undefined, 5),
  ];

  // ---- Cases ----------------------------------------------------------------
  const cases: Case[] = [];
  const events: CaseEvent[] = [];
  const sightings: Sighting[] = [];
  let seq = 0;

  interface Step {
    s: CaseStatus;
    by: string;
    after: number; // hours after previous step
    note?: string;
    internal?: boolean;
  }

  const mkCase = (cfg: {
    key: string;
    title: string;
    category: CaseCategory;
    species?: Species;
    priority: Priority;
    place: Place;
    reporter: string;
    hoursAgo: number;
    animalId?: string;
    condition?: Condition;
    count?: number;
    notes?: string;
    transport?: TransportInfo;
    steps?: Step[];
    orgId?: string;
    userId?: string;
    duplicateOf?: string;
    possibleDuplicateOf?: string;
    unknownIdentifier?: string;
  }) => {
    seq += 1;
    const caseId = `case_${cfg.key}`;
    const created = Date.now() - cfg.hoursAgo * H;
    const jitter = (v: number) => v + (Math.random() - 0.5) * 0.0012;
    const lat = jitter(cfg.place.lat);
    const lng = jitter(cfg.place.lng);
    let t = created;
    let status: CaseStatus = 'new';
    events.push({
      id: id('ev'),
      caseId,
      at: new Date(created).toISOString(),
      actorId: cfg.reporter,
      type: 'reported',
      note: cfg.notes,
      toStatus: 'new',
      visibility: 'public',
    });
    sightings.push({
      id: id('sg'),
      caseId,
      animalId: cfg.animalId,
      unknownIdentifier: cfg.unknownIdentifier,
      reporterId: cfg.reporter,
      lat,
      lng,
      accuracy: 12 + Math.round(Math.random() * 18),
      landmark: cfg.place.name,
      observedAt: new Date(created).toISOString(),
      condition: cfg.condition ?? 'unknown',
      count: cfg.count ?? 1,
      notes: cfg.notes,
      source: cfg.animalId ? 'rfid' : 'manual',
      synced: true,
    });
    for (const st of cfg.steps ?? []) {
      t += st.after * H;
      const isAssign = st.s === 'assigned';
      events.push({
        id: id('ev'),
        caseId,
        at: new Date(t).toISOString(),
        actorId: st.by,
        type: isAssign ? 'assigned' : 'status',
        fromStatus: status,
        toStatus: st.s,
        note: st.note,
        visibility: st.internal ? 'internal' : 'public',
      });
      status = st.s;
    }
    cases.push({
      id: caseId,
      code: `PT-2026-${String(100 + seq).padStart(4, '0')}`,
      title: cfg.title,
      category: cfg.category,
      species: cfg.species,
      priority: cfg.priority,
      status,
      animalId: cfg.animalId,
      reporterId: cfg.reporter,
      assignedOrgId: cfg.orgId,
      assignedUserId: cfg.userId,
      transport: cfg.transport,
      possibleDuplicateOf: cfg.possibleDuplicateOf,
      duplicateOf: cfg.duplicateOf,
      lat,
      lng,
      landmark: cfg.place.name,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(t).toISOString(),
    });
  };

  const OPS = 'usr_ops';
  const VET = 'usr_vet';
  const GAU = 'usr_gau';
  const GAU2 = 'usr_gau2';

  mkCase({
    key: 'c1', title: 'Injured bull on Gohana Road', category: 'injured', priority: 'high', place: P.gohana!,
    reporter: 'usr_aarav', hoursAgo: 9 * 24, animalId: 'ani_a2', condition: 'injured',
    notes: 'Bull limping badly after a vehicle hit it. Blocking one lane.',
    orgId: 'org_gau1', userId: GAU,
    steps: [
      { s: 'under_review', by: OPS, after: 0.5 },
      { s: 'assigned', by: OPS, after: 0.4, note: 'Assigned to Krishna Gau Seva Gaushala for pickup.' },
      { s: 'accepted', by: GAU, after: 0.8 },
      { s: 'in_progress', by: GAU, after: 1.2, note: 'Rescue vehicle dispatched.' },
      { s: 'under_treatment', by: VET, after: 6, note: 'Fracture suspected in hind leg. X-ray scheduled.' },
    ],
  });
  mkCase({
    key: 'c2', title: 'Overloaded covered truck near Jhajjar toll', category: 'suspected_transport', priority: 'critical', place: P.jhajjar!,
    reporter: 'usr_priya', hoursAgo: 3, count: 14, condition: 'weak',
    notes: 'Covered truck with legs visible under the tarpaulin, very little ventilation. Moving toward Delhi.',
    transport: { vehicleNumber: 'HR XX 0000 (sample)', vehicleType: 'Covered cargo truck', direction: 'Towards Jhajjar / Delhi' },
    steps: [{ s: 'under_review', by: OPS, after: 0.2, note: 'Escalating to the district enforcement team.', internal: true }],
  });
  mkCase({
    key: 'c3', title: 'Stray cow roaming near MDU Gate 2', category: 'stray', priority: 'medium', place: P.mdu!,
    reporter: 'usr_aarav', hoursAgo: 26, animalId: 'ani_a1', condition: 'healthy',
    notes: 'Same tagged cow seen every morning. Tag scanned successfully.',
    steps: [{ s: 'under_review', by: OPS, after: 3 }],
  });
  mkCase({
    key: 'c4', title: 'Abandoned calf at railway crossing', category: 'abandoned', priority: 'high', place: P.railway!,
    reporter: 'usr_priya', hoursAgo: 6 * 24, animalId: 'ani_a7', condition: 'weak',
    notes: 'Small spotted calf alone for two days.',
    orgId: 'org_gau2', userId: GAU2,
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'assigned', by: OPS, after: 0.3 },
      { s: 'accepted', by: GAU2, after: 1 },
      { s: 'in_progress', by: GAU2, after: 1 },
      { s: 'under_treatment', by: VET, after: 5, note: 'Dehydration and mild infection. Antibiotics started.' },
    ],
  });
  mkCase({
    key: 'c5', title: 'Cow with calf blocking Sector 14 market', category: 'stray', priority: 'low', place: P.sec14!,
    reporter: 'usr_kunal', hoursAgo: 2, count: 2, condition: 'healthy', notes: 'Not injured, just causing a jam.',
  });
  mkCase({
    key: 'c6', title: 'Thin cow collapsing near PGIMS gate', category: 'injured', priority: 'critical', place: P.pgims!,
    reporter: 'usr_priya', hoursAgo: 1, condition: 'critical', unknownIdentifier: '356000999000111',
    notes: 'Cow fell down and cannot stand. Tag scanned but number not in database.',
  });
  mkCase({
    key: 'c7', title: 'Bull wandering on Delhi Road bypass', category: 'stray', priority: 'medium', place: P.delhiRoad!,
    reporter: 'usr_aarav', hoursAgo: 4 * 24, animalId: 'ani_a5', condition: 'healthy',
    orgId: 'org_gau2', userId: GAU2,
    steps: [
      { s: 'under_review', by: OPS, after: 2 },
      { s: 'assigned', by: OPS, after: 1 },
      { s: 'accepted', by: GAU2, after: 3 },
    ],
  });
  mkCase({
    key: 'c8', title: 'Injured cow, foreleg wound — returned to owner', category: 'injured', priority: 'high', place: P.busStand!,
    reporter: 'usr_priya', hoursAgo: 20 * 24, animalId: 'ani_a9', condition: 'injured',
    orgId: 'org_clinic1', userId: VET,
    steps: [
      { s: 'under_review', by: OPS, after: 0.7 },
      { s: 'assigned', by: OPS, after: 0.5 },
      { s: 'accepted', by: VET, after: 1 },
      { s: 'in_progress', by: VET, after: 1 },
      { s: 'under_treatment', by: VET, after: 2, note: 'Wound cleaned and dressed.' },
      { s: 'resolved', by: VET, after: 72, note: 'Healed. Owner identified through Pashu Aadhaar and animal handed back.' },
      { s: 'closed', by: OPS, after: 24, note: 'Handover verified.' },
    ],
  });
  mkCase({
    key: 'c9', title: 'Suspicious pickup with calves — Kalanaur Road', category: 'suspected_transport', priority: 'high', place: P.kalanaur!,
    reporter: 'usr_aarav', hoursAgo: 15 * 24, count: 6, condition: 'unknown',
    notes: 'Small pickup carrying calves at night.',
    transport: { vehicleNumber: 'HR XX 1111 (sample)', vehicleType: 'Pickup', direction: 'Towards Kalanaur' },
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'rejected', by: OPS, after: 5, note: 'Vehicle was a registered dairy transport with documents. No action needed.', internal: false },
    ],
  });
  mkCase({
    key: 'c10', title: 'Pale cow very thin near Sampla bypass', category: 'stray', priority: 'medium', place: P.sampla!,
    reporter: 'usr_priya', hoursAgo: 12 * 24, animalId: 'ani_a12', condition: 'weak',
    orgId: 'org_gau1', userId: GAU,
    steps: [
      { s: 'under_review', by: OPS, after: 3 },
      { s: 'assigned', by: OPS, after: 1 },
      { s: 'accepted', by: GAU, after: 2 },
      { s: 'in_progress', by: GAU, after: 4, note: 'Picked up and admitted to shelter.' },
      { s: 'resolved', by: GAU, after: 48, note: 'Admitted and on a nutrition plan.' },
    ],
  });
  mkCase({
    key: 'c11', title: 'Cow near MDU Gate 2 (second report)', category: 'stray', priority: 'medium', place: P.mdu!,
    reporter: 'usr_kunal', hoursAgo: 20, animalId: 'ani_a1', condition: 'healthy',
    notes: 'Seen again this morning.', possibleDuplicateOf: 'case_c3',
  });
  mkCase({
    key: 'c12', title: 'Calf without tag near Sunaria Chowk', category: 'abandoned', priority: 'medium', place: P.sunaria!,
    reporter: 'usr_aarav', hoursAgo: 30, animalId: 'ani_a10', condition: 'weak',
    steps: [{ s: 'under_review', by: OPS, after: 2 }],
  });
  mkCase({
    key: 'c13', title: 'Tagged cow on Bahadurgarh Road', category: 'stray', priority: 'low', place: P.bahadurgarh!,
    reporter: 'usr_priya', hoursAgo: 40, animalId: 'ani_a14', condition: 'healthy',
    orgId: 'org_gau2', userId: GAU2,
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'assigned', by: OPS, after: 1, note: 'Please verify the tag record and relocate if unowned.' },
    ],
  });
  mkCase({
    key: 'c14', title: 'Black bull with flank scar — transferred', category: 'stray', priority: 'medium', place: P.railway!,
    reporter: 'usr_aarav', hoursAgo: 35 * 24, animalId: 'ani_a11', condition: 'healthy',
    orgId: 'org_gau1', userId: GAU,
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'assigned', by: OPS, after: 1 },
      { s: 'accepted', by: GAU, after: 2 },
      { s: 'in_progress', by: GAU, after: 2 },
      { s: 'resolved', by: GAU, after: 24, note: 'Transferred to a partner gaushala outside the district.' },
      { s: 'closed', by: OPS, after: 12 },
    ],
  });

  mkCase({
    key: 'c15', title: 'Cow with wounded leg near Old Bus Stand', category: 'injured', priority: 'high', place: P.busStand!,
    reporter: 'usr_priya', hoursAgo: 30, animalId: 'ani_a14', condition: 'injured',
    notes: 'Open wound on the hind leg, flies gathering. Tagged cow.',
    orgId: 'org_clinic1', userId: VET,
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'assigned', by: OPS, after: 0.5, note: 'Needs a veterinary examination first.' },
      { s: 'accepted', by: VET, after: 2 },
      { s: 'in_progress', by: VET, after: 3, note: 'Examination under way.' },
    ],
  });
  mkCase({
    key: 'c16', title: 'Calf with swollen eye near Sector 14', category: 'injured', priority: 'medium', place: P.sec14!,
    reporter: 'usr_kunal', hoursAgo: 5, animalId: 'ani_a6', condition: 'sick',
    orgId: 'org_clinic1', userId: VET,
    steps: [
      { s: 'under_review', by: OPS, after: 1 },
      { s: 'assigned', by: OPS, after: 0.5 },
    ],
  });

  mkCase({
    key: 'c17', title: 'Injured street dog near MDU Gate 2', category: 'injured', species: 'dog', priority: 'high', place: P.mdu!,
    reporter: 'usr_priya', hoursAgo: 7, animalId: 'ani_a15', condition: 'injured',
    notes: 'Limping badly after being hit by a bike. Chip scanned — known dog.',
  });
  mkCase({
    key: 'c18', title: 'Thin horse pulling a cart on Delhi Road', category: 'other', species: 'horse', priority: 'medium', place: P.delhiRoad!,
    reporter: 'usr_aarav', hoursAgo: 11, animalId: 'ani_a17', condition: 'weak',
    notes: 'Ribs visible, sore on the shoulder from the harness.',
    steps: [{ s: 'under_review', by: OPS, after: 2 }],
  });

  // Extra historical sightings of A1 and A5 to create a last-seen trail.
  const extraSighting = (animalId: string, caseId: string, place: Place, hoursAgo: number, reporter: string) => {
    sightings.push({
      id: id('sg'),
      animalId,
      caseId,
      reporterId: reporter,
      lat: place.lat + (Math.random() - 0.5) * 0.001,
      lng: place.lng + (Math.random() - 0.5) * 0.001,
      accuracy: 15,
      landmark: place.name,
      observedAt: iso(hoursAgo * H),
      condition: 'healthy',
      count: 1,
      source: 'rfid',
      synced: true,
    });
  };
  extraSighting('ani_a1', 'case_c3', P.sec14!, 5 * 24, 'usr_aarav');
  extraSighting('ani_a1', 'case_c3', P.pgims!, 3 * 24, 'usr_priya');
  extraSighting('ani_a1', 'case_c3', P.mdu!, 2 * 24, 'usr_aarav');
  extraSighting('ani_a5', 'case_c7', P.gohana!, 7 * 24, 'usr_aarav');
  extraSighting('ani_a5', 'case_c7', P.sunaria!, 6 * 24, 'usr_priya');

  // ---- Medical --------------------------------------------------------------
  const med = (
    animalId: string,
    caseId: string | undefined,
    vetId: string,
    daysAgo: number,
    type: MedicalRecord['type'],
    diagnosis: string,
    treatment?: string,
    medication?: string,
    followUpIn?: number,
    done = false,
  ): MedicalRecord => ({
    id: id('med'),
    animalId,
    caseId,
    vetId,
    at: iso(daysAgo * D),
    type,
    diagnosis,
    treatment,
    medication,
    followUpDate: followUpIn === undefined ? undefined : new Date(Date.now() + followUpIn * D).toISOString().slice(0, 10),
    followUpDone: followUpIn === undefined ? undefined : done,
  });

  const medical: MedicalRecord[] = [
    med('ani_a2', 'case_c1', VET, 2.5, 'examination', 'Suspected hind-leg fracture after road accident', 'Immobilisation, pain relief', 'Meloxicam (vet-prescribed)', 1),
    med('ani_a7', 'case_c4', VET, 4, 'treatment', 'Dehydration with mild respiratory infection', 'IV fluids, warmth', 'Antibiotic course (5 days)', -1),
    med('ani_a9', 'case_c8', VET, 18, 'treatment', 'Deep wound on foreleg', 'Cleaning, suturing, dressing', 'Antiseptic, antibiotics', 7, true),
    med('ani_a9', 'case_c8', VET, 11, 'follow_up', 'Wound healing well', 'Dressing change', undefined, undefined),
    med('ani_a12', 'case_c10', 'usr_vet2', 9, 'examination', 'Severe under-nutrition, parasites', 'Deworming, feed plan', 'Anthelmintic + mineral mix', 3),
    med('ani_a4', undefined, 'usr_vet2', 30, 'vaccination', 'FMD vaccination', 'Annual FMD booster', undefined, 330),
    med('ani_a1', undefined, VET, 40, 'vaccination', 'Routine vaccination', 'Annual booster', undefined, 325),
    med('ani_a3', undefined, 'usr_vet2', 8, 'examination', 'Routine check on newly admitted calf', 'Nutrition review', undefined, 0),
    med('ani_a13', undefined, VET, 82, 'treatment', 'Advanced illness on presentation', 'Supportive care', undefined),
  ];

  // ---- Intakes --------------------------------------------------------------
  const intakes: Intake[] = [
    { id: id('in'), orgId: 'org_gau1', animalId: 'ani_a2', caseId: 'case_c1', at: iso(8.7 * D), condition: 'injured', pen: 'Hospital pen H1', notes: 'Isolated for fracture care.', recordedBy: GAU },
    { id: id('in'), orgId: 'org_gau1', animalId: 'ani_a3', at: iso(9 * D), condition: 'healthy', pen: 'Calf shed C2', recordedBy: GAU },
    { id: id('in'), orgId: 'org_gau2', animalId: 'ani_a4', at: iso(25 * D), condition: 'healthy', pen: 'Pen B4', recordedBy: GAU2 },
    { id: id('in'), orgId: 'org_gau2', animalId: 'ani_a7', caseId: 'case_c4', at: iso(5.5 * D), condition: 'weak', pen: 'Calf shed C1', notes: 'Needs warmth and fluids.', recordedBy: GAU2 },
    { id: id('in'), orgId: 'org_gau1', animalId: 'ani_a12', caseId: 'case_c10', at: iso(9.5 * D), condition: 'weak', pen: 'Pen A3', recordedBy: GAU },
    { id: id('in'), orgId: 'org_gau1', animalId: 'ani_a11', caseId: 'case_c14', at: iso(34 * D), condition: 'healthy', pen: 'Pen A1', exitedAt: iso(33 * D), exitReason: 'transferred', exitNote: 'Moved to partner gaushala.', recordedBy: GAU },
  ];

  // ---- Notifications ---------------------------------------------------------
  const notif = (userId: string, hoursAgo: number, title: string, body: string, href?: string, read = false): Notification => ({
    id: id('nt'),
    userId,
    at: iso(hoursAgo * H),
    title,
    body,
    href,
    read,
  });
  const notifications: Notification[] = [
    notif('usr_aarav', 0.5, 'Case PT-2026-0111 is under review', 'The operations team has started reviewing your report about the cow near MDU Gate 2.', '/community/reports/case_c11'),
    notif('usr_aarav', 90, 'Your report PT-2026-0101 is under treatment', 'The bull from Gohana Road is now with a veterinarian.', '/community/reports/case_c1'),
    notif('usr_aarav', 400, 'Case PT-2026-0108 was closed', 'The injured cow was treated and handed back to its owner. Thank you!', '/community/reports/case_c8', true),
    notif('usr_ops', 1, 'Critical report: thin cow collapsing near PGIMS gate', 'PT-2026-0106 needs urgent triage.', '/operations/cases/case_c6'),
    notif('usr_ops', 3, 'Critical report: suspected illegal transport', 'PT-2026-0102 — 14 animals, covered truck near Jhajjar toll.', '/operations/cases/case_c2'),
    notif('usr_ops', 20, 'Possible duplicate detected', 'PT-2026-0111 looks like a repeat of PT-2026-0103.', '/operations/cases/case_c11', true),
    notif('usr_vet', 5, 'Follow-up due tomorrow', 'Bull with broken horn (PT-2026-0101) needs a follow-up examination.', '/veterinary/follow-ups'),
    notif('usr_gau', 40, 'New assignment', 'Case PT-2026-0101 was assigned to your gaushala.', '/operations/cases/case_c1', true),
    notif('usr_gau2', 38, 'New assignment', 'Case PT-2026-0113 was assigned to your gaushala.', '/operations/cases/case_c13'),
    notif('usr_admin', 30, 'Access request pending', 'Kunal Singh requested gaushala operator access for Gau Sewa Trust.', '/admin/users'),
  ];

  // ---- Audit ----------------------------------------------------------------
  const audit: AuditEntry[] = [];
  const A = (hoursAgo: number, actorId: string, action: string, entity: string, entityId: string, details?: string) =>
    audit.push({ id: id('au'), at: iso(hoursAgo * H), actorId, action, entity, entityId, details });
  A(92 * 24, 'usr_admin', 'org.verified', 'organization', 'org_gau1', 'Verified Krishna Gau Seva Gaushala');
  A(91 * 24, 'usr_admin', 'access.approved', 'membership', 'usr_gau', 'Approved gaushala operator access');
  A(60 * 24, 'usr_admin', 'user.suspended', 'user', 'usr_blocked', 'Suspended after repeated false reports');
  for (const e of events) {
    const c = cases.find((x) => x.id === e.caseId)!;
    audit.push({
      id: id('au'),
      at: e.at,
      actorId: e.actorId,
      action: e.type === 'reported' ? 'case.created' : `case.${e.toStatus ?? e.type}`,
      entity: 'case',
      entityId: c.code,
      details: e.note,
    });
  }
  audit.sort((a, b) => b.at.localeCompare(a.at));

  return {
    version: DB_VERSION,
    profiles,
    organizations,
    memberships,
    animals,
    sightings,
    cases,
    events,
    medical,
    intakes,
    notifications,
    audit,
  };
}
