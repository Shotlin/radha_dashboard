'use client';
/**
 * features/settings/components/security-card.tsx
 * Password change form with:
 *   - Current password + new password (min 12, strength meter) + confirm
 *   - Step-up re-auth pattern (current password verified server-side before change)
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { PasswordStrength } from '@/features/auth/password-strength';
import { changePasswordSchema, type ChangePasswordPayload } from '../settings.schema';
import { useChangePasswordMutation } from '../settings.actions';

function PasswordInput({
  id,
  placeholder,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2.5 pr-10 rounded-lg text-[14px] text-[var(--ink)]',
          'bg-[var(--surface)] border border-[var(--hairline)]',
          'placeholder:text-[var(--ink-soft)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-shadow duration-150',
        )}
        {...rest}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function SecurityCard() {
  const mutation = useChangePasswordMutation();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordPayload>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watch('newPassword') ?? '';

  async function onSubmit(data: ChangePasswordPayload) {
    setSuccessMsg(null);
    try {
      await mutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setSuccessMsg('Password changed successfully. Please use your new password next time you sign in.');
    } catch {
      // shown via mutation.error
    }
  }

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[var(--accent-deep)]" aria-hidden="true" />
        <h2 className="text-[16px] font-bold text-[var(--ink)]">Change Password</h2>
      </div>

      <p className="text-[13px] text-[var(--ink-soft)]">
        Your current password is verified before the change is applied (step-up re-auth).
        New passwords must be at least 12 characters and include uppercase, number, and special characters.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-sm">
        {/* Current password */}
        <FormField
          label="Current password"
          htmlFor="currentPassword"
          required
          error={errors.currentPassword?.message}
        >
          <PasswordInput
            id="currentPassword"
            placeholder="Enter current password"
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>

        {/* New password */}
        <FormField
          label="New password"
          htmlFor="newPassword"
          required
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="newPassword"
            placeholder="At least 12 characters"
            aria-invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
          <PasswordStrength password={newPasswordValue} />
        </FormField>

        {/* Confirm password */}
        <FormField
          label="Confirm new password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="Repeat new password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        {/* Server error */}
        {mutation.error && (
          <div
            className="px-3 py-2 rounded-lg bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.2)] text-[13px] text-[var(--danger)]"
            role="alert"
          >
            {mutation.error.message}
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div
            className="px-3 py-2 rounded-lg bg-[color:rgb(21_128_61_/_0.06)] border border-[color:rgb(21_128_61_/_0.2)] text-[13px] text-[var(--success)]"
            role="status"
          >
            {successMsg}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSubmitting || mutation.isPending}
          className="self-start"
        >
          Change password
        </Button>
      </form>
    </div>
  );
}
