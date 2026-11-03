import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadsShell } from './downloads';
const mocks = vi.hoisted(() => ({
  state: {
    currentUser: { role: 'ADMIN' },
    events: [{ id: 'event1', name: 'Race' }],
    token: 'token',
  },
  fetchDownloads: vi.fn(),
  fetchExecutable: vi.fn(),
  downloadBlob: vi.fn(),
}));
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => mocks.state,
}));
vi.mock('@/services/api', () => ({
  fetchDownloads: mocks.fetchDownloads,
  fetchExecutable: mocks.fetchExecutable,
}));
vi.mock('@/services/distribution', () => ({
  downloadBlob: mocks.downloadBlob,
  sanitizePart: (value: string) => value,
}));
beforeEach(() => {
  mocks.fetchDownloads
    .mockReset()
    .mockResolvedValue([
      { platform: 'windows', file: 'app.exe', supportsEmbeddedData: true },
    ]);
  mocks.fetchExecutable.mockReset().mockResolvedValue(new Blob(['exe']));
  mocks.downloadBlob.mockReset();
  mocks.state.currentUser.role = 'ADMIN';
  window.history.replaceState({}, '', '/downloads');
});
describe('executable downloads', () => {
  it('downloads a clean executable', async () => {
    render(<DownloadsShell />);
    const button = screen.getByRole('button', {
      name: 'Baixar executável limpo',
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(mocks.fetchExecutable).toHaveBeenCalledWith(
      'app.exe',
      'token',
      undefined,
    );
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      'RS-KITS-limpo.exe',
    );
  });
  it('requires an event and embeds the selected event', async () => {
    render(<DownloadsShell />);
    const button = screen.getByRole('button', {
      name: 'Baixar executável com evento',
    });
    expect(button).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'event1');
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(mocks.fetchExecutable).toHaveBeenCalledWith(
      'app.exe',
      'token',
      'event1',
    );
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      'RS-KITS-Race.exe',
    );
  });
  it('uses the event selected from Events', async () => {
    window.history.replaceState({}, '', '/downloads?evento=event1');
    render(<DownloadsShell />);
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('event1'),
    );
  });
  it('blocks old builds and allows retrying the version list', async () => {
    mocks.fetchDownloads.mockResolvedValue([]);
    render(<DownloadsShell />);
    expect(
      await screen.findByText(/Nenhuma versão Windows compatível/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Baixar executável limpo' }),
    ).toBeDisabled();
    mocks.fetchDownloads.mockResolvedValue([
      { platform: 'windows', file: 'new.exe', supportsEmbeddedData: true },
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Baixar executável limpo' }),
      ).toBeEnabled(),
    );
  });
  it('shows errors without triggering a broken download', async () => {
    mocks.fetchExecutable.mockRejectedValue(new Error('Download failed'));
    render(<DownloadsShell />);
    const button = screen.getByRole('button', {
      name: 'Baixar executável limpo',
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Download failed',
    );
    expect(mocks.downloadBlob).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
  });
  it('denies downloads to an organizer without requesting files', () => {
    mocks.state.currentUser.role = 'ORGANIZADOR';
    render(<DownloadsShell />);
    expect(
      screen.queryByRole('button', { name: 'Baixar executável com evento' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Baixar executável limpo' }),
    ).not.toBeInTheDocument();
    expect(mocks.fetchDownloads).not.toHaveBeenCalled();
  });
  it('denies the downloads screen to an operator', () => {
    mocks.state.currentUser.role = 'OPERADOR';
    render(<DownloadsShell />);
    expect(
      screen.queryByRole('button', { name: 'Baixar executável limpo' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Acesso restrito/)).toBeInTheDocument();
  });
});
