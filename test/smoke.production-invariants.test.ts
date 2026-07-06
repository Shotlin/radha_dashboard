// Feature: dashboard-production-ready, production-readiness smoke (R1.3,1.6,2.7,4.8,7.5,7.8)
//
// Static smoke / lint-style checks that read the actual repository source files
// (via node fs) and assert the production-readiness invariants that cannot be
// expressed as runtime unit tests. These guard against regressions in the
// structural guarantees the spec depends on:
//
//   R1.3 — exactly one demo dataset module per Feature_Area (13 areas).
//   R1.6 — no inline DEMO_* data constants in app/api route handlers.
//   R2.7 — every Demo_Data_Provider module begins with `import 'server-only'`.
//   R4.8 — the Open Food Facts image host is permitted in next.config.mjs
//          (images.remotePatterns) and the CSP `img-src`.
//   R7.5 — (dash)/layout.tsx calls getSession() before rendering children.
//   R7.8 — the session cookie is httpOnly and the auth route handlers never
//          return access/refresh tokens to the client.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Resolve the dashboard root from this test file's location so the checks work
// regardless of the process cwd.
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/** Read a file under the dashboard root as UTF-8 text. */
function readRepo(...segments: string[]): string {
  return readFileSync(join(ROOT, ...segments), 'utf8');
}

/** Recursively collect files under `dir` whose name matches `predicate`. */
function walk(dir: string, predicate: (name: string) => boolean): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, predicate));
    } else if (predicate(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Returns the first non-empty, non-comment line of a TS source file. Skips
 * blank lines, `//` line comments, and `/* ... *\/` block comments so the check
 * is robust to leading file-header docblocks.
 */
function firstCodeLine(source: string): string {
  const lines = source.split(/\r?\n/);
  let inBlock = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    if (inBlock) {
      if (line.includes('*/')) {
        inBlock = false;
        const after = line.slice(line.indexOf('*/') + 2).trim();
        if (after !== '') return after;
      }
      continue;
    }
    if (line.startsWith('//')) continue;
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) {
        inBlock = true;
        continue;
      }
      const after = line.slice(line.indexOf('*/') + 2).trim();
      if (after !== '') return after;
      continue;
    }
    return line;
  }
  return '';
}

// The 13 demoable Feature_Areas the Demo_Data_Provider must cover (R1.1, R1.3).
const FEATURE_AREAS = [
  'overview',
  'analytics',
  'audit',
  'expiry',
  'grn',
  'inventory',
  'tasks',
  'billing',
  'suppliers',
  'reports',
  'notifications',
  'settings',
  'admin',
] as const;

describe('production-readiness invariants (smoke)', () => {
  describe('R1.3 / R1.6 — demo datasets are centralized, one per area, with no inline DEMO_* data', () => {
    it('defines exactly one demo dataset module per Feature_Area (13 modules)', () => {
      const dataDir = join(ROOT, 'lib', 'demo', 'data');
      const modules = readdirSync(dataDir)
        .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
        .map((f) => f.replace(/\.ts$/, ''))
        .sort();

      expect(modules).toEqual([...FEATURE_AREAS].sort());
      expect(modules).toHaveLength(13);

      // Each module must exist and export a dataset builder wired by the registry.
      for (const area of FEATURE_AREAS) {
        const file = join(dataDir, `${area}.ts`);
        expect(existsSync(file), `missing demo dataset module for "${area}"`).toBe(true);
      }
    });

    it('wires exactly one dataset per Feature_Area in lib/demo/index.ts', () => {
      const index = readRepo('lib', 'demo', 'index.ts');
      for (const area of FEATURE_AREAS) {
        const registrations = index.match(
          new RegExp(`registerDemoDataset\\(\\s*['"]${area}['"]`, 'g'),
        );
        expect(registrations, `expected exactly one registration for "${area}"`).not.toBeNull();
        expect(registrations).toHaveLength(1);
      }
    });

    it('has no inline DEMO_* data constants in any app/api route handler (R1.6)', () => {
      const routes = walk(join(ROOT, 'app', 'api'), (name) => name === 'route.ts');
      expect(routes.length).toBeGreaterThan(0);

      // Disallow inline `const/let/var DEMO_… =` declarations. Importing the
      // `DEMO_MODE` flag from the demo-session module is allowed (it is an
      // import binding, not an inline data constant).
      const inlineDemoConst = /\b(?:const|let|var)\s+DEMO_[A-Z0-9_]+\s*=/;

      const offenders: string[] = [];
      for (const file of routes) {
        const src = readFileSync(file, 'utf8');
        if (inlineDemoConst.test(src)) {
          offenders.push(file.slice(ROOT.length + 1).replace(/\\/g, '/'));
        }
      }
      expect(offenders, `inline DEMO_* data constants found in: ${offenders.join(', ')}`).toEqual(
        [],
      );
    });
  });

  describe('R2.7 — every Demo_Data_Provider module is server-only', () => {
    it('begins each lib/demo/**/*.ts module (excluding tests) with `import \'server-only\'`', () => {
      const files = walk(
        join(ROOT, 'lib', 'demo'),
        (name) => name.endsWith('.ts') && !name.endsWith('.test.ts'),
      );
      expect(files.length).toBeGreaterThanOrEqual(15); // 13 data + index + scope + demo-session

      const offenders: string[] = [];
      for (const file of files) {
        const first = firstCodeLine(readFileSync(file, 'utf8'));
        if (!/^import\s+['"]server-only['"]/.test(first)) {
          offenders.push(file.slice(ROOT.length + 1).replace(/\\/g, '/'));
        }
      }
      expect(
        offenders,
        `these lib/demo modules do not start with import 'server-only': ${offenders.join(', ')}`,
      ).toEqual([]);
    });
  });

  describe('R4.8 — Open Food Facts image host is permitted', () => {
    const config = readRepo('next.config.mjs');

    it('allows the Open Food Facts host in images.remotePatterns', () => {
      // The remotePatterns hostname covers the OFF image hosts.
      expect(config).toMatch(/hostname:\s*['"][^'"]*openfoodfacts\.org['"]/);
    });

    it('allows the Open Food Facts host in the CSP img-src directive', () => {
      const imgSrc = config.match(/img-src[^`"]*/);
      expect(imgSrc, 'no img-src directive found in next.config.mjs CSP').not.toBeNull();
      expect(imgSrc![0]).toContain('openfoodfacts.org');
    });
  });

  describe('R7.5 — (dash) layout re-verifies the session before rendering children', () => {
    const layout = readRepo('app', '(dash)', 'layout.tsx');

    it('calls getSession() in the layout', () => {
      expect(layout).toMatch(/getSession\s*\(/);
    });

    it('calls getSession() before returning / rendering <DashShell>', () => {
      const sessionIdx = layout.search(/getSession\s*\(/);
      const shellIdx = layout.indexOf('<DashShell');

      expect(sessionIdx).toBeGreaterThanOrEqual(0);
      expect(shellIdx).toBeGreaterThanOrEqual(0);
      // getSession must be invoked before the children/shell JSX is rendered.
      // (A generic `return` scan is avoided because helper functions in the file
      // contain earlier returns; <DashShell is the actual children render site.)
      expect(sessionIdx).toBeLessThan(shellIdx);
    });
  });

  describe('R7.8 — tokens stay server-side; cookie is httpOnly; no tokens leak to the client', () => {
    it('sets the session cookie with httpOnly: true', () => {
      const session = readRepo('lib', 'auth', 'session.ts');
      expect(session).toMatch(/httpOnly:\s*true/);
    });

    it('returns only `user` (no tokens) from the demo /api/auth/me branch', () => {
      const me = readRepo('app', 'api', 'auth', 'me', 'route.ts');
      // The successful real branch returns `{ user }`.
      expect(me).toMatch(/NextResponse\.json\(\s*\{\s*user\s*\}/);
    });

    const authRoutes: Array<[string, string[]]> = [
      ['me', ['app', 'api', 'auth', 'me', 'route.ts']],
      ['refresh', ['app', 'api', 'auth', 'refresh', 'route.ts']],
      ['logout', ['app', 'api', 'auth', 'logout', 'route.ts']],
    ];

    for (const [name, segments] of authRoutes) {
      it(`does not return accessToken/refreshToken to the client in /api/auth/${name}`, () => {
        const src = readRepo(...segments);
        // No token may appear as a returned object property (`accessToken:` /
        // `refreshToken:`). Server-side property *access* such as
        // `Bearer ${session.accessToken}` (used to call the backend) is allowed
        // and is not matched by the key-colon pattern below — the tokens live
        // only in the httpOnly cookie and are never serialized to the client.
        expect(src, `accessToken returned as a field in /api/auth/${name}`).not.toMatch(
          /\baccessToken\s*:/,
        );
        expect(src, `refreshToken returned as a field in /api/auth/${name}`).not.toMatch(
          /\brefreshToken\s*:/,
        );
      });
    }
  });
});
