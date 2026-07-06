'use client';
/**
 * features/settings/components/profile-card.tsx
 * Displays and edits the current user's profile:
 *   - Display name (editable)
 *   - Role (read-only)
 *   - Mobile (read-only, masked)
 *   - Stores list (read-only)
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Pencil, Check, X, Store, Shield, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { useProfile } from '../settings.queries';
import { useUpdateProfileMutation } from '../settings.actions';
import { updateProfileSchema, type UpdateProfilePayload } from '../settings.schema';

/* ── Role badge ──────────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
    auditor: 'Auditor',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold',
        'bg-[var(--accent-tint)] text-[var(--accent-deep)]',
      )}
    >
      <Shield className="h-3 w-3" aria-hidden="true" />
      {labels[role] ?? role}
    </span>
  );
}

/* ── Masked mobile ───────────────────────────────────────────────────────── */
function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return '••••';
  return mobile.slice(0, -4).replace(/./g, '•') + mobile.slice(-4);
}

/* ── Profile card ────────────────────────────────────────────────────────── */
export function ProfileCard() {
  const { data: profile, isLoading, isError } = useProfile();
  const mutation = useUpdateProfileMutation();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfilePayload>({
    resolver: zodResolver(updateProfileSchema),
    values: { name: profile?.name ?? '' },
  });

  function startEdit() {
    reset({ name: profile?.name ?? '' });
    setEditing(true);
  }

  function cancelEdit() {
    reset({ name: profile?.name ?? '' });
    setEditing(false);
  }

  async function onSubmit(data: UpdateProfilePayload) {
    try {
      await mutation.mutateAsync(data);
      setEditing(false);
    } catch {
      // error displayed via mutation.error
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6 flex flex-col gap-4" aria-busy="true">
        <div className="flex items-center gap-3">
          <div className="skeleton rounded-full h-12 w-12" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="card p-6">
        <p className="text-sm text-[var(--ink-soft)]">Could not load profile.</p>
      </div>
    );
  }

  return (
    <div className="card p-6 flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full bg-[var(--accent-tint)] flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <User className="h-6 w-6 text-[var(--accent-deep)]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[17px] font-bold text-[var(--ink)]">{profile.name}</p>
            <RoleBadge role={profile.role} />
          </div>
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={startEdit} aria-label="Edit profile">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        )}
      </div>

      {/* Edit form */}
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            label="Display name"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              {...register('name')}
              autoFocus
              aria-invalid={!!errors.name}
            />
          </FormField>
          {mutation.error && (
            <p className="text-[13px] text-[var(--danger)]" role="alert">
              {mutation.error.message}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={mutation.isPending}
              disabled={!isDirty}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={mutation.isPending}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        /* Read-only metadata */
        <dl className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-4">
          {/* Mobile */}
          {profile.mobile ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-[13px] text-[var(--ink-soft)]">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                Mobile
              </dt>
              <dd className="font-mono text-[13px] text-[var(--ink)]">
                {maskMobile(profile.mobile)}
              </dd>
            </div>
          ) : null}

          {/* Stores */}
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-2 text-[13px] text-[var(--ink-soft)]">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Stores
            </dt>
            <dd className="text-[13px] text-[var(--ink)] font-medium">
              {profile.storeIds.length > 0 ? (
                <span className="font-mono">{profile.storeIds.length} store{profile.storeIds.length !== 1 ? 's' : ''}</span>
              ) : (
                <span className="text-[var(--ink-soft)]">No stores assigned</span>
              )}
            </dd>
          </div>

          {/* Tenant */}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[13px] text-[var(--ink-soft)]">Tenant ID</dt>
            <dd className="font-mono text-[11px] text-[var(--ink-soft)] truncate max-w-[200px]">
              {profile.tenantId}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
