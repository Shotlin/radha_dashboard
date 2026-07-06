/**
 * lib/api/clients/auth.ts — Auth endpoints (Doc 1 §4)
 * Note: login/logout/refresh are handled by Route Handlers (lib/auth/session.ts).
 * This client covers auxiliary auth endpoints called server-side.
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { UserMeSchema } from '../schemas/common';

export async function getMe() {
  return apiFetch('/auth/me', { schema: UserMeSchema });
}

export async function listAdminInvitations() {
  return apiFetch('/auth/admin/invitations', {
    schema: z.object({
      invitations: z.array(z.object({
        id: z.string(),
        email: z.string(),
        status: z.string(),
        createdAt: z.string(),
      })),
    }),
  });
}

export async function sendAdminInvitation(data: { email: string; role: string }) {
  return apiFetch('/auth/admin/invitations', {
    method: 'POST',
    body: data,
    schema: z.object({ id: z.string(), email: z.string() }),
  });
}
