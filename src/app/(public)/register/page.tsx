'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Card, Field, Input, Notice } from '@/components/ui';
import { register } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.password !== f.confirm) return setError('Passwords do not match.');
    setBusy(true);
    const r = register({ name: f.name, email: f.email, phone: f.phone, password: f.password });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.replace('/community/dashboard');
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-muted">Everyone starts as a Community Reporter. Staff access (gaushala, vet, operations) can be requested from your profile after registering.</p>
      <Card className="mt-6 p-5">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Full name" htmlFor="name" required><Input id="name" autoComplete="name" value={f.name} onChange={set('name')} required /></Field>
          <Field label="Email" htmlFor="email" required><Input id="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label="Phone (optional)" htmlFor="phone" hint="Used only so responders can reach you about your report."><Input id="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" htmlFor="pw" required hint="At least 8 characters."><Input id="pw" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required /></Field>
            <Field label="Confirm password" htmlFor="pw2" required><Input id="pw2" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} required /></Field>
          </div>
          {error && <Notice tone="danger">{error}</Notice>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
      </Card>
      <p className="mt-4 text-xs text-muted">Demo build: your account and reports are stored only in this browser.</p>
    </div>
  );
}
