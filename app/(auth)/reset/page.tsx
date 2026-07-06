'use client';
/**
 * Reset password page — (auth)/reset
 *
 * Step 1 (no token): request reset email
 * Step 2 (?token=xxx): complete reset with new password
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  resetRequestSchema,
  resetCompleteSchema,
  type ResetRequestFormValues,
  type ResetCompleteFormValues,
} from '@/features/auth/auth.schema';
import { PasswordStrength } from '@/features/auth/password-strength';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Step 1: Request reset email ──────────────────────────────────────────── */
function RequestStep() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestFormValues>({ resolver: zodResolver(resetRequestSchema) });

  async function onSubmit(values: ResetRequestFormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setServerError(err.message ?? 'Could not send reset email. Try again.');
    }
  }

  if (success) {
    return (
      <div className="text-center flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h2 className="text-[20px] font-bold text-[var(--ink)]">Check your inbox</h2>
        <p className="text-[14px] text-[var(--ink-soft)]">
          If that email is registered, we&apos;ve sent a reset link. Check your spam folder too.
        </p>
        <Link href="/login" className="text-[13px] text-[var(--accent)] font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <FormField label="Email address" htmlFor="reset-email" required error={errors.email?.message}>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register('email')}
        />
      </FormField>
      {serverError && (
        <p role="alert" className="text-[13px] text-danger font-medium">{serverError}</p>
      )}
      <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>
      <Link href="/login" className="text-[13px] text-[var(--ink-soft)] hover:underline text-center">
        Back to sign in
      </Link>
    </form>
  );
}

/* ── Step 2: Set new password ─────────────────────────────────────────────── */
function CompleteStep({ token }: { token: string }) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetCompleteFormValues>({
    resolver: zodResolver(resetCompleteSchema),
    defaultValues: { token },
  });

  const passwordValue = watch('newPassword', '');

  async function onSubmit(values: ResetCompleteFormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/reset-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: values.token, newPassword: values.newPassword }),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setServerError(err.message ?? 'Could not reset password. The link may have expired.');
    }
  }

  if (success) {
    return (
      <div className="text-center flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h2 className="text-[20px] font-bold text-[var(--ink)]">Password updated</h2>
        <p className="text-[14px] text-[var(--ink-soft)]">You can now sign in with your new password.</p>
        <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-[15px] mt-1 transition-transform active:scale-[0.98]">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <input type="hidden" {...register('token')} />
      <FormField label="New password" htmlFor="new-password" required error={errors.newPassword?.message} hint="Minimum 12 characters, one uppercase letter, one number">
        <Input id="new-password" type="password" autoComplete="new-password" placeholder="New password" {...register('newPassword')} />
        <PasswordStrength password={passwordValue} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirm-password" required error={errors.confirmPassword?.message}>
        <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="Confirm new password" {...register('confirmPassword')} />
      </FormField>
      {serverError && (
        <p role="alert" className="text-[13px] text-danger font-medium">{serverError}</p>
      )}
      <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
        Set new password
      </Button>
    </form>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
import { Suspense } from 'react';

function ResetContent() {
  const params = useSearchParams();
  const token = params.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6 py-12">
      <div
        className="w-full max-w-[420px] card p-8 sm:p-10 flex flex-col gap-7"
        style={{ animation: 'fade-up 220ms var(--motion-enter) both' }}
      >
        <div className="text-center">
          <p className="eyebrow mb-1">RADHA · Admin Dashboard</p>
          <h1 className="text-[22px] font-extrabold text-[var(--ink)]" style={{ fontFamily: 'var(--font-sans)' }}>
            {token ? 'Set new password' : 'Reset password'}
          </h1>
        </div>

        {token ? <CompleteStep token={token} /> : <RequestStep />}
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    }>
      <ResetContent />
    </Suspense>
  );
}
