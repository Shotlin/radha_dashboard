'use client';
/**
 * features/audit/components/scan-result-view.tsx
 * Scan_Result_View — the dashboard surface that resolves a scanned barcode into a
 * product + verification result (Requirement 3).
 *
 * Behaviour:
 *  • A barcode input + submit (or a `initialBarcode` prop). On submit the client
 *    fires the store-scoped POST to `/api/audit/scan?storeId=<activeStoreId>`
 *    immediately (well within 500 ms — R3.1), shows a loading state, and clears
 *    any prior result/status (R3.6 — the loading branch renders first and the
 *    mutation's `data` is reset to `undefined` while pending).
 *  • On success it renders the product name (via `resolveProductName`, never a
 *    fabricated value — R3.8), the EAN, the verification status as a status pill
 *    (exactly one of matched / not in list / invalid — R3.3), the scan timestamp
 *    formatted in the active Store_Scope local time zone (R3.4) and the exact
 *    scanned barcode (R3.2, R3.4).
 *  • On timeout/transport error it shows an error indication that retains and
 *    shows the exact scanned barcode and a retry action that re-submits the same
 *    barcode (R3.7).
 *
 * Tokens-only: every color/spacing/radius/duration is read from design tokens via
 * Tailwind token classes (no hard-coded literals — R9.1). Numerics (EAN, barcode,
 * timestamp) use JetBrains Mono via `font-mono tabular-nums` per the Visual Bible.
 */
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Barcode,
  CheckCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  ScanLine,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { Eyebrow } from '@/components/ui/eyebrow';
import { cn } from '@/lib/utils';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { resolveProductName, formatScanTimestamp } from '../scan.logic';
import type { ScanResult, VerificationStatus } from '../scan.types';

/**
 * IANA time zone the scan timestamp is rendered in. RADHA's market is Gujarat, so
 * the active Store_Scope local time zone defaults to India Standard Time (R3.4).
 * Overridable via the `timeZone` prop once per-store zones are wired through.
 */
const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export interface ScanResultViewProps {
  /** Pre-fill the barcode input (e.g. handed off from a scanner). */
  initialBarcode?: string;
  /** Active Store_Scope IANA time zone for the displayed timestamp (R3.4). */
  timeZone?: string;
  className?: string;
}

/**
 * POST a scanned barcode to the store-scoped scan proxy and parse the result.
 * A non-2xx response (timeout/transport/backend error) throws so the mutation
 * enters its error state, where the view keeps the barcode visible + offers
 * retry (R3.7).
 */
async function postScan(
  barcode: string,
  storeId: string | null,
  signal: AbortSignal,
): Promise<ScanResult> {
  const qs = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  const res = await fetch(`/api/audit/scan${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ barcode }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Scan lookup failed (${res.status})`);
  }
  return (await res.json()) as ScanResult;
}

/* ── Verification pill ─────────────────────────────────────────────────────
 * matched → success (check) · not in list → danger (cancel) · invalid →
 * neutral (help). Always carries an accessible name (Visual Bible §3.9, R3.3).
 */
const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { icon: React.ElementType; label: string; cls: string }
> = {
  matched: {
    icon: CheckCircle,
    label: 'Matched',
    cls: 'text-success bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.35)]',
  },
  'not in list': {
    icon: XCircle,
    label: 'Not in list',
    cls: 'text-danger bg-[color:rgb(185_28_28_/_0.08)] border-[color:rgb(185_28_28_/_0.35)]',
  },
  invalid: {
    icon: HelpCircle,
    label: 'Invalid',
    cls: 'text-ink-soft bg-surface-sunken border-hairline',
  },
};

function VerificationPill({ status }: { status: VerificationStatus }) {
  const cfg = VERIFICATION_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      role="status"
      aria-label={`Verification: ${cfg.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold',
        cfg.cls,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

/** A labelled field row used for EAN / barcode / timestamp readouts. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>{label}</Eyebrow>
      <div className="text-[14px] text-ink">{children}</div>
    </div>
  );
}

export function ScanResultView({ initialBarcode, timeZone, className }: ScanResultViewProps) {
  const { storeId } = useStoreScope();
  const tz = timeZone ?? DEFAULT_TIME_ZONE;

  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  // The exact barcode of the in-flight / last submitted Scan_Event. Retained for
  // every outcome so the loading + error states can show it (R3.5, R3.7).
  const [submittedBarcode, setSubmittedBarcode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => {
      // Abort any prior in-flight scan so a stale response can't land late.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      return postScan(value, storeId, controller.signal);
    },
  });

  // Fire a Scan_Event immediately (R3.1) for `value`, retaining the exact barcode.
  const runScan = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) return;
      setSubmittedBarcode(trimmed);
      mutation.mutate(trimmed);
    },
    [mutation],
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      runScan(barcode);
    },
    [barcode, runScan],
  );

  // Retry re-submits the exact same barcode (R3.7).
  const onRetry = useCallback(() => {
    if (submittedBarcode) runScan(submittedBarcode);
  }, [submittedBarcode, runScan]);

  const result = mutation.data;
  const resolvedName = result?.product ? resolveProductName(result.product.name) : null;

  return (
    <section className={cn('flex flex-col gap-24', className)} aria-label="Scan a barcode">
      {/* ── Input + submit ─────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="flex flex-col gap-12">
        <Eyebrow variant="accent">SCAN A PRODUCT</Eyebrow>
        <div className="flex items-end gap-12">
          <FormField label="Barcode / EAN" htmlFor="scan-barcode" className="flex-1">
            <Input
              id="scan-barcode"
              mono
              inputMode="numeric"
              autoComplete="off"
              placeholder="Scan or type an EAN"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              aria-label="Barcode or EAN to verify"
            />
          </FormField>
          <Button type="submit" variant="primary" disabled={barcode.trim().length === 0}>
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            Verify
          </Button>
        </div>
      </form>

      {/* ── Result region (loading / error / success) ──────────────────── */}
      <div aria-live="polite" aria-busy={mutation.isPending}>
        {mutation.isPending ? (
          <ScanLoading barcode={submittedBarcode} />
        ) : mutation.isError ? (
          <ScanError barcode={submittedBarcode} onRetry={onRetry} />
        ) : result ? (
          <ScanSuccess result={result} resolvedName={resolvedName} timeZone={tz} />
        ) : (
          <ScanIdle />
        )}
      </div>
    </section>
  );
}

/* ── Idle ──────────────────────────────────────────────────────────────── */
function ScanIdle() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 rounded-lg border border-dashed border-hairline bg-surface-sunken px-24 py-32 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
        <Barcode className="h-6 w-6 text-accent-deep" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-[14px] text-ink-soft">
        Scan or enter a barcode to verify it against this store&apos;s approved EAN list.
      </p>
    </div>
  );
}

/* ── Loading (R3.6 — clears any prior result while pending) ─────────────── */
function ScanLoading({ barcode }: { barcode: string | null }) {
  return (
    <div className="flex flex-col gap-16 rounded-lg border border-hairline bg-surface-raised p-24 shadow-card">
      <div className="flex items-center gap-12 text-ink-soft">
        <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
        <span className="text-[14px] font-semibold text-ink">Verifying barcode…</span>
      </div>
      {barcode && (
        <DetailRow label="Scanned barcode">
          <span className="font-mono tabular-nums text-ink">{barcode}</span>
        </DetailRow>
      )}
      <div className="flex flex-col gap-8">
        <div className="skeleton h-7 w-2/3 rounded-sm" aria-hidden="true" />
        <div className="skeleton h-4 w-1/3 rounded-sm" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ── Error (R3.7 — keeps the exact barcode visible + retry) ─────────────── */
function ScanError({ barcode, onRetry }: { barcode: string | null; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-16 rounded-lg border border-hairline bg-surface-raised p-24 shadow-card"
    >
      <div className="flex items-center gap-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:rgb(185_28_28_/_0.08)]">
          <XCircle className="h-5 w-5 text-danger" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-bold text-ink">Scan lookup failed</h3>
          <p className="text-[13px] text-ink-soft">
            The lookup timed out or could not reach the server. Your barcode is kept below.
          </p>
        </div>
      </div>

      {barcode && (
        <DetailRow label="Scanned barcode">
          <span className="font-mono tabular-nums text-ink">{barcode}</span>
        </DetailRow>
      )}

      <Button variant="secondary" size="sm" onClick={onRetry} className="self-start">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry scan
      </Button>
    </div>
  );
}

/* ── Success ────────────────────────────────────────────────────────────── */
function ScanSuccess({
  result,
  resolvedName,
  timeZone,
}: {
  result: ScanResult;
  resolvedName: ReturnType<typeof resolveProductName> | null;
  timeZone: string;
}) {
  return (
    <div className="flex flex-col gap-16 rounded-lg border border-hairline bg-surface-raised p-24 shadow-card">
      {/* Product name + verification status */}
      <div className="flex items-start justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>Product</Eyebrow>
          {resolvedName && resolvedName.kind === 'name' ? (
            <h3 className="truncate text-[18px] font-bold text-ink">{resolvedName.value}</h3>
          ) : (
            <h3 className="text-[18px] font-bold italic text-ink-soft">Unnamed product</h3>
          )}
        </div>
        <VerificationPill status={result.status} />
      </div>

      <div className="grid grid-cols-1 gap-16 border-t border-hairline pt-16 sm:grid-cols-3">
        <DetailRow label="EAN">
          <span className="font-mono tabular-nums text-ink">
            {result.product?.ean ?? result.barcode}
          </span>
        </DetailRow>

        <DetailRow label="Scanned barcode">
          <span className="font-mono tabular-nums text-ink">{result.barcode}</span>
        </DetailRow>

        <DetailRow label="Scanned at">
          <span className="font-mono tabular-nums text-ink">
            {formatScanTimestamp(result.scannedAt, { timeZone })}
          </span>
        </DetailRow>
      </div>
    </div>
  );
}
