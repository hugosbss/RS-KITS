import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DeliveryTable } from './delivery-table';
import { athlete } from '@/test/fixtures';
import type { ComponentProps } from 'react';

function props(): ComponentProps<typeof DeliveryTable> {
  return {
    query: '',
    setQuery: vi.fn(),
    filteredAthletes: [athlete],
    athletes: [athlete],
    statusFilter: 'TODOS',
    setStatusFilter: vi.fn(),
    toggleStatusFilter: vi.fn(),
    selectAthleteForDelivery: vi.fn(),
    handleViewAthlete: vi.fn(),
    handleEditAthlete: vi.fn(),
    handleDeliverKit: vi.fn(),
    handleReverseDelivery: vi.fn(),
    showAthleteOnSecondScreen: vi.fn(),
    setShowPinModal: vi.fn(),
    setPin: vi.fn(),
    setPinError: vi.fn(),
    stats: { total: 1, entregues: 0, pendentes: 1, pct: 0 },
  };
}
describe('delivery athlete table', () => {
  it('searches, selects via row/keyboard/QR and opens PIN with cleared values', () => {
    const p = props();
    render(<DeliveryTable {...p} />);
    const search = screen.getByPlaceholderText(/Buscar atleta/);
    fireEvent.change(search, { target: { value: 'Ana' } });
    expect(p.setQuery).toHaveBeenCalledWith('Ana');
    fireEvent.keyDown(search, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(p.selectAthleteForDelivery).toHaveBeenCalledTimes(4);
    fireEvent.click(screen.getByRole('button', { name: /CÓDIGO PIN/ }));
    expect(p.setPin).toHaveBeenCalledWith('');
    expect(p.setPinError).toHaveBeenCalledWith('');
    expect(p.setShowPinModal).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: /Pendentes/ }));
    expect(p.toggleStatusFilter).toHaveBeenCalledWith('PENDENTE');
    fireEvent.click(screen.getByRole('button', { name: /Entregues/ }));
    expect(p.toggleStatusFilter).toHaveBeenCalledWith('ENTREGUE');
  });
  it.each(['PENDENTE', 'ENTREGUE', 'ESTORNADO'] as const)(
    'offers appropriate row actions and colors for %s',
    (status) => {
      const p = props();
      const row = { ...athlete, status };
      p.filteredAthletes = [row];
      p.statusFilter = 'PENDENTE';
      render(<DeliveryTable {...p} />);
      const tr = screen.getByText('Ana Silva').closest('tr')!;
      if (status === 'ENTREGUE') expect(tr.className).toContain('bg-emerald');
      if (status === 'ESTORNADO') expect(tr.className).toContain('bg-amber');
      fireEvent.click(within(tr).getByTitle('Ver detalhes'));
      expect(p.handleViewAthlete).toHaveBeenCalledWith(row);
      fireEvent.click(within(tr).getByTitle('Editar atleta'));
      expect(p.handleEditAthlete).toHaveBeenCalledWith(row.id);
      fireEvent.click(within(tr).getByTitle('Espelhar'));
      expect(p.showAthleteOnSecondScreen).toHaveBeenCalledWith(row);
      if (status === 'ENTREGUE') {
        fireEvent.click(within(tr).getByTitle('Estornar Kit'));
        expect(p.handleReverseDelivery).toHaveBeenCalledWith(row.id);
        expect(screen.queryByTitle('Entregar Kit')).not.toBeInTheDocument();
      } else {
        fireEvent.click(within(tr).getByTitle('Entregar Kit'));
        expect(p.handleDeliverKit).toHaveBeenCalledWith(row.id);
        expect(screen.queryByTitle('Estornar Kit')).not.toBeInTheDocument();
      }
      expect(p.selectAthleteForDelivery).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }));
      expect(p.setStatusFilter).toHaveBeenCalledWith('TODOS');
    },
  );
  it('does not select an athlete when the results are empty', () => {
    const p = props();
    p.athletes = [];
    p.filteredAthletes = [];
    render(<DeliveryTable {...p} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/Buscar atleta/), {
      key: 'Enter',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'QR Code' }));
    expect(p.selectAthleteForDelivery).not.toHaveBeenCalled();
  });
});
