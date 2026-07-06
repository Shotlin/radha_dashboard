'use client';
/**
 * Alerts panel — groups alerts by severity, with drill + create-task affordance
 */
import Link from 'next/link';
import { AlertTriangle, Info, AlertCircle, ArrowRight, ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { RegionState } from '@/components/system/region-state';
import { cn } from '@/lib/utils';
import { useOverviewAlerts } from '../overview.queries';
import type { Alert } from '../overview.schema';

function severityConfig(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        color: 'text-[var(--danger)]',
        bg: 'bg-[color:rgb(185_28_28_/_0.06)] border-[color:rgb(185_28_28_/_0.2)]',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-[var(--warn)]',
        bg: 'bg-[color:rgb(180_83_9_/_0.06)] border-[color:rgb(180_83_9_/_0.2)]',
      };
    default:
      return {
        icon: Info,
        color: 'text-[var(--teal)]',
        bg: 'bg-[color:rgb(15_118_110_/_0.06)] border-[color:rgb(15_118_110_/_0.2)]',
      };
  }
}

interface AlertRowProps {
  alert: Alert;
}

function AlertRow({ alert }: AlertRowProps) {
  const cfg = severityConfig(alert.severity);
  const Icon = cfg.icon;
  // Dot color for the row indicator
  const dotColor =
    alert.severity === 'critical' ? 'bg-[var(--danger)]' :
    alert.severity === 'warning'  ? 'bg-[var(--warn)]'   :
    'bg-[var(--teal)]';

  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-[var(--hairline)] last:border-0
        hover:bg-[var(--surface-sunken)] -mx-5 px-5 transition-colors duration-100"
    >
      {/* Severity dot */}
      <span className={cn('mt-2 w-2 h-2 rounded-full flex-shrink-0', dotColor)} aria-hidden="true" />
      {/* Icon */}
      <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', cfg.color)} aria-hidden="true" />
      {/* Message */}
      <p className="flex-1 text-[13px] text-[var(--ink)] leading-snug">{alert.message}</p>
      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {alert.actionUrl && (
          <Link
            href={alert.actionUrl}
            className={cn(
              'p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors',
              'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
            )}
            aria-label="View alert detail"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
        <Link
          href="/tasks"
          className={cn(
            'p-1 rounded text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors',
            'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
          )}
          aria-label="Create task from alert"
          title="Create task"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

interface AlertsPanelProps {
  storeId: string | null;
}

export function AlertsPanel({ storeId }: AlertsPanelProps) {
  const query = useOverviewAlerts(storeId);

  return (
    <RegionState
      query={query}
      variant="list"
      rows={4}
      errorTitle="Could not load alerts"
      errorMessage="Active alerts could not be loaded. Other sections are unaffected."
    >
      {query.data ? <AlertsContent alerts={query.data.alerts} /> : null}
    </RegionState>
  );
}

function AlertsContent({ alerts }: { alerts: Alert[] }) {
  const criticals = alerts.filter((a) => a.severity === 'critical');
  const warnings = alerts.filter((a) => a.severity === 'warning');
  const infos = alerts.filter((a) => a.severity === 'info');

  return (
    <div className="card p-5 flex flex-col gap-3">
      <Eyebrow>Alerts ({alerts.length})</Eyebrow>
      {alerts.length === 0 ? (
        <EmptyState
          title="No active alerts"
          description="All clear — your store is on track."
          className="border-0 bg-transparent py-6"
        />
      ) : (
        <div className="flex flex-col">
          {[...criticals, ...warnings, ...infos].map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
