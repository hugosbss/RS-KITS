import { describe, it, expect, vi } from 'vitest';
import { fetchExecutable, fetchDownloads, login } from './api';
describe('desktop downloads API', () => {
  it('requests a clean executable without event data', async () => {
    const blob = new Blob(['exe']);
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal('fetch', fetch);
    expect(await fetchExecutable('RS KITS.exe', null)).toBe(blob);
    expect(fetch.mock.calls[0][0]).toMatch(/RS%20KITS.exe\/clean$/);
  });
  it('uses the selected event and current credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: async () => new Blob() });
    vi.stubGlobal('fetch', fetch);
    await fetchExecutable('app.exe', 'token', 'event/1');
    expect(fetch.mock.calls[0][0]).toMatch(/events\/event%2F1$/);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  });
  it('shows the backend error when the executable is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Publish a new build' }),
      }),
    );
    await expect(fetchExecutable('old.exe', null)).rejects.toThrow(
      'Publish a new build',
    );
    await expect(fetchDownloads()).rejects.toThrow();
  });
  it('sends credentials and surfaces invalid login errors', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: ['Invalid credentials'] }),
    });
    vi.stubGlobal('fetch', fetch);
    await expect(login('org@example.com', 'wrong')).rejects.toThrow(
      'Invalid credentials',
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      identifier: 'org@example.com',
      password: 'wrong',
    });
  });
});
