import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { appState } from '@/test/fixtures';
let state = appState();
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => state,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@lottiefiles/dotlottie-react', () => ({ DotLottieReact: () => null }));
beforeEach(() => {
  state = appState({ isAuthenticated: false });
  replace.mockClear();
  window.history.replaceState({}, '', '/login');
});
describe('login screen', () => {
  it('submits organizer credentials and returns to the intended event', async () => {
    window.history.replaceState(
      {},
      '',
      '/login?next=%2Fevents%3Fevento%3D1&reason=expired',
    );
    render(<LoginPage />);
    expect(screen.getByText(/Sua sessão expirou/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('CPF, CNPJ ou e-mail'), {
      target: { value: 'org@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Senha'), {
      target: { value: 'secret' },
    });
    fireEvent.submit(screen.getByPlaceholderText('Senha').closest('form')!);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/events?evento=1'),
    );
    expect(state.login).toHaveBeenCalledWith('org@example.com', 'secret');
  });
  it('shows failed credentials and allows a retry', async () => {
    vi.mocked(state.login).mockRejectedValueOnce(
      new Error('Credenciais inválidas'),
    );
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('CPF, CNPJ ou e-mail'), {
      target: { value: '12345678901' },
    });
    fireEvent.change(screen.getByPlaceholderText('Senha'), {
      target: { value: 'wrong' },
    });
    fireEvent.submit(screen.getByPlaceholderText('Senha').closest('form')!);
    expect(
      await screen.findByText('Credenciais inválidas'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Acessar Painel' }),
    ).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });
  it('redirects an authenticated session and prevents an external return URL', () => {
    state = appState();
    window.history.replaceState({}, '', '/login?next=https://evil.test');
    render(<LoginPage />);
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });
});
