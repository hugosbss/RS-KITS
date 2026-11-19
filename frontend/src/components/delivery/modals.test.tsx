import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { athlete } from '@/test/fixtures';
import { DeliveryPinModal } from './delivery-pin-modal';
import { DeliveryResetModal } from './delivery-reset-modal';
import { DeliveryEventModal } from './delivery-event-modal';
import { DeliveryRaffleModal } from './delivery-raffle-modal';
import { DeliveryEditModal } from './delivery-edit-modal';
import { DeliveryModal } from './delivery-modal';
import { DeliveryHeader } from './delivery-header';

describe('delivery dialogs', () => {
  it('keeps PIN actions disabled until a value exists and sanitizes digits', () => {
    const props = {
      showPinModal: true,
      setShowPinModal: vi.fn(),
      pin: '',
      setPin: vi.fn(),
      pinError: 'Inválido',
      setPinError: vi.fn(),
      handlePinSearch: vi.fn(),
    };
    const { rerender } = render(<DeliveryPinModal {...props} />);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'a1234' },
    });
    expect(props.setPin).toHaveBeenCalledWith('1234');
    expect(props.setPinError).toHaveBeenCalledWith('');
    rerender(<DeliveryPinModal {...props} pin="1234" />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(props.handlePinSearch).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(props.setShowPinModal).toHaveBeenCalledWith(false);
    expect(props.setPin).toHaveBeenLastCalledWith('');
    rerender(<DeliveryPinModal {...props} showPinModal={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('prevents resetting without confirmation and clears the dialog after approval', () => {
    const props = {
      showResetModal: true,
      setShowResetModal: vi.fn(),
      resetConfirmation: '',
      setResetConfirmation: vi.fn(),
      canResetDeliveries: false,
      handleResetAllDeliveries: vi.fn(),
    };
    const { rerender } = render(<DeliveryResetModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }));
    expect(props.handleResetAllDeliveries).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'ZERAR ENTREGAS' },
    });
    expect(props.setResetConfirmation).toHaveBeenCalledWith('ZERAR ENTREGAS');
    rerender(
      <DeliveryResetModal
        {...props}
        canResetDeliveries
        resetConfirmation="ZERAR ENTREGAS"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }));
    expect(props.handleResetAllDeliveries).toHaveBeenCalledOnce();
    expect(props.setShowResetModal).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(props.setResetConfirmation).toHaveBeenLastCalledWith('');
    rerender(<DeliveryResetModal {...props} showResetModal={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('edits an event name and closes on save/cancel', () => {
    const props = {
      showEventModal: true,
      setShowEventModal: vi.fn(),
      eventName: 'Corrida',
      setEventName: vi.fn(),
    };
    const { rerender } = render(<DeliveryEventModal {...props} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Nova Corrida' },
    });
    expect(props.setEventName).toHaveBeenCalledWith('Nova Corrida');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Nome' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(props.setShowEventModal).toHaveBeenCalledWith(false);
    rerender(<DeliveryEventModal {...props} showEventModal={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('sets raffle filters, blocks repeated draws and displays the winner', () => {
    const props = {
      showRaffleModal: true,
      setShowRaffleModal: vi.fn(),
      raffleFilterCategory: 'TODOS',
      setRaffleFilterCategory: vi.fn(),
      raffleFilterAge: 'TODOS',
      setRaffleFilterAge: vi.fn(),
      raffleFilterCity: 'TODOS',
      setRaffleFilterCity: vi.fn(),
      raffleWinner: null,
      raffleError: '',
      isRaffling: false,
      handleRunRaffle: vi.fn(),
    };
    const { rerender } = render(<DeliveryRaffleModal {...props} />);
    screen.getAllByRole('combobox').forEach((select, index) =>
      fireEvent.change(select, {
        target: { value: ['5 KM', '30–34', 'Bauru/SP'][index] },
      }),
    );
    expect(props.setRaffleFilterCategory).toHaveBeenCalledWith('5 KM');
    expect(props.setRaffleFilterAge).toHaveBeenCalledWith('30–34');
    expect(props.setRaffleFilterCity).toHaveBeenCalledWith('Bauru/SP');
    fireEvent.click(
      screen.getByRole('button', { name: /SORTE|Sorte|Sortear/i }),
    );
    expect(props.handleRunRaffle).toHaveBeenCalledOnce();
    rerender(
      <DeliveryRaffleModal {...props} isRaffling raffleWinner={athlete} />,
    );
    expect(screen.getByText(athlete.nome)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sorteando/i })).toBeDisabled();
    rerender(<DeliveryRaffleModal {...props} showRaffleModal={false} />);
    expect(screen.queryByText(athlete.nome)).not.toBeInTheDocument();
  });
  it('submits athlete edits and updates every editable field', () => {
    const props = {
      editingAthlete: athlete,
      setEditingAthlete: vi.fn(),
      showEditAthleteModal: true,
      setShowEditAthleteModal: vi.fn(),
      handleSaveAthleteEdit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    };
    const { container, rerender } = render(<DeliveryEditModal {...props} />);
    container
      .querySelectorAll('input')
      .forEach((input) =>
        fireEvent.change(input, { target: { value: 'Atualizado' } }),
      );
    container.querySelectorAll('select').forEach((select) =>
      fireEvent.change(select, {
        target: { value: select.options[0]?.value },
      }),
    );
    expect(props.setEditingAthlete).toHaveBeenCalled();
    fireEvent.submit(container.querySelector('form')!);
    expect(props.handleSaveAthleteEdit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    expect(props.setShowEditAthleteModal).toHaveBeenCalledWith(false);
    rerender(<DeliveryEditModal {...props} showEditAthleteModal={false} />);
    expect(
      screen.queryByText('Editar Cadastro do Atleta'),
    ).not.toBeInTheDocument();
  });
  it('delivers, reverses, mirrors and opens editing for the selected athlete', () => {
    const props = {
      selectedAthlete: athlete,
      closeDeliveryModal: vi.fn(),
      isThirdParty: false,
      setIsThirdParty: vi.fn(),
      thirdPartyForm: { nome: '', cpf: '', fone: '', email: '' },
      setThirdPartyForm: vi.fn(),
      handleDeliverKit: vi.fn(),
      handleReverseDelivery: vi.fn(),
      showAthleteOnSecondScreen: vi.fn(),
      setShowEditAthleteModal: vi.fn(),
      setEditingAthlete: vi.fn(),
    };
    const { rerender } = render(<DeliveryModal {...props} />);
    fireEvent.click(
      screen.getByRole('button', { name: /Confirmar|Entregar/i }),
    );
    expect(props.handleDeliverKit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Espelhar' }));
    expect(props.showAthleteOnSecondScreen).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Cadastro' }));
    expect(props.setEditingAthlete).toHaveBeenCalledWith(athlete);
    rerender(
      <DeliveryModal
        {...props}
        selectedAthlete={{
          ...athlete,
          status: 'ENTREGUE',
          alerta: 'Atenção',
          terceiro: true,
        }}
        isThirdParty
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Estornar/i }));
    expect(props.handleReverseDelivery).toHaveBeenCalledWith(athlete.id);
  });
});
describe('delivery toolbar', () => {
  it('opens utilities and dispatches reset, second-screen and raffle actions', () => {
    const props = {
      eventName: 'Corrida',
      eventPlace: 'Bauru/SP',
      stats: { total: 2, entregues: 1, pendentes: 1, pct: 50 },
      showDropDownUtilities: true,
      setShowDropDownUtilities: vi.fn(),
      setShowResetModal: vi.fn(),
      openSecondScreen: vi.fn(),
      secondScreenMode: 'MANUAL' as const,
      setSecondScreenMode: vi.fn(),
      setShowRaffleModal: vi.fn(),
    };
    const { rerender } = render(<DeliveryHeader {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Utilitários' }));
    expect(props.setShowDropDownUtilities).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Zerar Entregas' }));
    expect(props.setShowResetModal).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Segunda Tela' }));
    expect(props.openSecondScreen).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Automático' }));
    expect(props.setSecondScreenMode).toHaveBeenCalledWith('AUTOMATICO');
    fireEvent.click(screen.getByRole('button', { name: 'Realizar Sorteio' }));
    expect(props.setShowRaffleModal).toHaveBeenCalledWith(true);
    rerender(
      <DeliveryHeader
        {...props}
        secondScreenMode="AUTOMATICO"
        showDropDownUtilities={false}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Realizar Sorteio' }),
    ).not.toBeInTheDocument();
  });
});
