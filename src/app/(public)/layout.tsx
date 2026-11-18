'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AnimalBackdrop } from '@/components/AnimalArt';
import { buttonClass, setTheme, useIsDark } from '@/components/ui';
import { logout, useApp } from '@/lib/store';
import { ROLE_HOME } from '@/lib/meta';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const dark = useIsDark();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'How it works' },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface2 hover:text-ink">{l.label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} className="rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <>
                  <Link href={ROLE_HOME[user.role]} className={buttonClass('primary', 'sm')}>Open dashboard</Link>
                  <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => { logout(); router.push('/'); }}>Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className={buttonClass('ghost', 'sm')}>Sign in</Link>
                  <Link href="/register" className={buttonClass('primary', 'sm')}>Register</Link>
                </>
              )}
            </div>
            <button type="button" className="rounded-lg p-2 text-muted hover:bg-surface2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface2">{l.label}</Link>)}
              {user ? (
                <Link href={ROLE_HOME[user.role]} onClick={() => setOpen(false)} className={buttonClass('primary', 'md', 'mt-2')}>Open dashboard</Link>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setOpen(false)} className={buttonClass('secondary')}>Sign in</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className={buttonClass('primary')}>Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <main id="main" className="relative flex-1 overflow-hidden"><AnimalBackdrop /><div className="relative">{children}</div></main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">A shared record for every animal — so citizens, gaushalas, vets and authorities act on the same facts.</p>
          </div>
          <div className="text-sm">
            <div className="mb-2 font-semibold">Platform</div>
            <ul className="space-y-1.5 text-muted">
              <li><Link href="/about" className="hover:text-ink">How it works</Link></li>
              <li><Link href="/register" className="hover:text-ink">Create an account</Link></li>
              <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
            </ul>
          </div>
          <div className="text-sm text-muted">
            <div className="mb-2 font-semibold text-ink">Demo build</div>
            Data on this site is sample data stored in your browser only. Nothing you enter is sent to a server. Report real emergencies to local authorities and the nearest veterinary hospital.
          </div>
        </div>
      </footer>
    </div>
  );
}
