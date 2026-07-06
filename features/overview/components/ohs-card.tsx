'use client';
/**
 * OHS card — Store health score gauge + component breakdown.
 *
 * Wrapped in `RegionState`: loading → card-shaped skeleton, failure/timeout →
 * RegionError with a retry that re-issues only the health-score request (R10.5),
 * data → the gauge. A failure never redirects to login and leaves sibling
 * regions untouched (R10.1 / R10.6). A successfully-loaded-but-unscored store
 * (`overall == null`) still renders the gauge's "assessment pending" state.
 */
import { OhsGauge } from '@/components/ui/ohs-gauge';
import { RegionState } from '@/components/system/region-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useHealthScore } from '../overview.queries';

interface OhsCardProps {
  storeId: string | null;
}

type HealthScore = {
  overall: number;
  components?: { label: string; score: number }[];
  lastAssessedAt?: string | null;
};

export function OhsCard({ storeId }: OhsCardProps) {
  const query = useHealthScore(storeId);

  return (
    <RegionState
      query={query}
      variant="card"
      errorTitle="Could not load store health"
      errorMessage="The store health score could not be loaded. Other sections are unaffected."
    >
      {query.data ? <OhsContent data={query.data} /> : null}
    </RegionState>
  );
}

function OhsContent({ data }: { data: HealthScore }) {
  // OhsGauge treats `undefined` as the "assessment pending" state (dashed ring + "–").
  const score = data.overall ?? undefined;
  const components = data.components ?? [];

  return (
    <div className="card p-5 flex flex-col gap-4">
      <Eyebrow>Store Health</Eyebrow>
      <div className="flex flex-col items-center gap-4">
        <OhsGauge score={score} size={120} />
        {components.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {components.slice(0, 6).map((c) => (
              <div key={c.label} className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--ink-soft)] truncate">{c.label}</span>
                <span
                  className="font-mono tabular-nums font-semibold ml-2"
                  style={{
                    color: c.score >= 70 ? 'var(--success)' : c.score >= 40 ? 'var(--warn)' : 'var(--danger)',
                  }}
                >
                  {c.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
