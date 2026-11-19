import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { reportAthlete } from '@/test/fixtures';
import { REPORT_FIELDS, type ReportFieldKey } from './types';
import { AuditStaticTab } from './audit-static-tab';
import { AuditFullTab } from './audit-full-tab';
import { AuditModelExportTab } from './audit-model-export-tab';
import { ModeloAtualizacaoTab } from './modelo-atualizacao-tab';
import { RelacaoEntregaTab } from './relacao-entrega-tab';

describe('audit reports', () => {
  it('shows before/after values and exports or prints the audit trail', () => {
    const exportFile = vi.fn(),
      print = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <AuditStaticTab
        logs={[
          {
            id: 'log',
            timestamp: '08/10/2026',
            usuario: 'Operador',
            numAtleta: '101',
            nomeAtleta: 'Ana',
            campoAlterado: 'equipe',
            valorAnterior: 'Azul',
            valorNovo: 'Verde',
            ipOuDispositivo: 'Desktop',
          },
        ]}
        onExportAgrupado={exportFile}
      />,
    );
    expect(screen.getByText('Azul')).toBeInTheDocument();
    expect(screen.getByText('Verde')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Exportar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Imprimir/ }));
    expect(exportFile).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
  });
  it('exports full athlete fields with delivery and reversal information', () => {
    const exportFile = vi.fn();
    render(
      <AuditFullTab
        athletes={[
          {
            ...reportAthlete,
            statusEntrega: 'ENTREGUE',
            dataEntrega: '08/10/2026',
            usuarioEntrega: 'Operador',
            dataEstorno: '07/10/2026',
            usuarioEstorno: 'Admin',
          },
        ]}
        onExportFull={exportFile}
      />,
    );
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Operador')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Baixar/ }));
    expect(exportFile).toHaveBeenCalledOnce();
  });
  it('limits the export model to changed athletes', () => {
    const exportFile = vi.fn();
    render(
      <AuditModelExportTab
        athletes={[
          reportAthlete,
          {
            ...reportAthlete,
            num: '102',
            nomeAtleta: 'Sem Alterações',
            foiAlterado: false,
          },
        ]}
        onExportModel={exportFile}
      />,
    );
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.queryByText('Sem Alterações')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Baixar/ }));
    expect(exportFile).toHaveBeenCalledOnce();
  });
});
describe('configurable report models', () => {
  it('edits destination headers, toggles fields and imports/exports updates', () => {
    const props = {
      updateModelFields: ['num'] as ReportFieldKey[],
      setUpdateModelFields: vi.fn(),
      updateModelHeaders: Object.fromEntries(
        REPORT_FIELDS.map((field) => [field.key, field.label]),
      ) as Record<ReportFieldKey, string>,
      setUpdateModelHeaders: vi.fn(),
      reportAthletes: [reportAthlete],
      importSummary: {
        updated: 1,
        unchanged: 0,
        notFound: 0,
        fieldsChanged: 1,
      },
      isImporting: false,
      importError: '',
      exportUpdateModel: vi.fn(),
      importAthleteUpdates: vi.fn().mockResolvedValue(undefined),
      toggleField: vi.fn(),
    };
    const { container, rerender } = render(<ModeloAtualizacaoTab {...props} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(props.toggleField).toHaveBeenCalled();
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Numero' },
    });
    expect(props.setUpdateModelHeaders).toHaveBeenCalledOnce();
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [new File(['Num\n101'], 'updates.csv')] },
    });
    expect(props.importAthleteUpdates).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Exportar/ }));
    expect(props.exportUpdateModel).toHaveBeenCalledOnce();
    rerender(
      <ModeloAtualizacaoTab
        {...props}
        updateModelFields={[]}
        isImporting
        importSummary={null}
      />,
    );
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeDisabled();
  });
  it('requires selected fields, generates the delivery relation and exports it', () => {
    const props = {
      deliveryRelationFields: [] as ReportFieldKey[],
      setDeliveryRelationFields: vi.fn(),
      reportAthletes: [reportAthlete],
      isDeliveryRelationGenerated: false,
      setIsDeliveryRelationGenerated: vi.fn(),
      exportDeliveryRelation: vi.fn(),
      toggleField: vi.fn(),
    };
    const { rerender } = render(<RelacaoEntregaTab {...props} />);
    expect(
      screen.getByRole('button', { name: 'Gerar relatório' }),
    ).toBeDisabled();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(props.toggleField).toHaveBeenCalled();
    rerender(
      <RelacaoEntregaTab
        {...props}
        deliveryRelationFields={['num', 'nomeAtleta']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório' }));
    expect(props.setIsDeliveryRelationGenerated).toHaveBeenCalledWith(true);
    rerender(
      <RelacaoEntregaTab
        {...props}
        deliveryRelationFields={['num', 'nomeAtleta']}
        isDeliveryRelationGenerated
      />,
    );
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /Exportar/ }));
    expect(props.exportDeliveryRelation).toHaveBeenCalledOnce();
  });
});
