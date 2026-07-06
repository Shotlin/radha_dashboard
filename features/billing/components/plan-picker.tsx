'use client';
/**
 * features/billing/components/plan-picker.tsx
 * Plan cards from /subscriptions/plans, highlight current, orange "Upgrade" CTA.
 */
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import type { Plan, Subscription } from '../billing.schema';

interface PlanPickerProps {
  plans: Plan[] | undefined;
  currentSubscription: Subscription | undefined;
  isLoading?: boolean;
  onUpgrade: (planId: string) => void;
  upgradingPlanId?: string | null;
}

export function PlanPicker({
  plans,
  currentSubscription,
  isLoading,
  onUpgrade,
  upgradingPlanId,
}: PlanPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <p className="text-ink-soft text-[14px]">No plans available at the moment.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isCurrent = currentSubscription?.plan === plan.id ||
          currentSubscription?.plan?.toLowerCase() === plan.name?.toLowerCase();
        const isLoading = upgradingPlanId === plan.id;

        return (
          <div
            key={plan.id}
            className={cn(
              'card p-5 flex flex-col gap-4 relative',
              isCurrent && 'ring-2 ring-accent',
              plan.isPopular && !isCurrent && 'ring-1 ring-accent/30',
            )}
          >
            {/* Popular badge */}
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-accent text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                <Star className="h-3 w-3" aria-hidden="true" />
                Popular
              </span>
            )}

            {/* Plan name */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                Plan
              </p>
              <h3 className="text-[18px] font-extrabold text-ink mt-0.5 capitalize">
                {plan.name}
              </h3>
            </div>

            {/* Price */}
            <div>
              <span className="font-mono text-[28px] font-bold text-ink">
                ₹{plan.priceMonthly}
              </span>
              <span className="text-[13px] text-ink-soft ml-1">/month</span>
              {plan.priceQuarterly && (
                <p className="text-[12px] text-ink-soft mt-0.5 font-mono">
                  ₹{plan.priceQuarterly} billed quarterly
                </p>
              )}
            </div>

            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <ul className="flex flex-col gap-1.5" aria-label={`${plan.name} features`}>
                {plan.features.map((f) => (
                  <li key={f} className="inline-flex items-start gap-2 text-[13px] text-ink-soft">
                    <Check
                      className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA — one orange CTA per card, but only one per region is "primary" */}
            <div className="mt-auto pt-2">
              {isCurrent ? (
                <div className="w-full py-2 text-center text-[13px] font-semibold text-accent bg-accent-tint rounded-lg">
                  Current Plan
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  loading={isLoading}
                  onClick={() => onUpgrade(plan.id)}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
