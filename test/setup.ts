// Vitest global setup: registers jest-dom matchers and cleans up the DOM
// rendered by React Testing Library between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
