import { describe, it, expect, vi } from 'vitest';
import {
  tokenExpiresAt,
  tokenIsExpired,
  safeReturnPath,
  sessionFetch,
  SESSION_EXPIRED_EVENT,
} from './session';
const jwt = (payload: object) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;
describe('session expiration', () => {
  it('keeps opaque desktop tokens and checks JWT expiration at the boundary', () => {
    expect(tokenExpiresAt('local-user-id')).toBeNull();
    expect(tokenIsExpired('local-user-id')).toBe(false);
    expect(tokenExpiresAt(jwt({ exp: 10 }))).toBe(10000);
    expect(tokenIsExpired(jwt({ exp: 10 }), 9999)).toBe(false);
    expect(tokenIsExpired(jwt({ exp: 10 }), 10000)).toBe(true);
  });
  it.each(['a.invalid.c', jwt({}), jwt({ exp: '10' })])(
    'rejects malformed JWT %s',
    (token) => {
      expect(tokenIsExpired(token)).toBe(true);
    },
  );
  it.each([
    'https://evil.test',
    '//evil.test',
    '/login',
    '/login/',
    null,
    '/\\evil.test',
  ])('rejects unsafe return path %s', (path) => {
    expect(safeReturnPath(path)).toBe('/dashboard');
  });
  it('preserves an internal route, query and anchor', () => {
    expect(safeReturnPath('/events?evento=1#details')).toBe(
      '/events?evento=1#details',
    );
  });
  it('announces the original token on authenticated 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    await sessionFetch('/api/events', {
      headers: { Authorization: 'Bearer old-token' },
    });
    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe('old-token');
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });
  it.each([200, 403, 500])(
    'does not expire the session for status %s',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(null, { status })),
      );
      const dispatch = vi.spyOn(window, 'dispatchEvent');
      await sessionFetch('/api/events', {
        headers: { Authorization: 'Bearer token' },
      });
      expect(dispatch).not.toHaveBeenCalled();
    },
  );
  it('does not expire on login failure or network error', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetch);
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    await sessionFetch('/api/auth/login');
    await expect(sessionFetch('/api/events')).rejects.toThrow('offline');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
