# PashuTrace — Smart Animal Identification & Welfare Network

**We track animals, not only cows.** Citizens, gaushalas, veterinarians and authorities working from **one shared record per animal** — cows, dogs, cats, horses, goats and more: chip or tag → handheld reader → phone → case system, with offline-first reporting.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Leaflet**. It runs **fully in the browser with seeded demo data** (stored in `localStorage`), so it deploys to Vercel with zero configuration and no environment variables.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. On vercel.com choose **Add New → Project**, import the repo. Framework is detected as **Next.js**; keep the defaults and press **Deploy**.
   (Or: `npm i -g vercel && vercel --prod` from this folder.)

## Demo accounts (password `demo1234`)
| Role | Email |
|---|---|
| Community reporter | aarav@demo.pashutrace.in |
| Operations officer | ops@demo.pashutrace.in |
| Veterinarian | vet@demo.pashutrace.in |
| Gaushala operator | gaushala@demo.pashutrace.in |
| Administrator | admin@demo.pashutrace.in |

The login page signs you in with one click. Admin → **Reset demo data** restores the sample set.

## What is implemented
- **Public:** home, how it works, sign in (password or simulated email link), register.
- **Community:** overview, new sighting (category, optional tag scan, GPS/map pin, photo, transport details), my reports, report progress tracker, notifications, profile, **request institutional access**.
- **Operations:** command overview, triage inbox, live sighting map with hotspots, assigned cases, case history, tag scanner, full case page (status workflow, assignment, priority, notes, duplicate warning).
- **Veterinary:** assigned examinations, medical records (add / search / CSV), follow-ups (overdue / today / week).
- **Gaushala:** shelter overview with capacity gauge, accept/decline rescues, intake (scan or register new animal), shelter records with release / transfer / deceased.
- **Admin:** system overview, access-request approval, user roles + suspension, organisation management + verification, animal database, all cases, analytics, audit logs, permission matrix.
- **Scanner:** manual / demo tags, **Web Bluetooth** pairing with the ESP32 handheld (Chrome/Edge over HTTPS), camera barcode/QR (BarcodeDetector).
- **Offline:** header toggle simulates no-signal; reports queue locally and auto-sync when back online.
- Case statuses: `new, under_review, assigned, accepted, in_progress, under_treatment, resolved, closed, rejected, duplicate`. Animal statuses: `unknown, community, owned, in_shelter, under_treatment, transferred, released, deceased`.
- Role permissions follow the permission matrix in your deck (`src/lib/permissions.ts`) and are enforced in every action (`src/lib/store.ts`).

## Hardware
Identifiers supported: **UHF chip EPC** (24/32 hex — the injectable HID Glass Tag UHF, 23 × 3.85 mm, EPC Gen2 / ISO 18000-6C), 15-digit **RFID** (134.2 kHz ISO 11784/85), 12-digit **Pashu Aadhaar**, and **QR/barcode** text.
- `firmware/pashutrace_scanner_uhf/` — ESP32 + UART UHF reader module → OLED + buzzer → BLE. Sends `{"device":"PASHUTRACE-01","event":"TAG_SCANNED","animal_id":"E280689400004002A1B2C3D4"}`.
- `firmware/pashutrace_scanner/` — same idea for a 134.2 kHz (LF) reader.

Notes on the glass tag datasheet: it is marked *preliminary*, is primarily positioned for **fish** tracing (it also lists *small pets* and industrial assets), and read range is *not specified* — it depends on reader, antenna and environment (and a UHF signal is attenuated by body tissue). Confirm with the manufacturer and a veterinarian that it is suitable and legal for each species you plan to implant, use a reader tuned to your country's UHF band (India: 865–867 MHz), and test real read distances before deployment. Dogs and cats are normally microchipped with 134.2 kHz ISO 11784/85 chips; the app supports both.

## Going to production (important)
The demo has **no server**: passwords are stored in plain text in the browser and anyone can edit their own `localStorage`. Before real use:
1. Create a Supabase project and run `supabase/schema.sql` (tables + row-level-security policies for every role).
2. Replace `src/lib/store.ts` with Supabase queries (the function names — `createReport`, `changeStatus`, `assignCase`, … — are the seam). Use Supabase Auth (email/password + magic link); never store passwords yourself.
3. Upload photos to a private Storage bucket instead of embedding them.
4. Send the offline queue with the `client_id` idempotency key already present in the schema.
5. Sample places/phone numbers are fictional (Rohtak, Haryana). Replace with real data.

## Project layout
```
src/app/(public)   home, about, login, register
src/app/(app)      community · operations · veterinary · gaushala · admin · animal/[id]
src/components     UI kit, map, scanner, case list/detail, app shell
src/lib            types, permissions, workflow, store (data layer), seed, selectors
firmware/          ESP32 scanner sketch
supabase/          production schema + RLS
```

## Map tiles
The map uses the standard OpenStreetMap tile server (no key needed, fine for demos and light use). For heavier traffic, use a provider with a free key (MapTiler, Stadia, Thunderforest…) by setting in Vercel → Settings → Environment Variables (or a local `.env.local`):
```
NEXT_PUBLIC_MAP_TILE_URL=https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=YOUR_KEY
NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; MapTiler &copy; OpenStreetMap contributors
```
