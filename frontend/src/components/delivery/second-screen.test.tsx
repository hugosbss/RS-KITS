import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { appState, athlete } from '@/test/fixtures';
import {
  SecondScreen,
  publishSecondScreenAthlete,
  clearSecondScreenAthlete,
} from './second-screen';
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => appState(),
}));
vi.mock('@lottiefiles/dotlottie-react', () => ({ DotLottieReact: () => null }));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('BroadcastChannel', undefined);
});
const notify = () =>
  window.dispatchEvent(
    new StorageEvent('storage', { key: 'rs-kits:second-screen' }),
  );
describe('athlete confirmation screen', () => {
  it('receives a manually shared athlete and clears it after the operator closes', () => {
    // Remove the optional browser API so this case exercises storage fallback.
    delete (window as unknown as Record<string, unknown>).BroadcastChannel;
    render(<SecondScreen />);
    expect(screen.queryByText(athlete.nome)).not.toBeInTheDocument();
    act(() => {
      publishSecondScreenAthlete(athlete, 'MANUAL');
      notify();
    });
    expect(screen.getByText(athlete.nome)).toBeInTheDocument();
    expect(screen.getByText(athlete.num)).toBeInTheDocument();
    act(() => {
      clearSecondScreenAthlete();
      notify();
    });
    expect(screen.queryByText(athlete.nome)).not.toBeInTheDocument();
  });
  it('expires automatic transmission after 90 seconds and rejects old payloads', () => {
    delete (window as unknown as Record<string, unknown>).BroadcastChannel;
    vi.useFakeTimers();
    publishSecondScreenAthlete(
      {
        ...athlete,
        convenioMedico: 'Plano',
        tipoSanguineo: 'O+',
        contatoEmergencia: 'Pai',
      },
      'AUTOMATICO',
    );
    const { unmount } = render(<SecondScreen />);
    expect(screen.getByText(athlete.nome)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(90000));
    expect(screen.queryByText(athlete.nome)).not.toBeInTheDocument();
    unmount();
    localStorage.setItem('rs-kits:second-screen', 'broken');
    render(<SecondScreen />);
    expect(screen.queryByText(athlete.nome)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
  it('transmits on BroadcastChannel and closes channels on unmount', () => {
    const post = vi.fn(),
      close = vi.fn(),
      add = vi.fn();
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        postMessage = post;
        close = close;
        addEventListener = add;
      },
    );
    const { unmount } = render(<SecondScreen />);
    publishSecondScreenAthlete(athlete, 'MANUAL');
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ athlete }));
    const handler = add.mock.calls[0][1];
    act(() => handler({ data: { athlete, mode: 'MANUAL', expiresAt: null } }));
    expect(screen.getByText(athlete.nome)).toBeInTheDocument();
    clearSecondScreenAthlete();
    expect(post).toHaveBeenLastCalledWith(
      expect.objectContaining({ athlete: null }),
    );
    unmount();
    expect(close).toHaveBeenCalled();
  });
});
