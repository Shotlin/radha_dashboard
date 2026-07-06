'use client';
/**
 * Login page — redesigned split-screen layout.
 * Left panel: brand identity (desktop only, 45%).
 * Right panel: form area (full width on mobile).
 *
 * In DEMO_MODE: shows demo credential cards. One click fills + submits.
 * In production: standard RHF+Zod form → /api/auth/login → httpOnly cookie.
 */
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ShieldCheck, BarChart3, ClipboardList, Package } from 'lucide-react';

import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schema';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Read demo mode from public env (safe — no secrets) ── */
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/* ── Demo accounts to show ── */
const DEMO_ACCOUNTS = [
  {
    email: 'admin@radha.demo',
    password: 'demo1234',
    role: 'Admin',
    color: 'bg-[color:rgb(234_88_12_/_0.08)] border-[color:rgb(234_88_12_/_0.25)] text-[var(--accent-deep)]',
    description: 'Full access + admin console',
  },
  {
    email: 'owner@radha.demo',
    password: 'demo1234',
    role: 'Owner',
    color: 'bg-[color:rgb(15_118_110_/_0.08)] border-[color:rgb(15_118_110_/_0.25)] text-[var(--teal)]',
    description: 'All screens + analytics',
  },
  {
    email: 'manager@radha.demo',
    password: 'demo1234',
    role: 'Manager',
    color: 'bg-[color:rgb(109_91_208_/_0.08)] border-[color:rgb(109_91_208_/_0.25)] text-[#6D5BD0]',
    description: 'Ops: expiry, tasks, GRN',
  },
  {
    email: 'staff@radha.demo',
    password: 'demo1234',
    role: 'Staff',
    color: 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.25)] text-[var(--success)]',
    description: 'Tasks + expiry entry',
  },
  {
    email: 'auditor@radha.demo',
    password: 'demo1234',
    role: 'Auditor',
    color: 'bg-[color:rgb(180_83_9_/_0.08)] border-[color:rgb(180_83_9_/_0.25)] text-[var(--warn)]',
    description: 'EAN audit + reports',
  },
];

/** Brand panel feature pill */
function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
      bg-white/10 border border-white/15 text-white text-[12px] font-medium">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(err.message ?? 'Login failed. Please try again.');
        return;
      }

      const data = (await res.json()) as { user: { role: string } };
      const role = data.user?.role;

      if ((role === 'admin' || role === 'owner') && !next.startsWith('/admin')) {
        router.replace(next === '/' ? '/' : next);
      } else {
        router.replace(next);
      }
    } catch {
      setServerError('A network error occurred. Please try again.');
    }
  }

  function fillAndSubmit(email: string, password: string) {
    setValue('email', email);
    setValue('password', password);
    void handleSubmit(onSubmit)();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row">

      {/* ── Left brand panel — desktop only ───────────────────────────── */}
      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between p-12 
          bg-[var(--accent)] relative overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Abstract warm tonal shapes */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px]
          rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-120px] left-[-60px] w-[280px] h-[280px]
          rounded-full bg-[var(--accent-deep)]/40 pointer-events-none" />

        {/* Brand content */}
        <div className="relative flex flex-col gap-8">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20
              flex items-center justify-center font-extrabold text-[18px] text-white">
              R
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-tight">RADHA</span>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <p className="text-white/60 text-[11px] font-semibold tracking-[0.12em] uppercase">
              Retail Operations · Back Office
            </p>
            <h1 className="text-white font-extrabold text-[38px] leading-[1.1] tracking-tight">
              Your retail<br />command centre.
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed max-w-[280px]">
              Expiry tracking, EAN audit, task management, inventory, and analytics — in one premium back-office.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            <FeaturePill icon={ClipboardList} label="Expiry tracking" />
            <FeaturePill icon={Package} label="Inventory & GRN" />
            <FeaturePill icon={ShieldCheck} label="EAN audit" />
            <FeaturePill icon={BarChart3} label="Analytics" />
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-white/30 text-[11px]">
          RADHA v1 · Private back-office · Not for public access
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center
        bg-[var(--surface)] px-6 py-12 md:py-0">

        {/* Mobile wordmark (hidden on desktop — brand panel handles it) */}
        <div className="md:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center
            font-extrabold text-[16px] text-white">
            R
          </div>
          <span className="font-extrabold text-[18px] text-[var(--ink)]">RADHA</span>
        </div>

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--ink-soft)]">
              Admin Dashboard
            </p>
            <h2 className="text-[24px] font-extrabold text-[var(--ink)]">
              Sign in to your account
            </h2>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg
                bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.2)]
                text-[13px] text-[var(--danger)] font-medium"
            >
              {serverError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <FormField
              label="Email address"
              htmlFor="email"
              required
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register('password')}
              />
            </FormField>

            <div className="flex justify-end -mt-1">
              <Link
                href="/reset"
                className="text-[12px] text-[var(--accent)] font-medium hover:underline
                  focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </div>

        {/* ── Demo accounts ─────────────────────────────────────────── */}
        {IS_DEMO && (
          <div className="w-full max-w-[400px] flex flex-col gap-3 mt-8">
            {/* Demo banner */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-[var(--accent-tint)] border border-[color:rgb(234_88_12_/_0.2)]">
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--accent-deep)]">
                Demo
              </span>
              <span className="flex-1 text-[12px] text-[var(--accent-deep)] opacity-80">
                Click any role to sign in · Password:{' '}
                <code className="font-mono">demo1234</code>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillAndSubmit(acc.email, acc.password)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border text-left',
                    'hover:scale-[1.01] active:scale-[0.99] transition-transform duration-100',
                    'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    acc.color,
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold">{acc.role}</span>
                      <span className="text-[10px] font-mono opacity-60">
                        {acc.email.split('@')[0]}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-70">{acc.description}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-[var(--ink-soft)] text-center">
              Demo mode · No real backend required · All data is simulated
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
