import { desktopRequest } from './desktop-session';

export const SESSION_EXPIRED_EVENT = 'rs-kits:session-expired';

/** Desktop uses an opaque local token; only JWTs carry an expiration. */
export function tokenExpiresAt(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    );
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : 0;
  } catch {
    return 0;
  }
}

export function tokenIsExpired(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt <= now;
}

export function safeReturnPath(path: string | null): string {
  if (!path?.startsWith('/') || path.includes('\\')) return '/dashboard';
  try {
    const url = new URL(path, 'https://rskits.local');
    if (
      url.origin !== 'https://rskits.local' ||
      /^\/login\/?$/.test(url.pathname)
    )
      return '/dashboard';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/dashboard';
  }
}

/** Notify only about the token used by this request, avoiding stale 401s. */
export async function sessionFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const options = await desktopRequest(init);
  const response = await fetch(input, options);
  const authorization = new Headers(options?.headers).get('Authorization');
  if (
    response.status === 401 &&
    authorization?.startsWith('Bearer ') &&
    typeof window !== 'undefined'
  ) {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: authorization.slice(7),
      }),
    );
  }
  return response;
}
