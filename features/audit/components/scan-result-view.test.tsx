// Feature: dashboard-production-ready, scan UI behavior (R3.1,3.2,3.6,3.7,3.9)
/**
 * features/audit/components/scan-result-view.test.tsx
 *
 * Component (RTL) tests for <ScanResultView />, the dashboard surface that
 * resolves a scanned barcode into a product + verification result.
 *
 * Coverage (Requirement 3):
 *  • R3.1 — submitting a barcode initiates the store-scoped POST to
 *           /api/audit/scan?storeId=<activeStoreId> with the barcode in the body.
 *  • R3.2 — a successful ScanResult renders the product name + EAN (plus the
 *           verification pill, exact scanned barcode, and timestamp).
 *  • R3.6 — while a fresh scan is pending the view shows loading and does NOT
 *           show the previously matched product.
 *  • R3.7 — a failed lookup renders an error state that retains the barcode and
 *           offers a Retry action that re-submits the same barcode.
 *  • R3.9 — a demo-style product ScanResult renders the demo product.
 *
 * The store scope is mocked to a fixed store; global fetch is mocked so each
 * test controls the response; render is wrapped in a TanStack QueryClientProvider
 * with retries disabled so error states surface immediately.
 */
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ScanResultView } from './scan-result-view';
import type { ScanResult } from '../scan.types';

// ── Mocks ─────────────────────────────────────────────────────────────────
const setStoreId = vi.fn();
vi.mock('@/lib/hooks/use-store-scope', () => ({
  useStoreScope: () => ({ storeId: 'demo-store-001', setStoreId }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

/** A resolved-immediately fetch Response stub with the given JSON body. */
function okJsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

/** A non-ok Response stub so postScan throws and the mutation errors (R3.7). */
function failedResponse(status = 500): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response;
}

const MATCHED_RESULT: ScanResult = {
  barcode: '8901234567890',
  scannedAt: '2026-06-12T09:30:00.000Z',
  status: 'matched',
  product: {
    name: 'Parle-G Gold Biscuits',
    ean: '8901234567890',
    imageUrl: null,
  },
};

const DEMO_RESULT: ScanResult = {
  barcode: '8904567812345',
  scannedAt: '2026-06-12T11:15:00.000Z',
  status: 'matched',
  product: {
    name: 'Amul Taaza Toned Milk',
    ean: '8904567812345',
    imageUrl: null,
  },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function submitBarcode(value: string) {
  const input = screen.getByLabelText('Barcode or EAN to verify');
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /verify/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('ScanResultView', () => {
  it('R3.1: submitting a barcode POSTs to the store-scoped scan proxy with the barcode', async () => {
    fetchMock.mockResolvedValue(okJsonResponse(MATCHED_RESULT));

    renderWithClient(<ScanResultView />);
    submitBarcode('8901234567890');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/audit/scan?storeId=demo-store-001');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(init.body as string)).toEqual({ barcode: '8901234567890' });
  });

  it('R3.2: renders the product name, EAN, verification pill, exact barcode and timestamp on success', async () => {
    fetchMock.mockResolvedValue(okJsonResponse(MATCHED_RESULT));

    renderWithClient(<ScanResultView />);
    submitBarcode('8901234567890');

    // Product name + EAN (R3.2)
    expect(await screen.findByText('Parle-G Gold Biscuits')).toBeInTheDocument();

    // Verification pill carries an accessible name (R3.3 surface)
    expect(screen.getByRole('status', { name: /verification: matched/i })).toBeInTheDocument();

    // EAN, exact scanned barcode, and a formatted timestamp are all shown (R3.2, R3.4).
    const eanRow = screen.getByText('EAN').closest('div') as HTMLElement;
    expect(within(eanRow).getByText('8901234567890')).toBeInTheDocument();

    const barcodeRow = screen.getByText('Scanned barcode').closest('div') as HTMLElement;
    expect(within(barcodeRow).getByText('8901234567890')).toBeInTheDocument();

    // The timestamp readout renders the year from the formatted instant.
    const tsRow = screen.getByText('Scanned at').closest('div') as HTMLElement;
    expect(within(tsRow).getByText(/2026/)).toBeInTheDocument();
  });

  it('R3.6: a second pending scan shows loading and clears the prior matched product', async () => {
    // First scan resolves immediately.
    fetchMock.mockResolvedValueOnce(okJsonResponse(MATCHED_RESULT));

    // Second scan stays pending until we resolve it.
    let resolveSecond: (res: Response) => void = () => {};
    const secondPending = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });
    fetchMock.mockReturnValueOnce(secondPending);

    renderWithClient(<ScanResultView />);

    submitBarcode('8901234567890');
    expect(await screen.findByText('Parle-G Gold Biscuits')).toBeInTheDocument();

    // Submit a different barcode; its fetch is deferred (pending).
    submitBarcode('8909999999999');

    // Loading state is shown and the previous product is gone (R3.6).
    await waitFor(() =>
      expect(screen.getByText(/verifying barcode/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText('Parle-G Gold Biscuits')).not.toBeInTheDocument();

    // Resolve the deferred request so no act warnings leak.
    resolveSecond(okJsonResponse({ ...MATCHED_RESULT, barcode: '8909999999999' }));
    await screen.findByText(/8909999999999/);
  });

  it('R3.7: a failed lookup shows the error state with the barcode, and Retry re-submits it', async () => {
    fetchMock.mockResolvedValue(failedResponse(500));

    renderWithClient(<ScanResultView />);
    submitBarcode('8901234567890');

    // Error state renders and retains the exact scanned barcode (R3.7).
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/scan lookup failed/i)).toBeInTheDocument();
    expect(within(alert).getByText('8901234567890')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Retry re-issues the scan with the same barcode (R3.7).
    fireEvent.click(screen.getByRole('button', { name: /retry scan/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [, secondInit] = fetchMock.mock.calls[1];
    expect(JSON.parse(secondInit.body as string)).toEqual({ barcode: '8901234567890' });
  });

  it('R3.9: a demo-style product result renders the demo product and timestamp', async () => {
    fetchMock.mockResolvedValue(okJsonResponse(DEMO_RESULT));

    renderWithClient(<ScanResultView />);
    submitBarcode('8904567812345');

    expect(await screen.findByText('Amul Taaza Toned Milk')).toBeInTheDocument();
    const barcodeRow = screen.getByText('Scanned barcode').closest('div') as HTMLElement;
    expect(within(barcodeRow).getByText('8904567812345')).toBeInTheDocument();
  });

  it('renders the idle prompt before any scan is submitted', () => {
    renderWithClient(<ScanResultView />);
    expect(
      screen.getByText(/scan or enter a barcode to verify it against this store/i),
    ).toBeInTheDocument();
  });
});
