'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { Button, Card, Field, Input, Notice, Segmented } from '@/components/ui';
import { login, magicLink, useApp } from '@/lib/store';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/seed';
import { ROLE_HOME } from '@/lib/meta';
import type { Role } from '@/lib/types';

function safeNext(next: string | null, role: Role): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') && !next.startsWith('/register')) return next;
  return ROLE_HOME[role];
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready } = useApp();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = (role: Role) => router.replace(safeNext(params.get('next'), role));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = mode === 'password' ? login(email, password) : magicLink(email);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (mode === 'magic') setSent(true);
    finish(r.data.role);
  };

  const demo = (em: string) => {
    setError(null);
    const r = login(em, DEMO_PASSWORD);
    if (!r.ok) return setError(r.error);
    finish(r.data.role);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Welcome back</h1>
        <p className="mt-2 text-muted">Sign in to report sightings, follow cases or run your institutional dashboard.</p>
        <Card className="mt-6 p-5">
          <Segmented value={mode} onChange={(v) => { setMode(v); setError(null); setSent(false); }} label="Sign-in method" options={[{ value: 'password', label: <span className="inline-flex items-center gap-1.5"><KeyRound className="h-4 w-4" />Password</span> }, { value: 'magic', label: <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />Email link</span> }]} />
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            {mode === 'password' && (
              <Field label="Password" htmlFor="password" required>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
            )}
            {mode === 'magic' && <p className="text-xs text-muted">Demo: the email link is simulated — you will be signed in immediately. In production, Supabase Auth emails a one-time link.</p>}
            {error && <Notice tone="danger">{error}</Notice>}
            {sent && <Notice tone="ok">Link accepted. Signing you in…</Notice>}
            <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!ready}>Sign in</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted">New here? <Link href="/register" className="font-semibold text-brand hover:underline">Create an account</Link></p>
        </Card>
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold">Explore with a demo account</h2>
        <p className="mt-1 text-sm text-muted">One click signs you in as that role. Password for all: <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">{DEMO_PASSWORD}</code></p>
        <ul className="mt-4 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button type="button" disabled={!ready} onClick={() => demo(a.email)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition hover:border-brand hover:shadow-card disabled:opacity-50">
                <span><span className="block font-medium">{a.name}</span><span className="block text-xs text-muted">{a.email}</span></span>
                <span className="rounded-full bg-brand/12 px-2.5 py-1 text-xs font-medium text-brand">{a.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
