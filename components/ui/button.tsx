import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // base
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold text-[15px] leading-none',
    'transition-transform duration-[120ms] ease-[var(--motion-enter)]',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-white hover:bg-accent-deep shadow-sm px-6 py-3',
        secondary:
          'bg-surface-raised border border-hairline text-ink hover:bg-surface-sunken px-6 py-3',
        ghost:
          'bg-transparent text-ink hover:bg-surface-sunken px-4 py-2',
        danger:
          'bg-danger text-white hover:opacity-90 px-6 py-3',
        link:
          'underline text-accent p-0 h-auto font-normal',
      },
      size: {
        sm: 'text-[13px] px-4 py-2',
        md: 'px-6 py-3',
        lg: 'px-8 py-4 text-[17px]',
        icon: 'h-10 w-10 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Button — React 19 direct ref prop (no forwardRef needed).
 * suppressHydrationWarning prevents SSR/client mismatches from React 19 forwardRef.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      suppressHydrationWarning
      {...props}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <span className="sr-only">Loading…</span>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
Button.displayName = 'Button';

export { Button, buttonVariants };
