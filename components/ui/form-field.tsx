'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

/* ── Label ─────────────────────────────────────────────── */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-[13px] font-semibold text-ink leading-none', className)}
    {...props}
  >
    {children}
    {required && (
      <span className="ml-1 text-danger" aria-hidden="true">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';

/* ── Input ─────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-[14px] text-ink',
        'bg-surface border border-hairline',
        'placeholder:text-ink-soft',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'transition-shadow duration-150',
        mono && 'font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

/* ── FormField ─────────────────────────────────────────── */
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField (Doc 2 §4.9) — visible label, orange focus ring, inline validation,
 * helper text, required asterisk. Built to wrap RHF-controlled inputs.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[12px] text-danger font-medium" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[12px] text-ink-soft">{hint}</p>
      )}
    </div>
  );
}

export { Label, Input };
