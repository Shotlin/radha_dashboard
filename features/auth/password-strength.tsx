'use client';
/**
 * PasswordStrength — visual strength meter for the password field.
 * Four levels: weak / fair / good / strong.
 */
import { cn } from '@/lib/utils';

function getStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: 'Too short', color: 'bg-danger' },
    { label: 'Weak', color: 'bg-warn' },
    { label: 'Fair', color: 'bg-[var(--cat-amber)]' },
    { label: 'Good', color: 'bg-[var(--success)]' },
    { label: 'Strong', color: 'bg-[var(--success)]' },
  ] as const;

  return { score: score as 0 | 1 | 2 | 3 | 4, label: map[score].label, color: map[score].color };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1" aria-live="polite">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              score >= level ? color : 'bg-[var(--hairline)]',
            )}
          />
        ))}
      </div>
      {label && (
        <p className="text-[11px] font-medium text-[var(--ink-soft)]" aria-label={`Password strength: ${label}`}>
          {label}
        </p>
      )}
    </div>
  );
}
