import Link from 'next/link';
import { buttonClass } from '@/lib/button-class';
import { PERMISSIONS, PERMISSION_KEYS, PERMISSION_LABELS } from '@/lib/permissions';
import { ANIMAL_STATUS_LABEL, CASE_STATUS_LABEL, ROLE_LABEL } from '@/lib/meta';
import type { Role } from '@/lib/types';

export const metadata = { title: 'How it works' };

const ROLES: Role[] = ['community', 'vet', 'gaushala', 'operations', 'admin'];
const STEPS = [
  ['Report', 'Anyone signs up and files a sighting of any animal with photo, GPS and — if a chip or tag was scanned — the animal ID.'],
  ['Review', 'The operations team checks it, merges duplicates, sets priority and assigns the right organisation.'],
  ['Rescue & treatment', 'Gaushalas accept rescues and record intake. Vets add medical records and schedule follow-ups.'],
  ['Resolve & audit', 'The case is resolved, verified and closed. Every change is written to an audit log.'],
];

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">How PashuTrace works</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">From a tag on an animal&apos;s ear to a closed case in a shared database — in four steps.</p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map(([t, b], i) => (
          <li key={t} className="rounded-2xl border border-line border-l-4 border-l-accent bg-surface p-5 shadow-card">
            <div className="text-xs font-bold uppercase tracking-widest text-accent">Step {i + 1}</div>
            <h2 className="mt-1 font-display text-xl font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted">{b}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">The hardware</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['A. Animal', 'An injectable RAIN UHF glass microchip (23 × 3.85 mm) or a passive RFID ear tag. Unique ID, no battery, no GPS.'],
            ['B. Handheld scanner', 'RFID reader module + antenna + ESP32 + OLED + buzzer. Reads the chip or tag and sends the ID over Bluetooth Low Energy — no internet needed. Read range depends on the reader and chip.'],
            ['C. Phone app', 'Adds GPS, photograph and incident information, stores everything locally and syncs to the central database when connectivity returns.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Firmware for the scanner is included in the project under <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">firmware/</code>.</p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Who can do what</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Feature</th>
                {ROLES.map((r) => <th key={r} className="px-4 py-3 text-center">{ROLE_LABEL[r].split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_KEYS.map((k) => (
                <tr key={k} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2.5">{PERMISSION_LABELS[k]}</td>
                  {ROLES.map((r) => {
                    const v = PERMISSIONS[k][r];
                    return (
                      <td key={r} className={`px-4 py-2.5 text-center ${v === 'yes' ? 'font-medium text-ok' : v === 'limited' ? 'text-accent' : 'text-muted'}`}>
                        {v === 'yes' ? 'Yes' : v === 'limited' ? 'Limited' : 'No'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Becoming staff</h2>
        <ol className="mt-4 space-y-2 text-sm">
          {['Register with email and password (everyone starts as a Community Reporter).', 'Request institutional access: choose your organisation and a staff role.', 'An administrator verifies the institution and authorises your membership.', 'Your institutional dashboard unlocks.'].map((t, i) => (
            <li key={t} className="flex gap-3 rounded-xl border border-line bg-surface p-3.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-fg">{i + 1}</span>{t}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-display text-lg font-semibold">Case status</h3>
          <p className="mt-2 text-sm text-muted">{Object.values(CASE_STATUS_LABEL).join(' · ')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-display text-lg font-semibold">Animal status</h3>
          <p className="mt-2 text-sm text-muted">{Object.values(ANIMAL_STATUS_LABEL).join(' · ')}</p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/register" className={buttonClass('primary', 'lg')}>Create an account</Link>
        <Link href="/login" className={buttonClass('secondary', 'lg')}>Try the demo</Link>
      </div>
    </div>
  );
}
