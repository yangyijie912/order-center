import type { Role } from './types';

function parseRole(input: string | null | undefined): Role | undefined {
  if (!input) return undefined;
  const v = input.trim();
  if (v === 'admin' || v === 'operator' || v === 'viewer') return v;
  return undefined;
}

function getCookieValue(cookie: string | null | undefined, name: string): string | undefined {
  if (!cookie) return undefined;
  // naive but sufficient cookie parsing for this project
  const parts = cookie.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return undefined;
}

/**
 * Server-side role resolver.
 * Priority: cookie `oc_role` (login/session) -> request header `x-role`.
 * Safe default: `viewer` should be applied by the caller when missing.
 */
export function getRoleFromRequest(req: Request): Role | undefined {
  const fromCookie = parseRole(getCookieValue(req.headers.get('cookie'), 'oc_role'));
  if (fromCookie) return fromCookie;

  const fromHeader = parseRole(req.headers.get('x-role'));
  if (fromHeader) return fromHeader;

  return undefined;
}
