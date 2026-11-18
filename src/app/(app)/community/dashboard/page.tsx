'use client';

import Link from 'next/link';
import { Bell, CheckCircle2, ClipboardList, Hourglass, Plus } from 'lucide-react';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, StatTile, StatusBadge } from '@/components/ui';
import { useApp } from '@/lib/store';
import { myReports, isOpen } from '@/lib/selectors';
import { timeAgo } from '@/lib/utils';
import { ROLE_HOME } from '@/lib/meta';

export default function CommunityDashboard() {
  const { db, user } = useApp();
  if (!user) return null;
  const mine = myReports(db, user);
  const open = mine.filter(isOpen);
  const resolved = mine.filter((c) => c.status === 'resolved' || c.status === 'closed');
  const notes = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const pendingReq = db.memberships.find((m) => m.userId === user.id && m.status === 'pending');

  return (
    <>
      <PageHeader eyebrow="Community" title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Thank you for looking out for animals in your area." actions={<LinkButton href="/community/report/new" size="lg"><Plus className="h-4 w-4" />Report a sighting</LinkButton>} />
      {user.role !== 'community' && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span>You have staff access — your working dashboard is separate.</span>
          <Link href={ROLE_HOME[user.role]} className="font-semibold text-brand hover:underline">Go to dashboard →</Link>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="My reports" value={mine.length} icon={<ClipboardList className="h-4 w-4" />} href="/community/reports" />
        <StatTile label="In progress" value={open.length} icon={<Hourglass className="h-4 w-4" />} tone="accent" hint="Being reviewed or handled" />
        <StatTile label="Resolved" value={resolved.length} icon={<CheckCircle2 className="h-4 w-4" />} tone="info" />
        <StatTile label="Unread updates" value={notes.filter((n) => !n.read).length} icon={<Bell className="h-4 w-4" />} tone="danger" href="/community/notifications" />
      </div>
      {user.role === 'community' && (
        <Card className="mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-display text-lg font-semibold">Work at a gaushala, clinic or municipal team?</div>
            <p className="text-sm text-muted">{pendingReq ? 'Your access request is waiting for an administrator.' : 'Request institutional access to unlock your team dashboard.'}</p>
          </div>
          <LinkButton href="/community/profile#access" variant="secondary">{pendingReq ? 'View request' : 'Request access'}</LinkButton>
        </Card>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent reports" action={<Link href="/community/reports" className="text-sm font-semibold text-brand">All</Link>} />
          {mine.length ? (
            <ul className="divide-y divide-line">
              {mine.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/community/reports/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface2/50">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{c.title}</span><span className="text-xs text-muted">{c.code} · {timeAgo(c.createdAt)}</span></span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState title="No reports yet" body="Your first sighting could save an animal." action={<LinkButton href="/community/report/new">Report a sighting</LinkButton>} /></div>
          )}
        </Card>
        <Card>
          <CardHeader title="Latest updates" action={<Link href="/community/notifications" className="text-sm font-semibold text-brand">All</Link>} />
          {notes.length ? (
            <ul className="divide-y divide-line">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? '/community/notifications'} className="block px-5 py-3 hover:bg-surface2/50">
                    <div className="flex items-center gap-2 text-sm font-medium">{!n.read && <span className="h-2 w-2 rounded-full bg-danger" aria-label="unread" />}{n.title}</div>
                    <div className="text-xs text-muted">{n.body}</div>
                    <div className="mt-0.5 text-xs text-muted/70">{timeAgo(n.at)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <div className="p-5 text-sm text-muted">Updates on your reports appear here.</div>}
        </Card>
      </div>
    </>
  );
}
