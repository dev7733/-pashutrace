import type { Species } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Original, hand-drawn SVG animal portraits (no external images, no licences, no network).
 * To use real photographs instead, drop files into /public/animals and swap <AnimalPortrait/> for <img/>.
 */
export type ArtKind = 'cow' | 'dog' | 'cat' | 'horse' | 'goat' | 'sheep';

export const ART_LABEL: Record<ArtKind, string> = {
  cow: 'Cows & buffalo',
  dog: 'Dogs',
  cat: 'Cats',
  horse: 'Horses & donkeys',
  goat: 'Goats',
  sheep: 'Sheep',
};

export function artForSpecies(s?: Species): ArtKind | null {
  switch (s) {
    case 'cow':
    case 'bull':
    case 'calf':
    case 'buffalo':
      return 'cow';
    case 'dog':
      return 'dog';
    case 'cat':
      return 'cat';
    case 'horse':
    case 'donkey':
      return 'horse';
    case 'goat':
      return 'goat';
    case 'sheep':
      return 'sheep';
    default:
      return null;
  }
}

const EYE = '#2b2118';

function Eyes({ y = 58, dx = 14, r = 4 }: { y?: number; dx?: number; r?: number }) {
  return (
    <>
      <circle cx={60 - dx} cy={y} r={r} fill={EYE} />
      <circle cx={60 + dx} cy={y} r={r} fill={EYE} />
      <circle cx={60 - dx + 1.2} cy={y - 1.3} r={r * 0.32} fill="#fff" />
      <circle cx={60 + dx + 1.2} cy={y - 1.3} r={r * 0.32} fill="#fff" />
    </>
  );
}

function Cow() {
  return (
    <g>
      <ellipse cx="20" cy="48" rx="14" ry="7" transform="rotate(-20 20 48)" fill="#e6d2bb" />
      <ellipse cx="100" cy="48" rx="14" ry="7" transform="rotate(20 100 48)" fill="#e6d2bb" />
      <path d="M40 32 Q32 12 20 16 Q31 22 36 38Z" fill="#f3ead2" />
      <path d="M80 32 Q88 12 100 16 Q89 22 84 38Z" fill="#f3ead2" />
      <path d="M36 32 Q60 22 84 32 Q92 60 80 86 Q70 106 60 106 Q50 106 40 86 Q28 60 36 32Z" fill="#fbf7ef" />
      <path d="M50 27 Q72 22 78 38 Q70 52 58 46 Q46 40 50 27Z" fill="#7a4a2b" />
      <ellipse cx="60" cy="90" rx="20" ry="14" fill="#f3b9b0" />
      <ellipse cx="52" cy="91" rx="3" ry="4.6" fill="#b9706a" />
      <ellipse cx="68" cy="91" rx="3" ry="4.6" fill="#b9706a" />
      <Eyes y={60} dx={15} />
    </g>
  );
}

function Dog() {
  return (
    <g>
      <path d="M32 26 Q10 34 12 72 Q14 88 30 78 Q36 54 42 34Z" fill="#6b4226" />
      <path d="M88 26 Q110 34 108 72 Q106 88 90 78 Q84 54 78 34Z" fill="#6b4226" />
      <ellipse cx="60" cy="58" rx="30" ry="35" fill="#d9a066" />
      <path d="M60 24 Q70 40 67 58 Q60 64 53 58 Q50 40 60 24Z" fill="#f6e6cc" />
      <ellipse cx="60" cy="80" rx="18" ry="14" fill="#f6e6cc" />
      <ellipse cx="60" cy="70" rx="7.5" ry="5.2" fill={EYE} />
      <path d="M60 75 V83 M51 85 Q60 91 69 85" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M55 87 Q60 102 65 87Z" fill="#e8737f" />
      <Eyes y={52} dx={14} />
    </g>
  );
}

function Cat() {
  return (
    <g>
      <path d="M22 58 L27 12 L55 33Z" fill="#e8913a" />
      <path d="M30 47 L31 24 L46 35Z" fill="#f4b6b0" />
      <path d="M98 58 L93 12 L65 33Z" fill="#e8913a" />
      <path d="M90 47 L89 24 L74 35Z" fill="#f4b6b0" />
      <ellipse cx="60" cy="66" rx="39" ry="34" fill="#f2a24c" />
      <path d="M60 33 V46 M50 35 L52 47 M70 35 L68 47" stroke="#c46f1c" strokeWidth="3.6" strokeLinecap="round" />
      <ellipse cx="60" cy="81" rx="15" ry="10" fill="#fbe3c4" />
      <ellipse cx="45" cy="64" rx="6.5" ry="7.5" fill="#8fd16a" />
      <ellipse cx="75" cy="64" rx="6.5" ry="7.5" fill="#8fd16a" />
      <ellipse cx="45" cy="64" rx="2" ry="6.4" fill="#1f1a14" />
      <ellipse cx="75" cy="64" rx="2" ry="6.4" fill="#1f1a14" />
      <path d="M55 74 H65 L60 80Z" fill="#e57f8c" />
      <path d="M60 80 Q56 88 50 86 M60 80 Q64 88 70 86" stroke="#7a4a2b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 79 H16 M40 84 L19 92 M80 79 H104 M80 84 L101 92" stroke="#fff" strokeOpacity=".85" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function Horse() {
  return (
    <g>
      <path d="M42 26 L39 3 L57 20Z" fill="#8a5a36" />
      <path d="M78 26 L81 3 L63 20Z" fill="#8a5a36" />
      <path d="M42 22 Q60 14 78 22 Q85 56 77 84 Q72 108 60 108 Q48 108 43 84 Q35 56 42 22Z" fill="#a8693a" />
      <path d="M40 20 Q60 6 80 20 Q70 34 62 46 Q55 30 40 20Z" fill="#2f211b" />
      <path d="M42 22 Q24 42 29 80 Q37 64 45 44Z" fill="#2f211b" />
      <path d="M78 22 Q96 42 91 80 Q83 64 75 44Z" fill="#2f211b" />
      <path d="M57 44 Q61 42 63 50 L62 86 H58Z" fill="#fbf1e0" />
      <ellipse cx="60" cy="97" rx="15" ry="11" fill="#7d4c28" />
      <ellipse cx="54" cy="97" rx="2.6" ry="3.8" fill="#2b1a10" />
      <ellipse cx="66" cy="97" rx="2.6" ry="3.8" fill="#2b1a10" />
      <ellipse cx="46" cy="62" rx="4.4" ry="3.8" fill="#1d140e" />
      <ellipse cx="74" cy="62" rx="4.4" ry="3.8" fill="#1d140e" />
      <circle cx="47.2" cy="60.8" r="1.3" fill="#fff" />
      <circle cx="75.2" cy="60.8" r="1.3" fill="#fff" />
    </g>
  );
}

function Goat() {
  return (
    <g>
      <path d="M47 28 Q40 4 22 6 Q35 12 41 36Z" fill="#cfc4a8" />
      <path d="M73 28 Q80 4 98 6 Q85 12 79 36Z" fill="#cfc4a8" />
      <ellipse cx="22" cy="58" rx="15" ry="6.5" transform="rotate(22 22 58)" fill="#e7dcc8" />
      <ellipse cx="98" cy="58" rx="15" ry="6.5" transform="rotate(-22 98 58)" fill="#e7dcc8" />
      <path d="M38 32 Q60 22 82 32 Q91 60 76 88 Q60 100 44 88 Q29 60 38 32Z" fill="#f4eee0" />
      <path d="M38 34 Q50 27 55 40 Q47 54 40 49Z" fill="#9b7653" />
      <ellipse cx="60" cy="86" rx="15" ry="9.5" fill="#e9c7b8" />
      <circle cx="54.5" cy="85" r="2.1" fill="#7b4a40" />
      <circle cx="65.5" cy="85" r="2.1" fill="#7b4a40" />
      <path d="M51 96 Q60 120 69 96Z" fill="#e7dcc8" />
      <ellipse cx="46" cy="59" rx="5.4" ry="4.4" fill="#e0b03a" />
      <ellipse cx="74" cy="59" rx="5.4" ry="4.4" fill="#e0b03a" />
      <rect x="43.2" y="57.6" width="5.6" height="2.8" rx="1.2" fill="#1d140e" />
      <rect x="71.2" y="57.6" width="5.6" height="2.8" rx="1.2" fill="#1d140e" />
    </g>
  );
}

function Sheep() {
  const wool = '#f7f3ea';
  const edge = '#e3dac5';
  return (
    <g>
      {[[30, 44, 17], [48, 27, 17], [72, 27, 17], [90, 44, 17], [24, 68, 15], [96, 68, 15], [60, 36, 19]].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={wool} stroke={edge} strokeWidth="1.4" />
      ))}
      <ellipse cx="25" cy="72" rx="12" ry="6" transform="rotate(25 25 72)" fill="#4a3b36" />
      <ellipse cx="95" cy="72" rx="12" ry="6" transform="rotate(-25 95 72)" fill="#4a3b36" />
      <path d="M40 42 Q60 34 80 42 Q88 72 74 98 Q60 108 46 98 Q32 72 40 42Z" fill="#4a3b36" />
      <circle cx="60" cy="40" r="15" fill={wool} stroke={edge} strokeWidth="1.2" />
      <ellipse cx="60" cy="90" rx="11" ry="7.5" fill="#6a5750" />
      <ellipse cx="60" cy="86" rx="4.2" ry="2.6" fill="#d89a95" />
      <circle cx="49" cy="64" r="4.2" fill="#f4e7c8" />
      <circle cx="71" cy="64" r="4.2" fill="#f4e7c8" />
      <circle cx="49" cy="64" r="2" fill="#111" />
      <circle cx="71" cy="64" r="2" fill="#111" />
    </g>
  );
}

const ART: Record<ArtKind, () => React.ReactElement> = { cow: Cow, dog: Dog, cat: Cat, horse: Horse, goat: Goat, sheep: Sheep };

export const ART_BG: Record<ArtKind, string> = {
  cow: '#dfe8d2',
  dog: '#f0dcc0',
  cat: '#f3d9c4',
  horse: '#e3dccb',
  goat: '#d9e4e0',
  sheep: '#e6e2ef',
};

/** The animal head on its own, transparent background. */
export function AnimalPortrait({ kind, className, title }: { kind: ArtKind; className?: string; title?: string }) {
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 120 120" className={cn('h-full w-full', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Art />
    </svg>
  );
}

/** Round badge version used in pickers and lists. */
export function AnimalBadge({ kind, size = 44, className }: { kind: ArtKind; size?: number; className?: string }) {
  return (
    <span className={cn('inline-grid shrink-0 place-items-center overflow-hidden rounded-full', className)} style={{ width: size, height: size, background: ART_BG[kind] }}>
      <AnimalPortrait kind={kind} className="h-[92%] w-[92%]" />
    </span>
  );
}

/** Large, very faint animals scattered behind page content. Purely decorative. */
export function AnimalBackdrop({ strong = false, className }: { strong?: boolean; className?: string }) {
  const items: Array<{ k: ArtKind; style: React.CSSProperties; rot: number }> = [
    { k: 'cow', style: { left: '-4%', top: '6%', width: 260 }, rot: -12 },
    { k: 'dog', style: { right: '-3%', top: '2%', width: 230 }, rot: 10 },
    { k: 'horse', style: { left: '8%', bottom: '-6%', width: 240 }, rot: 8 },
    { k: 'cat', style: { right: '10%', bottom: '4%', width: 200 }, rot: -9 },
    { k: 'goat', style: { left: '44%', top: '-6%', width: 170 }, rot: 6 },
    { k: 'sheep', style: { left: '52%', bottom: '-8%', width: 190 }, rot: -6 },
  ];
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {items.map((it) => (
        <div key={it.k} className="absolute" style={{ ...it.style, opacity: strong ? 0.13 : 0.08, transform: `rotate(${it.rot}deg)` }}>
          <AnimalPortrait kind={it.k} />
        </div>
      ))}
    </div>
  );
}

/** Injectable glass microchip and applicator, drawn to the datasheet proportions (23 mm × Ø3.85 mm). */
export function GlassTagArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 612 250" className={cn('w-full', className)} role="img" aria-label="Injectable glass RFID microchip, 23 millimetres long, inside an applicator syringe">
      <defs>
        <linearGradient id="gt-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".45" stopColor="#bfe6e0" stopOpacity=".75" />
          <stop offset="1" stopColor="#7cc4bb" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id="gt-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f2ee" />
          <stop offset="1" stopColor="#a9aca6" />
        </linearGradient>
      </defs>

      {/* applicator */}
      <g transform="translate(0 10)">
        <path d="M18 60 L118 55 L118 65Z" fill="url(#gt-metal)" stroke="#8d908a" strokeWidth="1" />
        <rect x="118" y="44" width="30" height="32" rx="4" fill="#d9ddd6" stroke="#8d908a" />
        <rect x="148" y="38" width="250" height="44" rx="8" fill="#eef6f4" stroke="#8d908a" strokeWidth="1.4" />
        <rect x="396" y="53" width="96" height="14" rx="3" fill="url(#gt-metal)" stroke="#8d908a" />
        <rect x="492" y="36" width="12" height="48" rx="5" fill="#2f6b4f" />
        <rect x="140" y="30" width="10" height="60" rx="3" fill="#2f6b4f" />
        <rect x="396" y="30" width="10" height="60" rx="3" fill="#2f6b4f" />
        {[170, 200, 230, 260, 290, 320, 350].map((x) => (
          <line key={x} x1={x} x2={x} y1="44" y2="50" stroke="#9aa59f" strokeWidth="1" />
        ))}
        {/* chip loaded in the barrel */}
        <rect x="156" y="52" width="74" height="16" rx="8" fill="url(#gt-glass)" stroke="#4f9f95" strokeWidth="1" />
        <text x="270" y="108" fontSize="12" fill="#5d6a63" fontFamily="ui-sans-serif, system-ui">Loaded in a standard injector</text>
      </g>

      {/* enlarged chip */}
      <g transform="translate(0 20)">
        <rect x="40" y="140" width="480" height="46" rx="23" fill="url(#gt-glass)" stroke="#4f9f95" strokeWidth="1.6" />
        <rect x="52" y="146" width="456" height="8" rx="4" fill="#fff" opacity=".55" />
        {/* antenna coil */}
        {Array.from({ length: 22 }).map((_, i) => (
          <rect key={i} x={74 + i * 9.4} y="152" width="3.4" height="28" rx="1.2" fill="#c9792f" />
        ))}
        <rect x="290" y="155" width="52" height="22" rx="3" fill="#2b3a35" />
        <rect x="296" y="160" width="40" height="12" rx="2" fill="#4c635b" />
        <text x="316" y="171" fontSize="8" textAnchor="middle" fill="#bde0d6" fontFamily="ui-monospace, monospace">M730</text>
        {/* dimension lines */}
        <g stroke="#2f6b4f" strokeWidth="1.4" fill="none">
          <path d="M40 204 H520 M40 198 V210 M520 198 V210" />
          <path d="M532 140 V186 M526 140 H538 M526 186 H538" />
        </g>
        <text x="280" y="224" fontSize="14" textAnchor="middle" fill="#2f6b4f" fontWeight="600" fontFamily="ui-sans-serif, system-ui">23 mm</text>
        <text x="546" y="167" fontSize="13" fill="#2f6b4f" fontWeight="600" fontFamily="ui-sans-serif, system-ui">Ø 3.85 mm</text>
      </g>
    </svg>
  );
}
