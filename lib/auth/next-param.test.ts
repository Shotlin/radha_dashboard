// Feature: dashboard-production-ready, Property 18: `next` redirect targets are same-origin relative paths only

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { isSafeNextPath, safeNextOrHome } from './next-param';

/**
 * Property 18 — `next` redirect targets are same-origin relative paths only.
 *
 * For any string, `isSafeNextPath` returns true only when the value begins with a
 * single `/`, does not begin with `//` or `/\`, contains no scheme/authority
 * component or control characters, and is at most 2048 characters; and
 * `safeNextOrHome` returns the value when it is safe and the default home route
 * otherwise (including when absent).
 *
 * Validates: Requirements 7.1, 7.2, 7.3
 */

const MAX = 2048;

// Characters allowed in a same-origin relative path: printable ASCII excluding
// the control range, the backslash (which browsers may normalise to `/`), and
// excluding `/` so we can position the leading slash deliberately.
const PATH_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:@!$&\'()*+,;=%?#[] ';
const pathChar = fc.constantFrom(...PATH_CHARS.split(''));

/** A valid same-origin relative path: single leading `/`, no control chars/backslash. */
const safeRelativePath = fc
  .tuple(pathChar, fc.array(pathChar, { maxLength: 120 }))
  .map(([first, rest]) => '/' + first + rest.join(''));

/** Adversarial values that must be rejected. */
const unsafeValue = fc.oneof(
  // absolute URLs with a scheme
  fc.constantFrom(
    'https://evil.com',
    'http://evil.com/path',
    'HTTPS://EVIL.COM',
    'ftp://host/x',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>',
    'mailto:a@b.com',
    'file:///etc/passwd',
  ),
  // protocol-relative URLs
  fc.constantFrom('//evil.com', '//evil.com/path', '/\\evil.com', '/\\\\evil.com'),
  // does not begin with a slash (relative-but-not-rooted / bare host)
  fc.constantFrom('evil.com', 'foo/bar', '', ' /ok', 'a/b/c'),
  // backslashes / control characters embedded
  fc.constantFrom('/foo\\bar', '/\u0000', '/path\u0001', '/a\u001Fb', '/tab\there', '/new\nline'),
  // overlong strings (> MAX)
  fc.constant('/' + 'a'.repeat(MAX + 1)),
  fc.constant('/' + 'b'.repeat(MAX)), // exactly MAX+1 total length -> too long
);

describe('Property 18: next redirect targets are same-origin relative paths only', () => {
  it('accepts valid same-origin relative paths', () => {
    assertProperty(
      fc.property(safeRelativePath, (path) => {
        expect(isSafeNextPath(path)).toBe(true);
        // safeNextOrHome echoes a safe value verbatim
        expect(safeNextOrHome(path)).toBe(path);
      }),
    );
  });

  it('rejects adversarial / non-same-origin values', () => {
    assertProperty(
      fc.property(unsafeValue, (value) => {
        expect(isSafeNextPath(value)).toBe(false);
        // safeNextOrHome falls back to the home route for unsafe values
        expect(safeNextOrHome(value)).toBe('/');
        expect(safeNextOrHome(value, '/dashboard')).toBe('/dashboard');
      }),
    );
  });

  it('treats absent values (null/undefined) as unsafe and returns home', () => {
    assertProperty(
      fc.property(fc.constantFrom(null, undefined), (value) => {
        expect(isSafeNextPath(value)).toBe(false);
        expect(safeNextOrHome(value)).toBe('/');
      }),
    );
  });

  it('safeNextOrHome agrees with isSafeNextPath for every string (total relationship)', () => {
    assertProperty(
      fc.property(fc.oneof(fc.string(), safeRelativePath, unsafeValue), (value) => {
        const result = safeNextOrHome(value, '/home');
        if (isSafeNextPath(value)) {
          expect(result).toBe(value);
        } else {
          expect(result).toBe('/home');
        }
      }),
    );
  });

  it('rejects any string longer than 2048 characters', () => {
    assertProperty(
      fc.property(
        fc.tuple(fc.array(pathChar, { minLength: 1, maxLength: 200 }), fc.integer({ min: 1, max: 50 })),
        ([chars, extra]) => {
          const long = '/' + chars.join('').padEnd(MAX + extra, 'a');
          if (long.length > MAX) {
            expect(isSafeNextPath(long)).toBe(false);
          }
        },
      ),
    );
  });
});
