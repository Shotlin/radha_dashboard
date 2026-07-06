import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MIN_PROPERTY_RUNS, assertProperty, fc } from '@/test/property';

// Smoke test for the test tooling (Vitest + fast-check + React Testing Library).
// Verifies the jsdom environment, jest-dom matchers, the `@/` path alias, and
// the shared property helper all work. Safe to delete once real tests exist.
describe('test tooling', () => {
  it('renders a component into jsdom and finds it via jest-dom', () => {
    render(<button type="button">Scan</button>);
    expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument();
  });

  it('runs a fast-check property with the enforced minimum runs', () => {
    expect(MIN_PROPERTY_RUNS).toBe(100);
    assertProperty(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
    );
  });
});
