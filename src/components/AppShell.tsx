'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  History,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Moon,
  PawPrint,
  Plus,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Sun,
  Truck,
  User,
  Users,
  Warehouse,
  WifiOff,
  Wifi,
  X,
  RefreshCw,
} from 'lucide-react';
import { Logo } from './Logo';
import { Avatar, Button, PageSkeleton, setTheme, useIsDark } from './ui';
import { flushQueue, logout, pendingSyncCount, setSimulateOffline, useApp } from '@/lib/store';
import { NAV, ROLE_SECTION, SECTION_HOME, SECTION_LABEL, type NavIcon } from '@/lib/nav';
import { ROLE_HOME, ROLE_LABEL } from '@/lib/meta';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICONS: Record<NavIcon, ReactNode> = {
  home: <LayoutDashboard className="h-[18px] w-[18px]" />,
  plus: <Plus className="h-[18px] w-[18px]" />,
  list: <ListChecks className="h-[18px] w-[18px]" />,
  bell: <Bell className="h-[18px] w-[18px]" />,
  user: <User className="h-[18px] w-[18px]" />,
  inbox: <Inbox className="h-[18px] w-[18px]" />,
  map: <MapIcon className="h-[18px] w-[18px]" />,
  case: <ClipboardList className="h-[18px] w-[18px]" />,
  history: <History className="h-[18px] w-[18px]" />,
  scan: <ScanLine className="h-[18px] w-[18px]" />,
  stethoscope: <Stethoscope className="h-[18px] w-[18px]" />,
  file: <FileText className="h-[18px] w-[18px]" />,
  calendar: <CalendarClock className="h-[18px] w-[18px]" />,
  truck: <Truck className="h-[18px] w-[18px]" />,
  warehouse: <Warehouse className="h-[18px] w-[18px]" />,
  paw: <PawPrint className="h-[18px] w-[18px]" />,
  users: <Users className="h-[18px] w-[18px]" />,
  building: <Building2 className="h-[18px] w-[18px]" />,
  chart: <BarChart3 className="h-[18px] w-[18px]" />,
  scroll: <ScrollText className="h-[18px] w-[18px]" />,
  shield: <ShieldCheck className="h-[18px] w-[18px]" />,
};

/** Which roles may open a given path. Anything not listed needs only a signed-in, active account. */
function allowedRoles(path: string): Role[] | null {
  if (path.startsWith('/admin')) return ['admin'];
  if (path.startsWith('/veterinary')) return ['vet', 'admin'];
  if (path.startsWith('/gaushala')) return ['gaushala', 'admin'];
  if (path === '/operations/scan' || path.startsWith('/operations/cases/')) return ['operations', 'vet', 'gaushala', 'admin'];
  if (path.startsWith('/operations')) return ['operations', 'admin'];
  if (path.startsWith('/animal/')) return ['operations', 'vet', 'gaushala', 'admin'];
  return null;
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}
function useBrowserOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user, db, simulateOffline } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dark = useIsDark();
  const browserOnline = useBrowserOnline();
  const online = browserOnline && !simulateOffline;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const allowed = allowedRoles(pathname);
    if (allowed && !allowed.includes(user.role)) router.replace(ROLE_HOME[user.role]);
  }, [ready, user, pathname, router]);

  // Automatically sync queued records when connectivity returns.
  useEffect(() => {
    if (online && user && pendingSyncCount(db) > 0) {
      const t = setTimeout(() => flushQueue(), 1200);
      return () => clearTimeout(t);
    }
  }, [online, user, db]);

  const section = user ? ROLE_SECTION[user.role] : 'community';
  const nav = NAV[section];
  const unread = useMemo(() => (user ? db.notifications.filter((n) => n.userId === user.id && !n.read).length : 0), [db.notifications, user]);
  const pending = pendingSyncCount(db);

  const allowed = user ? allowedRoles(pathname) : null;
  const blocked = !ready || !user || (allowed !== null && !allowed.includes(user.role));

  const activeHref = useMemo(() => {
    let best: string | null = null;
    for (const item of nav) {
      const prefixes = [item.href, ...(item.match ?? [])];
      for (const p of prefixes) {
        if ((pathname === p || pathname.startsWith(p.endsWith('/') ? p : p + '/')) && (!best || p.length > best.length)) best = item.href;
      }
    }
    return best;
  }, [nav, pathname]);

  const sidebar = (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <Logo href={user ? SECTION_HOME[section] : '/'} />
      </div>
      {user && (
        <div className="mx-3 mb-3 rounded-xl bg-surface2 px-3 py-2.5 text-xs">
          <div className="font-semibold uppercase tracking-wider text-brand">{SECTION_LABEL[section]}</div>
          <div className="mt-0.5 truncate text-muted">
            {user.orgId ? db.organizations.find((o) => o.id === user.orgId)?.name : ROLE_LABEL[user.role]}
          </div>
        </div>
      )}
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {nav.map((item) => {
          const active = activeHref === item.href;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-brand text-brand-fg shadow-sm' : 'text-muted hover:bg-surface2 hover:text-ink',
                )}
              >
                {ICONS[item.icon]}
                <span className="truncate">{item.label}</span>
                {item.icon === 'bell' && unread > 0 && (
                  <span className={cn('ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/25' : 'bg-danger text-white')}>{unread}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {user && (
        <div className="border-t border-line p-3">
          <Link href="/community/profile" className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-surface2" aria-label="Open my profile">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-pop">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:bg-surface2" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted hover:bg-surface2 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo compact href={user ? SECTION_HOME[section] : '/'} />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={cn(
                'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:inline-flex',
                online ? 'border-line text-muted hover:text-ink' : 'border-accent/40 bg-accent/10 text-accent',
              )}
              title="Simulate the no-signal field condition: reports are queued locally and synchronised when you go back online"
              aria-pressed={simulateOffline}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? 'Online' : 'Offline mode'}
              {pending > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{pending}</span>}
            </button>
            <Link href="/community/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} className="rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {(!online || pending > 0) && user && (
          <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm sm:px-6', online ? 'border-info/25 bg-info/10' : 'border-accent/30 bg-accent/10')} role="status">
            {online ? <RefreshCw className="h-4 w-4 text-info" /> : <WifiOff className="h-4 w-4 text-accent" />}
            <span className="font-medium">
              {online ? `${pending} offline record${pending === 1 ? '' : 's'} waiting to sync` : `You are offline.${pending > 0 ? ` ${pending} offline record${pending === 1 ? '' : 's'} queued.` : ''}`}
            </span>
            <span className="text-muted">
              {online ? 'Synchronising automatically…' : 'New sightings are stored on this device and sent when the connection returns.'}
            </span>
            {online && pending > 0 && (
              <Button size="sm" variant="secondary" className="ml-auto" onClick={() => flushQueue()}>
                Sync now
              </Button>
            )}
            {!online && simulateOffline && (
              <Button size="sm" variant="secondary" className="ml-auto sm:hidden" onClick={() => setSimulateOffline(false)}>
                Go online
              </Button>
            )}
          </div>
        )}

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {blocked ? <PageSkeleton /> : children}
        </main>
      </div>
    </div>
  );
}
