'use client';

import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { markAllNotificationsRead, markNotificationRead, useApp } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';

export default function Notifications() {
  const { db, user } = useApp();
  if (!user) return null;
  const list = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at));
  const unread = list.filter((n) => !n.read).length;
  return (
    <>
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up.'} actions={<Button variant="secondary" disabled={!unread} onClick={markAllNotificationsRead}><CheckCheck className="h-4 w-4" />Mark all read</Button>} />
      {list.length === 0 ? (
        <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications yet" body="You will be told when a team picks up or updates your report." />
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {list.map((n) => (
              <li key={n.id}>
                <Link href={n.href ?? '#'} onClick={() => markNotificationRead(n.id)} className={cn('flex gap-3 px-5 py-4 hover:bg-surface2/50', !n.read && 'bg-brand/5')}>
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-danger')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-sm text-muted">{n.body}</span>
                    <span className="mt-1 block text-xs text-muted/70">{timeAgo(n.at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
