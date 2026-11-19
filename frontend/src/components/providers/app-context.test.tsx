import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppStateProvider, useAppState } from './app-context';
import { Providers } from '../providers';
import * as api from '@/services/api';
import { importedAthlete, event } from '@/test/fixtures';
import { SESSION_EXPIRED_EVENT } from '@/services/session';
vi.mock('@/services/api');
const user: api.BackendUser = {
  id: 'admin',
  name: 'Admin',
  role: 'ADMIN',
  email: 'admin@example.com',
  cpf: null,
  cnpj: null,
  phone: null,
  createdAt: '',
  updatedAt: '',
};
const backendEvent: api.BackendEvent = {
  ...event,
  date: '2026-10-08T12:00:00Z',
  createdAt: '',
  updatedAt: '',
};
const backendAthlete: api.BackendAthlete = {
  ...importedAthlete,
  eventId: event.id,
  distancia: '5 KM',
  nascimento: '1990-02-01T12:00:00Z',
  pin: '1234',
  contato: null,
  grauParentesco: null,
  celularContato: null,
  itensAdicionais: null,
  createdAt: '',
  updatedAt: '',
};
beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.login)
    .mockReset()
    .mockResolvedValue({ access_token: 'desktop-token', user });
  vi.mocked(api.fetchUsers).mockReset().mockResolvedValue([user]);
  vi.mocked(api.fetchEvents).mockReset().mockResolvedValue([backendEvent]);
  vi.mocked(api.fetchActiveEventId).mockReset().mockResolvedValue(event.id);
  vi.mocked(api.fetchAthletes)
    .mockReset()
    .mockResolvedValue({ athletes: [backendAthlete], total: 1 });
  vi.mocked(api.registerUser).mockResolvedValue({
    ...user,
    id: 'op',
    role: 'OPERATOR',
  });
  vi.mocked(api.updateUserBackend).mockResolvedValue({
    ...user,
    name: 'Renamed',
  });
  vi.mocked(api.createEventBackend).mockResolvedValue({
    ...backendEvent,
    id: 'new-event',
  });
  vi.mocked(api.updateAthleteBackend).mockResolvedValue({
    ...backendAthlete,
    statusEntrega: 'ENTREGUE',
  });
});
async function signedIn() {
  const hook = renderHook(() => useAppState(), { wrapper: AppStateProvider });
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true));
  await act(async () => {
    await hook.result.current.login('admin@example.com', 'secret');
  });
  await waitFor(() =>
    expect(hook.result.current.athletesByEvent[event.id]?.length).toBe(1),
  );
  return hook;
}
describe('application state and provider composition', () => {
  it('requires a provider and hydrates an empty local profile', async () => {
    expect(() => renderHook(() => useAppState())).toThrow(/AppStateProvider/);
    const { result } = renderHook(() => useAppState(), { wrapper: Providers });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
  });
  it('restores the saved profile and rejects an expired JWT', async () => {
    localStorage.setItem(
      'rs-kits-frontend-state',
      JSON.stringify({
        events: [event],
        selectedEventId: event.id,
        athletesByEvent: { [event.id]: [importedAthlete] },
      }),
    );
    localStorage.setItem(
      'rs-kits-auth',
      JSON.stringify({
        token: `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`,
        user,
      }),
    );
    const { result } = renderHook(() => useAppState(), {
      wrapper: AppStateProvider,
    });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.selectedEvent?.id).toBe(event.id);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('rs-kits-auth')).toBeNull();
  });
  it('handles malformed local storage without crashing', async () => {
    localStorage.setItem('rs-kits-frontend-state', 'broken');
    localStorage.setItem('rs-kits-auth', 'broken');
    const { result } = renderHook(() => useAppState(), {
      wrapper: AppStateProvider,
    });
    await waitFor(() => expect(result.current.sessionExpired).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
  });
  it('loads actual backend identities and respects the desktop active event', async () => {
    const { result } = await signedIn();
    expect(result.current.currentUser.name).toBe('Admin');
    expect(result.current.selectedEventId).toBe(event.id);
    expect(result.current.athletesByEvent[event.id][0]).toMatchObject({
      nomeAtleta: 'Ana Silva',
      modalidade: '5 KM',
    });
    expect(JSON.parse(localStorage.getItem('rs-kits-auth')!).token).toBe(
      'desktop-token',
    );
  });
  it('ignores old request failures but clears the current session on 401', async () => {
    const { result } = await signedIn();
    act(() =>
      window.dispatchEvent(
        new CustomEvent(SESSION_EXPIRED_EVENT, { detail: 'old-token' }),
      ),
    );
    expect(result.current.isAuthenticated).toBe(true);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(SESSION_EXPIRED_EVENT, { detail: 'desktop-token' }),
      ),
    );
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.athletesByEvent[event.id]).toHaveLength(1);
  });
  it('persists user creation, updates and deletion using the current token', async () => {
    const { result } = await signedIn();
    await act(async () => {
      await result.current.createUser({
        name: 'Operator',
        role: 'OPERADOR',
        password: 'secret',
        organizerId: 'org',
        accessCode: 'CODE',
      });
    });
    expect(api.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'OPERATOR', organizerId: 'org' }),
      'desktop-token',
    );
    await act(async () => {
      await result.current.updateUser('op', {
        name: 'Renamed',
        password: 'new',
        organizerId: 'org2',
      });
    });
    expect(api.updateUserBackend).toHaveBeenCalledWith(
      'op',
      expect.objectContaining({ organizerId: 'org2' }),
      'desktop-token',
    );
    await act(async () => {
      await result.current.deleteUser('op');
    });
    expect(
      result.current.users.find((item) => item.id === 'op'),
    ).toBeUndefined();
  });
  it('creates, edits and removes events after successful API responses', async () => {
    const { result } = await signedIn();
    await act(async () => {
      await result.current.createEvent({
        name: 'New Race',
        date: '2026-10-08',
        place: 'Bauru/SP',
      });
    });
    expect(api.createEventBackend).toHaveBeenCalledWith(
      'desktop-token',
      expect.objectContaining({ name: 'New Race', status: 'PROXIMO' }),
    );
    await act(async () => {
      await result.current.updateEvent('new-event', {
        name: 'Renamed',
        date: '09/10/2026',
        place: 'Campinas/SP',
      });
    });
    expect(api.updateEventBackend).toHaveBeenCalledWith(
      'desktop-token',
      'new-event',
      expect.objectContaining({ name: 'Renamed' }),
    );
    await act(async () => {
      await result.current.deleteEvent('new-event');
    });
    expect(
      result.current.events.find((item) => item.id === 'new-event'),
    ).toBeUndefined();
  });
  it('imports athletes and translates delivery field names for updates', async () => {
    const { result } = await signedIn();
    await act(async () => {
      await result.current.importAthletes([
        {
          ...importedAthlete,
          contato: 'Contato',
          grauParentesco: 'Pai',
          celularContato: '1199',
          itensAdicionais: 'Boné',
        },
      ]);
    });
    expect(api.importAthletesBackend).toHaveBeenCalledWith(
      'desktop-token',
      event.id,
      [expect.objectContaining({ distancia: '5 KM', contato: 'Contato' })],
    );
    await act(async () => {
      await result.current.updateAthlete(importedAthlete.id, {
        statusEntrega: 'ENTREGUE',
        modalidade: '10 KM',
        emailEntrega: null,
        ignored: undefined,
      });
    });
    expect(api.updateAthleteBackend).toHaveBeenCalledWith(
      'desktop-token',
      event.id,
      importedAthlete.id,
      expect.objectContaining({
        distancia: '10 KM',
        statusEntrega: 'ENTREGUE',
      }),
    );
    expect(result.current.athletesByEvent[event.id][0].statusEntrega).toBe(
      'ENTREGUE',
    );
  });
  it('propagates user/event failures instead of reporting a false success', async () => {
    const { result } = await signedIn();
    vi.mocked(api.deleteUserBackend).mockRejectedValueOnce(
      new Error('blocked'),
    );
    await act(async () => {
      await expect(result.current.deleteUser('admin')).rejects.toThrow(
        'blocked',
      );
    });
    expect(result.current.users).toHaveLength(1);
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('rs-kits-auth')).toBeNull();
  });
  it('does not acknowledge failed backend edits or modify the persisted athlete cache', async () => {
    const { result } = await signedIn();
    const previousStatus =
      result.current.athletesByEvent[event.id][0].statusEntrega;
    vi.mocked(api.updateAthleteBackend).mockRejectedValueOnce(
      new Error('Banco indisponível'),
    );
    await act(async () => {
      await expect(
        result.current.updateAthlete(importedAthlete.id, {
          statusEntrega: 'ESTORNADO',
        }),
      ).rejects.toThrow('Banco indisponível');
    });
    expect(result.current.athletesByEvent[event.id][0].statusEntrega).toBe(
      previousStatus,
    );
  });
  it('supports isolated local edits when no backend session exists', async () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: AppStateProvider,
    });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    let id = '';
    await act(async () => {
      id = (await result.current.createUser({ name: 'Local', role: 'ADMIN' }))
        .id;
    });
    act(() => result.current.setCurrentUserId(id));
    await act(async () => {
      await result.current.updateUser(id, { name: 'Local Updated' });
    });
    expect(result.current.currentUser.name).toBe('Local Updated');
    await act(async () => {
      await result.current.createEvent({
        name: 'Local Race',
        date: '',
        place: '',
      });
    });
    await act(async () => {
      await result.current.importAthletes([importedAthlete]);
    });
    await act(async () => {
      await result.current.updateAthlete(importedAthlete.id, {
        statusEntrega: 'ESTORNADO',
        alerta: null,
      });
    });
    expect(
      result.current.athletesByEvent[result.current.selectedEventId!][0]
        .statusEntrega,
    ).toBe('ESTORNADO');
    await act(async () => {
      await result.current.importAthletes([
        importedAthlete,
        {
          ...importedAthlete,
          id: 'new-athlete',
          num: '102',
          cpfAtleta: '98765432100',
        },
      ]);
    });
    expect(
      result.current.athletesByEvent[result.current.selectedEventId!],
    ).toHaveLength(2);
    expect(
      result.current.athletesByEvent[result.current.selectedEventId!][0]
        .statusEntrega,
    ).toBe('ESTORNADO');
    await act(async () => {
      await result.current.updateEvent(result.current.selectedEventId!, {
        name: 'Local renamed',
      });
    });
    await act(async () => {
      await result.current.deleteEvent(result.current.selectedEventId!);
      await result.current.deleteUser(id);
    });
    expect(result.current.events).toHaveLength(0);
  });
});
