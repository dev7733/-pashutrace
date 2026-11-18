import Link from 'next/link';
import { ArrowRight, Bluetooth, CloudUpload, MapPinned, ShieldCheck, Stethoscope, Truck, Users, Warehouse } from 'lucide-react';
import { buttonClass } from '@/lib/button-class';
import { AnimalBackdrop, AnimalPortrait, ART_BG, ART_LABEL, GlassTagArt, type ArtKind } from '@/components/AnimalArt';

const GALLERY: Array<{ k: ArtKind; tilt: string; note: string }> = [
  { k: 'cow', tilt: '-rotate-3', note: 'Stray, injured or in transit' },
  { k: 'dog', tilt: 'rotate-2', note: 'Street & community dogs' },
  { k: 'cat', tilt: 'rotate-3', note: 'Community cats' },
  { k: 'horse', tilt: '-rotate-2', note: 'Working horses & donkeys' },
  { k: 'goat', tilt: 'rotate-2', note: 'Goats' },
  { k: 'sheep', tilt: '-rotate-3', note: 'Sheep & flocks' },
];

const USES = [
  ['Cows, bulls & buffalo', 'Trace stray and abandoned cattle, flag suspicious transport and keep every gaushala intake on record.'],
  ['Street & community dogs', 'Log vaccination, sterilisation and treatment history so the next vet or volunteer sees the full picture.'],
  ['Community cats', 'Know which cats are fed, neutered and cared for — and by whom.'],
  ['Horses, donkeys & working animals', 'Link a working animal to its owner and spot neglect early.'],
  ['Goats, sheep & livestock', 'Follow animals through markets and movement, and catch illegal loads.'],
  ['Any animal in distress', 'Report anything — injured wildlife, abandoned pets, overloaded vehicles — and a team is assigned.'],
] as const;

const ROLES = [
  { icon: Users, title: 'Community reporters', body: 'Anyone can file a sighting with photo and location, then follow the case until it is resolved.', href: '/register' },
  { icon: ShieldCheck, title: 'Operations & authorities', body: 'Triage a live inbox, spot duplicates, map hotspots of suspected transport and assign the right team.', href: '/about' },
  { icon: Warehouse, title: 'Gaushalas & shelters', body: 'Accept rescue assignments, record intake by chip, manage pens and capacity.', href: '/about' },
  { icon: Stethoscope, title: 'Veterinarians', body: 'See assigned examinations, keep a medical history per animal and never miss a follow-up.', href: '/about' },
];

const SPECS: Array<[string, string]> = [
  ['Size', '23 mm long × Ø 3.85 mm'],
  ['Housing', 'Bioglass, IP68 (1 m for 24 h)'],
  ['Technology', 'RAIN UHF · EPC Class 1 Gen 2 · ISO 18000-6C'],
  ['Frequency', '865–868 MHz (EU) · 902–928 MHz (US)'],
  ['Chip · memory', 'M730 · 128-bit EPC · anti-collision'],
  ['Temperature', '−40 °C to +85 °C operating'],
  ['Read range', 'Depends on reader, environment and application'],
  ['Warranty', '2 years'],
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <AnimalBackdrop strong className="opacity-80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Smart animal identification & welfare network
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              We track animals. <span className="text-brand">Not only cows.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Cows, dogs, cats, horses, goats and every animal in between — one verified record each, shared by citizens, gaushalas, vets and enforcement teams. So a suspicious truck, a limping dog or an abandoned calf becomes a case someone acts on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClass('primary', 'lg')}>Create account <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/login" className={buttonClass('secondary', 'lg')}>Try the demo</Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[['Any species', 'Cows to cats'], ['23 mm', 'Injectable chip'], ['Offline', 'First by design']].map(([a, b]) => (
                <div key={b}><dt className="font-display text-xl font-semibold">{a}</dt><dd className="text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Animals tracked by PashuTrace">
            {GALLERY.map(({ k, tilt, note }, i) => (
              <li
                key={k}
                className={`animate-rise rounded-3xl border border-line bg-surface p-2.5 shadow-card transition duration-300 hover:rotate-0 hover:-translate-y-1 ${tilt}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="aspect-square overflow-hidden rounded-2xl" style={{ background: ART_BG[k] }}>
                  <AnimalPortrait kind={k} title={ART_LABEL[k]} />
                </div>
                <div className="px-1.5 pb-1 pt-2.5">
                  <div className="text-sm font-semibold">{ART_LABEL[k]}</div>
                  <div className="text-xs leading-snug text-muted">{note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO WE TRACK */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">One trail for every animal</h2>
          <p className="mt-3 text-muted">The same platform follows a calf through a gaushala, a street dog through its vaccinations and a horse back to its owner.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USES.map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GLASS MICROCHIP */}
      <section className="border-y border-line bg-surface/70">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">The identity</span>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">An injectable glass chip. That&apos;s the animal&apos;s ID.</h2>
            <p className="mt-4 text-muted">
              A tiny RAIN UHF glass tag — about the size of a grain of rice — is placed under the skin with a standard injector by a veterinarian. No battery, no collar to lose, and it works for the animal&apos;s whole life.
            </p>
            <ol className="mt-6 space-y-3 text-sm">
              {[
                ['Implant', 'A vet injects the chip and registers it to the animal.'],
                ['Read', 'A UHF reader picks up the chip’s unique ID from a distance — no contact needed.'],
                ['Open the record', 'PashuTrace matches the ID to the animal: owner, history, last sighting, open cases.'],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-fg">{i + 1}</span>
                  <span><b>{t}.</b> <span className="text-muted">{b}</span></span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-muted">Chips are implanted by a qualified veterinarian only. Specifications from the manufacturer&apos;s preliminary datasheet (HID Glass Tag UHF, 2025).</p>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl border border-line bg-bg p-5 shadow-card">
              <GlassTagArt />
            </div>
            <dl className="grid overflow-hidden rounded-2xl border border-line bg-surface text-sm sm:grid-cols-2">
              {SPECS.map(([k, v]) => (
                <div key={k} className="border-b border-line/70 px-4 py-2.5 sm:odd:border-r">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">One platform, four kinds of people</h2>
          <p className="mt-3 text-muted">Each role gets exactly the tools it needs — and nothing it should not see. Staff access is verified by an administrator.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link key={r.title} href={r.href} className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/12 text-brand"><r.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-xl font-semibold">{r.title}</h3>
              <p className="mt-1 text-muted">{r.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* FIELD */}
      <section className="border-t border-line bg-surface/70">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Built for the road, not the office</h2>
            <ul className="mt-6 space-y-5">
              {[
                [MapPinned, 'Live sighting map', 'Critical reports pulse on the map. Recurring hotspots are highlighted so patrols go where they matter.'],
                [Truck, 'Transport reports', 'Capture vehicle type, registration and direction for suspected illegal transport — large loads are flagged critical automatically.'],
                [Bluetooth, 'Scanner over Bluetooth', 'Pair the handheld reader straight from the browser. IDs arrive as JSON and match the animal database instantly.'],
                [CloudUpload, 'Works with no signal', 'Reports are stored on the device and synchronised in order when the connection returns.'],
              ].map(([Icon, t, b]) => {
                const I = Icon as typeof Truck;
                return (
                  <li key={t as string} className="flex gap-4">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent"><I className="h-4 w-4" /></span>
                    <div><div className="font-semibold">{t as string}</div><p className="text-sm text-muted">{b as string}</p></div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-bg p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">What the scanner sends</div>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-surface2 p-4 font-mono text-sm leading-relaxed"><code>{`{
  "device": "PASHUTRACE-01",
  "event": "TAG_SCANNED",
  "animal_id": "E280689400004002A1B2C3D4"
}`}</code></pre>
            <p className="mt-4 text-sm text-muted">The app looks up this ID, shows the animal&apos;s last known location and status, and attaches it to your report together with GPS and a photograph.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">See an animal in need? Make it a case.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Create a free account in under a minute, or sign in with a demo account to explore every dashboard.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonClass('primary', 'lg')}>Get started</Link>
          <Link href="/about" className={buttonClass('secondary', 'lg')}>How it works</Link>
        </div>
      </section>
    </>
  );
}
