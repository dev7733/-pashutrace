import Link from 'next/link';
import { buttonClass } from '@/lib/button-class';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <div className="font-display text-7xl font-semibold text-brand">404</div>
        <h1 className="mt-2 font-display text-2xl font-semibold">This trail goes cold</h1>
        <p className="mt-2 text-muted">The page you are looking for does not exist or has moved.</p>
        <Link href="/" className={buttonClass('primary', 'md', 'mt-6')}>Back to home</Link>
      </div>
    </div>
  );
}
