-- PashuTrace — production database schema for Supabase (PostgreSQL)
-- Mirrors the data model used by the demo app (src/lib/types.ts).
-- Run in the Supabase SQL editor, then enable Auth (email + magic link).

create extension if not exists "pgcrypto";

create type user_role      as enum ('community','vet','gaushala','operations','admin');
create type org_type       as enum ('gaushala','clinic','municipal');
create type case_status    as enum ('new','under_review','assigned','accepted','in_progress','under_treatment','resolved','closed','rejected','duplicate');
create type animal_status  as enum ('unknown','community','owned','in_shelter','under_treatment','transferred','released','deceased');
create type case_category  as enum ('stray','injured','suspected_transport','abandoned','other');
create type priority_level as enum ('low','medium','high','critical');
create type identifier_type as enum ('RFID','QR','PASHU_AADHAAR');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null, phone text,
  role user_role not null default 'community',
  org_id uuid, status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null, type org_type not null, district text, address text, phone text,
  lat double precision, lng double precision, capacity int, verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table profiles add constraint profiles_org_fk foreign key (org_id) references organisations(id);
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id), org_id uuid not null references organisations(id),
  requested_role user_role not null check (requested_role in ('vet','gaushala','operations')),
  message text, status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references profiles(id)
);
create table animals (
  id uuid primary key default gen_random_uuid(),
  label text not null, species text not null, sex text not null default 'unknown', color text,
  status animal_status not null default 'unknown', org_id uuid references organisations(id), notes text,
  created_at timestamptz not null default now()
);
create table identifiers (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  type identifier_type not null, value text not null unique
);
create sequence if not exists case_seq start 101;
create table welfare_cases (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('PT-' || to_char(now(),'YYYY') || '-' || lpad(nextval('case_seq')::text,4,'0')),
  title text not null, category case_category not null, priority priority_level not null default 'medium',
  status case_status not null default 'new', animal_id uuid references animals(id),
  reporter_id uuid not null references profiles(id), assigned_org_id uuid references organisations(id),
  assigned_user_id uuid references profiles(id), transport jsonb, possible_duplicate_of uuid references welfare_cases(id),
  lat double precision not null, lng double precision not null, landmark text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table sightings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references welfare_cases(id) on delete cascade, animal_id uuid references animals(id),
  unknown_identifier text, reporter_id uuid not null references profiles(id),
  lat double precision not null, lng double precision not null, accuracy real, landmark text,
  observed_at timestamptz not null default now(), condition text, count int not null default 1,
  notes text, photo_path text, source text not null default 'manual',
  client_id uuid unique  -- idempotency key for offline sync
);
create table case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references welfare_cases(id) on delete cascade, at timestamptz not null default now(),
  actor_id uuid not null references profiles(id), type text not null,
  from_status case_status, to_status case_status, note text,
  visibility text not null default 'public' check (visibility in ('public','internal'))
);
create table medical_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id), case_id uuid references welfare_cases(id),
  vet_id uuid not null references profiles(id), at timestamptz not null default now(),
  type text not null, diagnosis text not null, treatment text, medication text,
  follow_up_date date, follow_up_done boolean
);
create table shelter_intakes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id), animal_id uuid not null references animals(id),
  case_id uuid references welfare_cases(id), at timestamptz not null default now(), condition text, pen text, notes text,
  exited_at timestamptz, exit_reason text, exit_note text, recorded_by uuid references profiles(id)
);
create table notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),
  at timestamptz not null default now(), title text not null, body text, href text, read boolean not null default false
);
create table audit_log (
  id uuid primary key default gen_random_uuid(), at timestamptz not null default now(),
  actor_id uuid references profiles(id), action text not null, entity text, entity_id text, details text
);

-- Row-level security -------------------------------------------------------
create or replace function current_role_() returns user_role language sql stable security definer as
  $$ select role from profiles where id = auth.uid() and status = 'active' $$;
create or replace function current_org_() returns uuid language sql stable security definer as
  $$ select org_id from profiles where id = auth.uid() $$;

alter table profiles enable row level security;
alter table organisations enable row level security;
alter table memberships enable row level security;
alter table animals enable row level security;
alter table identifiers enable row level security;
alter table welfare_cases enable row level security;
alter table sightings enable row level security;
alter table case_events enable row level security;
alter table medical_records enable row level security;
alter table shelter_intakes enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid() or current_role_() in ('operations','admin'));
create policy "admin manages profiles" on profiles for all using (current_role_() = 'admin');
create policy "orgs readable" on organisations for select using (auth.uid() is not null);
create policy "admin manages orgs" on organisations for all using (current_role_() = 'admin');
create policy "own memberships" on memberships for select using (user_id = auth.uid() or current_role_() = 'admin');
create policy "request access" on memberships for insert with check (user_id = auth.uid());
create policy "admin decides" on memberships for update using (current_role_() = 'admin');

create policy "staff read animals" on animals for select using (current_role_() <> 'community');
create policy "ops write animals" on animals for all using (current_role_() in ('operations','admin'));
create policy "staff read identifiers" on identifiers for select using (current_role_() <> 'community');
create policy "ops write identifiers" on identifiers for all using (current_role_() in ('operations','admin'));

create policy "read cases" on welfare_cases for select using (
  reporter_id = auth.uid() or current_role_() in ('operations','admin')
  or (current_role_() in ('vet','gaushala') and (assigned_user_id = auth.uid() or assigned_org_id = current_org_())));
create policy "report" on welfare_cases for insert with check (reporter_id = auth.uid());
create policy "ops update cases" on welfare_cases for update using (
  current_role_() in ('operations','admin') or (current_role_() in ('vet','gaushala') and assigned_org_id = current_org_()));

create policy "read sightings" on sightings for select using (exists (select 1 from welfare_cases c where c.id = case_id));
create policy "add sightings" on sightings for insert with check (reporter_id = auth.uid());
create policy "read events" on case_events for select using (
  exists (select 1 from welfare_cases c where c.id = case_id) and (visibility = 'public' or current_role_() <> 'community'));
create policy "add events" on case_events for insert with check (actor_id = auth.uid());

create policy "vets read medical" on medical_records for select using (current_role_() in ('vet','gaushala','operations','admin'));
create policy "vets write medical" on medical_records for insert with check (vet_id = auth.uid() and current_role_() in ('vet','gaushala','admin'));
create policy "shelter intakes" on shelter_intakes for all using (current_role_() = 'admin' or org_id = current_org_());
create policy "own notifications" on notifications for all using (user_id = auth.uid());
create policy "admin reads audit" on audit_log for select using (current_role_() = 'admin');
create policy "write audit" on audit_log for insert with check (actor_id = auth.uid());

-- Storage: create a private bucket "sighting-photos" and allow authenticated uploads under <user-id>/*.
