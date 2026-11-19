import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { appState, importedAthlete, event } from '@/test/fixtures';
import { ReportShell } from './reports';
import { downloadCSV } from './export-utils';

let state = appState();
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => state,
}));
vi.mock('./export-utils', () => ({ downloadCSV: vi.fn() }));
beforeEach(() => {
  state = appState();
  vi.mocked(downloadCSV).mockClear();
});
function upload(content: string) {
  const file = new File([content], 'atualizacoes.csv', { type: 'text/csv' });
  Object.defineProperty(file, 'text', { value: async () => content });
  fireEvent.change(screen.getByLabelText('Importar atualizações'), {
    target: { files: [file] },
  });
}
describe('report workflows', () => {
  it('imports before/after changes, ignores empty fields and reports unmatched/unchanged athletes', async () => {
    const apply = vi.fn();
    render(<ReportShell onApplyAthleteUpdates={apply} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Excel Modelo e Exportação' }),
    );
    upload(
      'NUM;Equipe;Nome Atleta;Ignorada\n101;Equipe Nova;;abc\n101;Equipe Nova;;\n999;Equipe Ausente;;',
    );
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith([
        {
          athleteNum: importedAthlete.num,
          athleteCpf: importedAthlete.cpfAtleta,
          fields: [
            {
              field: 'equipe',
              before: importedAthlete.equipe,
              after: 'Equipe Nova',
            },
          ],
        },
      ]),
    );
    expect(
      screen.getByText('Atletas atualizados:').parentElement,
    ).toHaveTextContent('1');
    expect(screen.getByText('Sem mudança:').parentElement).toHaveTextContent(
      '1',
    );
    expect(
      screen.getByText('Não localizados:').parentElement,
    ).toHaveTextContent('1');
    fireEvent.click(
      screen.getByRole('button', { name: /Exportar 1 atualizações/ }),
    );
    expect(downloadCSV).toHaveBeenCalledWith(
      'Modelo_Atualizacao_Atletas.csv',
      expect.any(Array),
      expect.arrayContaining([expect.arrayContaining(['Equipe Nova'])]),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Relatórios de Alterações/ }),
    );
    expect(screen.getByText('Equipe Nova')).toBeInTheDocument();
    expect(screen.getByText(importedAthlete.equipe)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Exportar para Excel/ }),
    );
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'Relatorio_Alteracoes_Agrupado.csv',
      expect.any(Array),
      [expect.arrayContaining([importedAthlete.equipe, 'Equipe Nova'])],
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Excel - Modelo Exportação' }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Baixar Modelo/ }));
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'Relatorio_Modelo_Exportacao_Alterados.csv',
      expect.any(Array),
      [expect.arrayContaining(['Ana Silva', 'Equipe Nova'])],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Excel - Dados Full' }));
    fireEvent.click(screen.getByRole('button', { name: /Baixar Planilha/ }));
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'Relatorio_Dados_Full.csv',
      expect.any(Array),
      [expect.arrayContaining(['Ana Silva', 'PENDENTE'])],
    );
  });
  it('matches CPF despite punctuation and allows customizing the relation columns', async () => {
    const apply = vi.fn();
    render(<ReportShell onApplyAthleteUpdates={apply} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Excel Modelo e Exportação' }),
    );
    upload('CPF,Equipe\n123.456.789-01,Outra Equipe');
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith([
        expect.objectContaining({ athleteNum: '101' }),
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Relação de Entrega' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório' }));
    fireEvent.click(screen.getByRole('button', { name: /Exportar relação/ }));
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'Relacao_de_Entrega.csv',
      expect.not.arrayContaining(['NUM']),
      [expect.arrayContaining(['Ana Silva', 'Outra Equipe'].slice(0, 1))],
    );
  });
  it.each([
    ['NUM', 'A planilha precisa conter cabeçalho e ao menos uma atualização.'],
    [
      'Equipe\nNova equipe',
      'Inclua a coluna NUM ou CPF Atleta para identificar cada atleta.',
    ],
  ])(
    'rejects malformed or unidentified update sheets (%s)',
    async (content, message) => {
      const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const apply = vi.fn();
      render(<ReportShell onApplyAthleteUpdates={apply} />);
      fireEvent.click(
        screen.getByRole('button', { name: 'Excel Modelo e Exportação' }),
      );
      upload(content);
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(alert).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
      expect(screen.queryByText('Importando...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Atletas atualizados:'),
      ).not.toBeInTheDocument();

      upload('NUM;Equipe\n101;Equipe Nova');
      await waitFor(() => expect(apply).toHaveBeenCalledOnce());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(
        screen.getByText('Atletas atualizados:').parentElement,
      ).toHaveTextContent('1');
    },
  );
  it('exports an empty event without leaking athletes from other events', () => {
    state = appState({
      selectedEvent: null,
      selectedEventId: null,
      athletesByEvent: { [event.id]: [importedAthlete] },
    });
    render(<ReportShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Excel - Dados Full' }));
    fireEvent.click(screen.getByRole('button', { name: /Baixar Planilha/ }));
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'Relatorio_Dados_Full.csv',
      expect.any(Array),
      [],
    );
  });
});
