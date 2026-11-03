import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { event, organizer } from '@/test/fixtures';
import { EventLinkCombobox } from './combobox-event-link';
import { OrganizerCombobox } from './combobox-organizer';
import { UfCombobox } from './combobox-uf';

describe('event associations', () => {
  it('adds another event and removes a selected event', async () => {
    const change = vi.fn();
    const second = { ...event, id: 'event2', name: 'Segunda Corrida' };
    const { rerender } = render(
      <EventLinkCombobox
        events={[event, second]}
        selectedIds={[event.id]}
        onChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.click(
      screen.getByRole('button', { name: /Segunda Corrida/ }),
    );
    expect(change).toHaveBeenCalledWith([event.id, second.id]);
    rerender(
      <EventLinkCombobox
        events={[event, second]}
        selectedIds={[event.id, second.id]}
        onChange={change}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: `Remover ${event.name}` }),
    );
    expect(change).toHaveBeenLastCalledWith([second.id]);
  });
  it('filters results and closes when clicking outside', async () => {
    render(
      <EventLinkCombobox
        events={[event]}
        selectedIds={[]}
        onChange={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'inexistente');
    expect(
      screen.queryByRole('button', { name: /Corrida Teste/ }),
    ).not.toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByRole('button', { name: /Corrida Teste/ }),
    ).not.toBeInTheDocument();
  });
});
describe('organizer picker', () => {
  it('searches, selects and removes an organizer', async () => {
    const change = vi.fn();
    const { rerender } = render(
      <OrganizerCombobox
        organizers={[organizer]}
        value={null}
        onChange={change}
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'Organizador');
    await userEvent.click(screen.getByRole('button', { name: organizer.name }));
    expect(change).toHaveBeenCalledWith(organizer.id);
    rerender(
      <OrganizerCombobox
        organizers={[organizer]}
        value={organizer.id}
        onChange={change}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover organizador vinculado' }),
    );
    expect(change).toHaveBeenLastCalledWith(null);
  });
  it('handles an empty search and outside click', async () => {
    render(
      <OrganizerCombobox organizers={[]} value={null} onChange={vi.fn()} />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'missing');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    fireEvent.mouseDown(document.body);
  });
});
describe('UF picker', () => {
  it('filters state abbreviations, selects and closes outside', async () => {
    const change = vi.fn();
    render(<UfCombobox value="" onChange={change} />);
    await userEvent.type(screen.getByPlaceholderText('UF'), 'sp');
    await userEvent.click(screen.getByRole('button', { name: 'SP' }));
    expect(change).toHaveBeenLastCalledWith('SP');
    await userEvent.click(screen.getByPlaceholderText('UF'));
    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByRole('button', { name: 'SP' }),
    ).not.toBeInTheDocument();
  });
});
