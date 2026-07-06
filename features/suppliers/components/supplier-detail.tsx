'use client';
/**
 * features/suppliers/components/supplier-detail.tsx
 * Info card + performance metrics for a single supplier.
 */
import { Mail, Phone, MapPin, User, TrendingUp, Package, Calendar } from 'lucide-react';
import { Skeleton, ErrorState } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useSupplierDetail, useSupplierPerformance } from '../suppliers.queries';

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-surface-sunken flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[14px] text-ink">{value}</p>
      </div>
    </div>
  );
}

function PerformanceCard({ id }: { id: string }) {
  const { data, isLoading, isError } = useSupplierPerformance(id);

  if (isLoading) {
    return (
      <div className="card p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">Performance</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <div className="w-8 h-8 rounded-md bg-[color:rgb(21_128_61_/_0.08)] flex items-center justify-center">
            <Package className="h-4 w-4 text-success" aria-hidden="true" />
          </div>
          <p className="text-[22px] font-bold font-mono tabular-nums text-ink">{data.totalGrns}</p>
          <p className="text-[12px] text-ink-soft">Total GRNs</p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-8 h-8 rounded-md bg-accent-tint flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <p className="text-[22px] font-bold font-mono tabular-nums text-ink">
            {(data.onTimeRate * 100).toFixed(0)}%
          </p>
          <p className="text-[12px] text-ink-soft">On-time Rate</p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-8 h-8 rounded-md bg-surface-sunken flex items-center justify-center">
            <Calendar className="h-4 w-4 text-ink-soft" aria-hidden="true" />
          </div>
          <p className="text-[14px] font-semibold font-mono tabular-nums text-ink">
            {data.lastDeliveryAt
              ? new Date(data.lastDeliveryAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
          <p className="text-[12px] text-ink-soft">Last Delivery</p>
        </div>
      </div>
    </div>
  );
}

interface SupplierDetailProps {
  id: string;
}

export function SupplierDetail({ id }: SupplierDetailProps) {
  const { data, isLoading, isError } = useSupplierDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-6 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState title="Could not load supplier" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Info card */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-ink">{data.name}</h2>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[12px] font-semibold mt-1',
                data.isActive ? 'text-success' : 'text-ink-soft',
              )}
            >
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label="Contact" value={data.contactName} />
          <InfoRow icon={Phone} label="Phone" value={data.phone} />
          <InfoRow icon={Mail} label="Email" value={data.email} />
          <InfoRow icon={MapPin} label="Address" value={data.address} />
        </div>
      </div>

      {/* Performance */}
      <PerformanceCard id={id} />
    </div>
  );
}
