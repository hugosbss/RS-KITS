import { describe, expect, it, vi } from 'vitest';
import * as api from './api';

const cases = [
  {
    name: 'users',
    call: () => api.fetchUsers('token'),
    path: '/users',
    method: 'GET',
  },
  {
    name: 'update user',
    call: () => api.updateUserBackend('u1', { name: 'Ana' }, 'token'),
    path: '/users/u1',
    method: 'PATCH',
    body: { name: 'Ana' },
  },
  {
    name: 'delete user',
    call: () => api.deleteUserBackend('u1', 'token'),
    path: '/users/u1',
    method: 'DELETE',
  },
  {
    name: 'events',
    call: () => api.fetchEvents('token'),
    path: '/events',
    method: 'GET',
  },
  {
    name: 'event',
    call: () => api.fetchEvent('token', 'e1'),
    path: '/events/e1',
    method: 'GET',
  },
  {
    name: 'create event',
    call: () => api.createEventBackend('token', { name: 'Corrida' }),
    path: '/events',
    method: 'POST',
    body: { name: 'Corrida' },
  },
  {
    name: 'update event',
    call: () => api.updateEventBackend('token', 'e1', { name: 'Corrida' }),
    path: '/events/e1',
    method: 'PATCH',
    body: { name: 'Corrida' },
  },
  {
    name: 'delete event',
    call: () => api.deleteEventBackend('token', 'e1'),
    path: '/events/e1',
    method: 'DELETE',
  },
  {
    name: 'organizers',
    call: () => api.fetchEventOrganizers('token', 'e1'),
    path: '/events/e1/organizers',
    method: 'GET',
  },
  {
    name: 'link organizer',
    call: () => api.addEventOrganizer('token', 'e1', 'u1'),
    path: '/events/e1/organizers',
    method: 'POST',
    body: { userId: 'u1' },
  },
  {
    name: 'unlink organizer',
    call: () => api.removeEventOrganizer('token', 'e1', 'u1'),
    path: '/events/e1/organizers/u1',
    method: 'DELETE',
  },
  {
    name: 'athletes',
    call: () => api.fetchAthletes('token', 'e1'),
    path: '/events/e1/athletes',
    method: 'GET',
  },
  {
    name: 'paginated athlete search',
    call: () =>
      api.fetchAthletes('token', 'e1', {
        search: 'Ana Silva',
        limit: 10,
        offset: 20,
      }),
    path: '/events/e1/athletes?search=Ana+Silva&limit=10&offset=20',
    method: 'GET',
  },
  {
    name: 'import athletes',
    call: () => api.importAthletesBackend('token', 'e1', [{ num: '101' }]),
    path: '/events/e1/athletes',
    method: 'POST',
    body: { athletes: [{ num: '101' }] },
  },
  {
    name: 'update athlete',
    call: () =>
      api.updateAthleteBackend('token', 'e1', 'a1', {
        statusEntrega: 'ENTREGUE',
      }),
    path: '/events/e1/athletes/a1',
    method: 'PATCH',
    body: { statusEntrega: 'ENTREGUE' },
  },
  {
    name: 'audit',
    call: () => api.postAudit('token', { acao: 'ENTREGA' }),
    path: '/audit',
    method: 'POST',
    body: { acao: 'ENTREGA' },
  },
  {
    name: 'active desktop event',
    call: () => api.fetchActiveEventId('token'),
    path: '/packages',
    method: 'GET',
  },
];
describe('frontend API contracts', () => {
  it.each(cases)(
    'sends authenticated $name request with the correct method and payload',
    async (entry) => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ activeEventId: 'e1' }),
      });
      vi.stubGlobal('fetch', fetch);
      await entry.call();
      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe(`${api.API_URL}${entry.path}`);
      expect(options.method ?? 'GET').toBe(entry.method);
      expect(options.headers.Authorization).toBe('Bearer token');
      if ('body' in entry) expect(JSON.parse(options.body)).toEqual(entry.body);
    },
  );
  it.each(cases)(
    'rejects $name failures instead of returning successful data',
    async (entry) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Falha do servidor' }),
        }),
      );
      await expect(entry.call()).rejects.toThrow();
    },
  );
  it.each([
    ['message', 'Falha específica'],
    ['array', ['Erro 1', 'Erro 2']],
    ['empty', undefined],
  ] as const)(
    'handles %s registration error details',
    async (_kind, message) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ message }),
        }),
      );
      await expect(
        api.registerUser(
          { name: 'Ana', password: 'senha', role: 'OPERATOR' },
          'token',
        ),
      ).rejects.toThrow(
        typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? 'Erro 1. Erro 2'
            : 'Não foi possível criar o usuário.',
      );
    },
  );
  it('unwraps registered users and successful login responses', async () => {
    const user = { id: 'u1', name: 'Ana' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user, access_token: 'jwt' }),
      }),
    );
    expect(
      await api.registerUser(
        { name: 'Ana', password: 'senha', role: 'OPERATOR' },
        'token',
      ),
    ).toEqual(user);
    expect(await api.login('Ana', 'senha')).toEqual({
      user,
      access_token: 'jwt',
    });
  });
  it('uses fallback messages for non-JSON failures and absent active event', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not JSON');
      },
    });
    vi.stubGlobal('fetch', fetch);
    await expect(api.login('Ana', 'senha')).rejects.toThrow(
      'Não foi possível entrar',
    );
    await expect(
      api.registerUser(
        { name: 'Ana', password: 'senha', role: 'OPERATOR' },
        'token',
      ),
    ).rejects.toThrow('Não foi possível criar');
    await expect(api.updateUserBackend('u1', {}, 'token')).rejects.toThrow(
      'Não foi possível atualizar',
    );
    await expect(api.fetchEvent('token', 'e1')).rejects.toThrow(
      'Não foi possível carregar o evento',
    );
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    expect(await api.fetchActiveEventId('token')).toBeNull();
  });
});
