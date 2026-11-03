import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

async function load() {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_DESKTOP', '1');
  return import('./desktop-session');
}

describe('desktop instance binding', () => {
  it('preserves web request options without a health request', async () => {
    const { desktopRequest } = await load();
    vi.stubEnv('NEXT_PUBLIC_DESKTOP', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const options = { method: 'POST' };
    expect(await desktopRequest(options)).toBe(options);
    expect(await desktopRequest()).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('shares the handshake and preserves authorization', async () => {
    const { desktopRequest } = await load();
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ service: 'rskits-desktop', instanceId: 'owned' }),
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    const [first, second] = await Promise.all([
      desktopRequest({ headers: { Authorization: 'Bearer admin' } }),
      desktopRequest(),
    ]);
    expect(new Headers(first?.headers).get('Authorization')).toBe(
      'Bearer admin',
    );
    expect(new Headers(second?.headers).get('X-RSKITS-Instance')).toBe('owned');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    { service: 'other', instanceId: 'x' },
    { service: 'rskits-desktop' },
    { service: 'rskits-desktop', instanceId: '' },
  ])('rejects an incompatible server %j', async (payload) => {
    const { desktopRequest } = await load();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))),
    );
    await expect(desktopRequest()).rejects.toThrow('Reabra');
  });

  it('retries a failed handshake', async () => {
    const { desktopRequest } = await load();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ service: 'rskits-desktop', instanceId: 'retry' }),
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    await expect(desktopRequest()).rejects.toThrow('Reabra');
    expect(
      new Headers((await desktopRequest())?.headers).get('X-RSKITS-Instance'),
    ).toBe('retry');
  });
});
