'use client';
/**
 * Invite accept page — (auth)/invite?token=xxx
 */
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { inviteAcceptSchema, type InviteAcceptFormValues } from '@/features/auth/auth.schema';
import { PasswordStrength } from '@/features/auth/password-strength';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';

function InviteContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteAcceptFormValues>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: { token },
  });

  const passwordValue = watch('password', '');

  async function onSubmit(values: InviteAcceptFormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/invite-accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: values.token, name: values.name, password: values.password }),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setServerError(err.message ?? 'Could not accept invite. The link may have expired.');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6">
        <div className="card p-10 text-center max-w-md">
          <h1 className="text-[20px] font-bold text-[var(--ink)] mb-2">Invalid invite link</h1>
          <p className="text-[14px] text-[var(--ink-soft)]">This link is missing a token. Contact your admin for a new invite.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6">
        <div className="card p-10 text-center max-w-md flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h1 className="text-[20px] font-bold text-[var(--ink)]">Account created!</h1>
          <p className="text-[14px] text-[var(--ink-soft)]">Your account is ready. Sign in to get started.</p>
          <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-[15px] transition-transform active:scale-[0.98]">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6 py-12">
      <div className="w-full max-w-[420px] card p-8 sm:p-10 flex flex-col gap-7">
        <div className="text-center">
          <p className="eyebrow mb-1">RADHA · Admin Dashboard</p>
          <h1 className="text-[22px] font-extrabold text-[var(--ink)]" style={{ fontFamily: 'var(--font-sans)' }}>
            Accept your invite
          </h1>
          <p className="text-[14px] text-[var(--ink-soft)] mt-1">Set up your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <input type="hidden" {...register('token')} />

          <FormField label="Your name" htmlFor="invite-name" required error={errors.name?.message}>
            <Input id="invite-name" type="text" autoComplete="name" placeholder="Full name" {...register('name')} />
          </FormField>

          <FormField label="Password" htmlFor="invite-password" required error={errors.password?.message} hint="Minimum 12 characters, one uppercase letter, one number">
            <Input id="invite-password" type="password" autoComplete="new-password" placeholder="Choose a strong password" {...register('password')} />
            <PasswordStrength password={passwordValue} />
          </FormField>

          <FormField label="Confirm password" htmlFor="invite-confirm" required error={errors.confirmPassword?.message}>
            <Input id="invite-confirm" type="password" autoComplete="new-password" placeholder="Confirm password" {...register('confirmPassword')} />
          </FormField>

          {serverError && <p role="alert" className="text-[13px] text-danger font-medium">{serverError}</p>}

          <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
