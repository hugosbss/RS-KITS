import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import { Input } from './input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { Toast } from './toast';

describe('shared UI components', () => {
  it('forwards button actions and blocks disabled actions', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button variant="outline" size="sm" onClick={onClick}>
        Salvar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('supports accessible input, validation and editing', async () => {
    const change = vi.fn();
    render(<Input aria-label="Nome" required onChange={change} />);
    expect(screen.getByRole('textbox')).toBeRequired();
    await userEvent.type(screen.getByRole('textbox'), 'Ana');
    expect(change).toHaveBeenCalledTimes(3);
  });
  it('renders card content and custom styles', () => {
    render(
      <Card className="p-8" data-testid="card">
        <CardHeader>
          <CardTitle>Resumo do evento</CardTitle>
          <CardDescription>Entregas de hoje</CardDescription>
        </CardHeader>
        <CardContent>10 kits entregues</CardContent>
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('p-8');
    expect(
      screen.getByRole('heading', { name: 'Resumo do evento' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Entregas de hoje')).toBeInTheDocument();
    expect(screen.getByText('10 kits entregues')).toBeInTheDocument();
  });
  it.each([false, true])(
    'shows success/error feedback without hiding the message (%s)',
    (error) => {
      render(<Toast message="Resultado da operação" error={error} />);
      expect(screen.getByText('Resultado da operação')).toBeVisible();
    },
  );
});
