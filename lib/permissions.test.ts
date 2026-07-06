// Feature: dashboard-production-ready, Property 19: Admin routes admit only owner and admin roles

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { isAdminRole, type Role } from './permissions';

/**
 * Property 19 — Admin routes admit only owner and admin roles.
 *
 * For any session role, the admin-route gate decision (`isAdminRole`) is `allow`
 * if and only if the role is `owner` or `admin`; every other role (and any
 * invalid/unknown role string, `null`, or `undefined`) is denied — the callers
 * redirect those to `/403` with no admin data rendered first.
 *
 * Validates: Requirements 7.4
 */

/** Every defined role in the system (mirrors Doc 1 §5.1). */
const ALL_ROLES: Role[] = ['owner', 'admin', 'manager', 'staff', 'auditor'];
const ADMIN_ROLES: Role[] = ['owner', 'admin'];

const knownRole = fc.constantFrom<Role>(...ALL_ROLES);

describe('Property 19: admin routes admit only owner and admin roles', () => {
  it('admits exactly owner and admin among the known roles', () => {
    assertProperty(
      fc.property(knownRole, (role) => {
        expect(isAdminRole(role)).toBe(ADMIN_ROLES.includes(role));
      }),
    );
  });

  it('admits a role iff it is exactly "owner" or "admin" (for arbitrary strings)', () => {
    assertProperty(
      // Mix known roles, arbitrary strings, and near-miss variants so the
      // "if and only if" holds across the whole input space, not just the enum.
      fc.property(
        fc.oneof(
          knownRole,
          fc.string(),
          fc.constantFrom('Owner', 'ADMIN', 'admin ', ' owner', 'administrator', 'superadmin', ''),
        ),
        (role) => {
          const admitted = isAdminRole(role);
          const expected = role === 'owner' || role === 'admin';
          expect(admitted).toBe(expected);
        },
      ),
    );
  });

  it('denies non-admin known roles', () => {
    const nonAdmin = ALL_ROLES.filter((r) => !ADMIN_ROLES.includes(r));
    assertProperty(
      fc.property(fc.constantFrom(...nonAdmin), (role) => {
        expect(isAdminRole(role)).toBe(false);
      }),
    );
  });

  it('treats absent role claims (null/undefined) as non-admin', () => {
    assertProperty(
      fc.property(fc.constantFrom(null, undefined), (role) => {
        expect(isAdminRole(role)).toBe(false);
      }),
    );
  });
});
