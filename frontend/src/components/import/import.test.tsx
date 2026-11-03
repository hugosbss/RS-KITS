import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { ImportShell } from './import';
import { appState, organizer, importedAthlete, event } from '@/test/fixtures';
let state = appState();
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => state,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/import' }));
vi.mock('@/services/navigation');
const file = (csv: string, name = 'athletes.csv') =>
  ({
    name,
    arrayBuffer: async () => new TextEncoder().encode(csv).buffer,
  }) as File;
beforeEach(() => {
  state = appState();
});
describe('athlete import screen', () => {
  it('previews valid data, persists it and shows import errors for retry', async () => {
    state = appState({ athletesByEvent: {} });
    const { container } = render(<ImportShell />);
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [file('Num;Nome atleta;CPF Atleta\n101;Ana Silva;12345678901')],
      },
    });
    const button = await screen.findByRole('button', {
      name: 'CONFIRMAR IMPORTAÇÃO DE 1 ATLETAS',
    });
    await waitFor(() => expect(button).toBeEnabled());
    vi.mocked(state.importAthletes).mockRejectedValueOnce(
      new Error('Falha no servidor'),
    );
    fireEvent.click(button);
    expect(await screen.findByText('Falha no servidor')).toBeInTheDocument();
    fireEvent.click(button);
    expect(
      await screen.findByText(/1 novo\(s\) atleta\(s\) importado/),
    ).toBeInTheDocument();
    expect(state.importAthletes).toHaveBeenCalledWith([
      expect.objectContaining({
        num: '101',
        nomeAtleta: 'Ana Silva',
        nomeEvento: state.selectedEvent!.name,
      }),
    ]);
  });
  it('reports an existing athlete and does not send the same spreadsheet again', async () => {
    const { container } = render(<ImportShell />);
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [
          file('Num;Nome atleta;CPF Atleta\n101;Ana Silva;123.456.789-01'),
        ],
      },
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      '1 atleta(s) já cadastrado(s)',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'CONFIRMAR IMPORTAÇÃO DE 1 ATLETAS' }),
    );
    expect(
      await screen.findByText(/Nenhum novo atleta foi importado/),
    ).toBeInTheDocument();
    expect(state.importAthletes).not.toHaveBeenCalled();
  });
  it('imports only new athletes from a mixed spreadsheet', async () => {
    const { container } = render(<ImportShell />);
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [
          file(
            'Num;Nome atleta;CPF Atleta\n101;Ana Silva;12345678901\n102;Bruno;98765432100',
          ),
        ],
      },
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      '1 novo(s) atleta(s) para importar',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'CONFIRMAR IMPORTAÇÃO DE 2 ATLETAS' }),
    );
    expect(
      await screen.findByText(
        /1 atleta\(s\) já cadastrado\(s\) no evento foram ignorados/,
      ),
    ).toBeInTheDocument();
    expect(state.importAthletes).toHaveBeenCalledWith([
      expect.objectContaining({ num: '102', nomeAtleta: 'Bruno' }),
    ]);
  });
  it('allows the same athlete in another event', async () => {
    state = appState({
      selectedEvent: { ...event, id: 'event2', name: 'Outro Evento' },
      selectedEventId: 'event2',
      athletesByEvent: { [event.id]: [importedAthlete] },
    });
    const { container } = render(<ImportShell />);
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [file('Num;Nome atleta;CPF Atleta\n101;Ana Silva;12345678901')],
      },
    });
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'CONFIRMAR IMPORTAÇÃO DE 1 ATLETAS',
      }),
    );
    await waitFor(() =>
      expect(state.importAthletes).toHaveBeenCalledWith([
        expect.objectContaining({ num: '101', nomeEvento: 'Outro Evento' }),
      ]),
    );
    expect(screen.queryByText(/já cadastrado/)).not.toBeInTheDocument();
  });
  it('blocks duplicate identities before sending any data', async () => {
    const { container } = render(<ImportShell />);
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: {
        files: [
          file(
            'Num;Nome atleta;CPF Atleta\n101;Ana;12345678901\n101;Ana;12345678901',
          ),
        ],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/duplicado/);
    expect(
      screen.getByRole('button', { name: 'CONFIRMAR IMPORTAÇÃO DE 2 ATLETAS' }),
    ).toBeDisabled();
    expect(state.importAthletes).not.toHaveBeenCalled();
  });
  it('handles dropped invalid/unsupported sheets without stale preview data', async () => {
    const { container } = render(<ImportShell />);
    const zone = screen.getByText(/Clique aqui/).parentElement!;
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, {
      dataTransfer: { files: [file('invalid', 'unsupported.txt')] },
    });
    expect(
      await screen.findByText('Selecione um arquivo CSV, XLS ou XLSX.'),
    ).toBeInTheDocument();
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [file('Num;Nome atleta')] },
    });
    expect(await screen.findByText(/vazia/)).toBeInTheDocument();
  });
  it('does not import without an event and denies access to an organizer', () => {
    state = appState({ selectedEvent: null });
    const { rerender } = render(<ImportShell />);
    expect(
      screen.getByRole('button', { name: /CONFIRMAR IMPORTAÇÃO/ }),
    ).toBeDisabled();
    state = appState({ currentUser: organizer });
    rerender(<ImportShell />);
    expect(
      screen.getByRole('heading', { name: 'Acesso restrito' }),
    ).toBeInTheDocument();
  });
  it('downloads a spreadsheet template and generates a backup', () => {
    vi.useFakeTimers();
    const create = vi.fn().mockReturnValue('blob:test');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: create,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<ImportShell />);
    fireEvent.click(screen.getByRole('button', { name: /Baixar Modelo/ }));
    expect(create).toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'GERAR E BAIXAR BACKUP DO BANCO' }),
    );
    expect(
      screen.getByRole('button', { name: 'Gerando Backup JSON...' }),
    ).toBeDisabled();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/Backup gerado com sucesso/)).toBeInTheDocument();
    expect(click).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
