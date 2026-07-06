'use client';
/**
 * features/settings/components/language-select.tsx
 * Select the UI language from supported locales.
 *
 * Shipped locales: en, hi, ta, te, bn, mr.
 * Note: Gujarati (gu) is recommended for this client but NOT shipped in v1.
 *
 * Persists via PUT /api/settings/language (route handler → PUT /users/me/language).
 */
import { useState } from 'react';
import { Check, Globe, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LOCALES, type LocaleCode } from '../settings.schema';
import { useLanguagePreference } from '../settings.queries';
import { useUpdateLanguageMutation } from '../settings.actions';

export function LanguageSelect() {
  const { data, isLoading } = useLanguagePreference();
  const mutation = useUpdateLanguageMutation();
  const [selected, setSelected] = useState<LocaleCode | null>(null);

  const currentLanguage = (selected ?? data?.language ?? 'en') as LocaleCode;

  async function handleSave() {
    if (!selected || selected === data?.language) return;
    try {
      await mutation.mutateAsync({ language: selected });
      // Clear local selection — now server-driven
      setSelected(null);
    } catch {
      // error shown inline
    }
  }

  const isDirty = selected !== null && selected !== data?.language;

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-[var(--accent-deep)]" aria-hidden="true" />
        <h2 className="text-[16px] font-bold text-[var(--ink)]">Interface Language</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label="Select interface language"
          className="flex flex-col gap-2"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const isActive = currentLanguage === locale.code;
            return (
              <button
                key={locale.code}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setSelected(locale.code as LocaleCode)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-lg border text-left',
                  'transition-colors duration-150',
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent-deep)]'
                    : 'border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--surface-sunken)]',
                )}
              >
                <span className="text-[14px] font-medium">{locale.label}</span>
                {isActive && (
                  <Check
                    className="h-4 w-4 text-[var(--accent-deep)] flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Gujarati note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--hairline)]">
        <Info className="h-4 w-4 text-[var(--ink-soft)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[12px] text-[var(--ink-soft)]">
          <strong>Gujarati (gu)</strong> is recommended for this client but not shipped in v1.
          It is planned for v1.1.
        </p>
      </div>

      {mutation.error && (
        <p className="text-[13px] text-[var(--danger)]" role="alert">
          {mutation.error.message}
        </p>
      )}

      {mutation.isSuccess && !isDirty && (
        <p className="text-[13px] text-[var(--success)]" role="status">
          Language preference saved.
        </p>
      )}

      <Button
        variant="primary"
        size="sm"
        onClick={handleSave}
        disabled={!isDirty}
        loading={mutation.isPending}
        className="self-start"
      >
        Save language
      </Button>
    </div>
  );
}
