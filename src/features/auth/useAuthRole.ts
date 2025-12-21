'use client';

import { useMemo } from 'react';
import type { Role } from './roles';

function parseRole(input: string | null | undefined): Role | undefined {
  if (!input) return undefined;
  const v = input.trim();
  if (v === 'admin' || v === 'operator' || v === 'viewer') return v;
  return undefined;
}

function getCookieValue(cookie: string | null | undefined, name: string): string | undefined {
  if (!cookie) return undefined;
  const parts = cookie.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return undefined;
}

/**
 * Client-side role resolver ("login state").
 * Priority: cookie `oc_role` -> localStorage `oc_role`.
 * Safe default: viewer.
 */
export function useAuthRole(defaultRole: Role = 'viewer'): Role {
  return useMemo(() => {
    try {
      const fromCookie = parseRole(getCookieValue(document.cookie, 'oc_role'));
      if (fromCookie) return fromCookie;

      const fromStorage = parseRole(localStorage.getItem('oc_role'));
      if (fromStorage) return fromStorage;
    } catch {
      // ignore
    }

    return defaultRole;
  }, [defaultRole]);
}
