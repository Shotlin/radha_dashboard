// Feature: dashboard-production-ready, Demo_Indicator (R2.1, R2.2, R2.3)
/**
 * Component tests for <DemoIndicator />
 *
 * Requirements:
 *   R2.1 — WHILE Demo_Mode is active, the Dashboard SHALL display a persistent
 *          Demo_Indicator containing text identifying the content as sample/demo data.
 *   R2.2 — WHILE Demo_Mode is inactive, the Dashboard SHALL NOT display any
 *          Demo_Indicator on any authenticated page.
 *   R2.3 — WHEN Demo_Mode is activated or deactivated, the indicator shall add/remove
 *          within 1s without a manual page reload (driven by client session state).
 *
 * The component reads `user.isDemo` from `useSession()`. Tests mock `useSession`
 * directly so no TanStack provider or real fetch is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DemoIndicator } from './demo-indicator';

// ── Mock useSession ────────────────────────────────────────────────────────

// next/navigation is used inside useSession's useEffect redirect logic;
// DemoIndicator only calls `useSession` — but the module-level import still
// runs, so we stub the three hooks it uses.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/audit',
  useSearchParams: () => new URLSearchParams(),
}));

// react-query is used inside useSession — provide a minimal stub so no real
// QueryClient is required.
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const real = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...real,
    useQuery: vi.fn(),
    useQueryClient: () => ({ clear: vi.fn() }),
  };
});

// Mock useSession itself so we fully control the returned user shape.
const mockUseSession = vi.fn();
vi.mock('@/lib/auth/use-session', () => ({
  useSession: () => mockUseSession(),
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────────────

function demoUser() {
  return {
    id: 'demo-u1',
    name: 'Demo User',
    role: 'manager',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001'],
    permissions: [],
    isDemo: true,
  };
}

function realUser() {
  return {
    id: 'real-u1',
    name: 'Real User',
    role: 'manager',
    tenantId: 'tenant-001',
    storeIds: ['store-001'],
    permissions: [],
    isDemo: false,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DemoIndicator', () => {
  describe('R2.1 — present on a demo session', () => {
    it('renders the indicator when user.isDemo is true', () => {
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      render(<DemoIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('contains text identifying the content as sample/demo data', () => {
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      render(<DemoIndicator />);
      expect(screen.getByText(/demo data/i)).toBeInTheDocument();
      expect(screen.getByText(/sample content/i)).toBeInTheDocument();
    });

    it('has aria-live="polite" so assistive tech announces it without interrupting', () => {
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      render(<DemoIndicator />);
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('carries the data-demo-indicator attribute for Playwright targeting', () => {
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      const { container } = render(<DemoIndicator />);
      expect(container.querySelector('[data-demo-indicator]')).not.toBeNull();
    });
  });

  describe('R2.2 — absent when demo mode is off', () => {
    it('renders nothing when user.isDemo is false', () => {
      mockUseSession.mockReturnValue({ user: realUser(), isLoading: false, isError: false });
      const { container } = render(<DemoIndicator />);
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders nothing when user is null (no session)', () => {
      mockUseSession.mockReturnValue({ user: null, isLoading: true, isError: false });
      const { container } = render(<DemoIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when user.isDemo is undefined', () => {
      const userWithoutFlag = { ...realUser(), isDemo: undefined };
      mockUseSession.mockReturnValue({ user: userWithoutFlag, isLoading: false, isError: false });
      const { container } = render(<DemoIndicator />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('R2.3 — toggles via session state without a page reload', () => {
    it('adds the indicator when the session changes from real to demo', () => {
      // Start: real session — indicator absent.
      mockUseSession.mockReturnValue({ user: realUser(), isLoading: false, isError: false });
      const { rerender } = render(<DemoIndicator />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      // Toggle: demo session — indicator appears without remounting the whole tree.
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      rerender(<DemoIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/demo data/i)).toBeInTheDocument();
    });

    it('removes the indicator when the session changes from demo to real', () => {
      // Start: demo session — indicator present.
      mockUseSession.mockReturnValue({ user: demoUser(), isLoading: false, isError: false });
      const { rerender } = render(<DemoIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Toggle: real session — indicator gone without a page reload.
      mockUseSession.mockReturnValue({ user: realUser(), isLoading: false, isError: false });
      rerender(<DemoIndicator />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
