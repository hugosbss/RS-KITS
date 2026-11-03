import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RequireAuth } from './require-auth';
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  state: { hydrated: true, isAuthenticated: false, sessionExpired: false },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/events',
}));
vi.mock('./app-context', () => ({ useAppState: () => mocks.state }));
beforeEach(() => {
  mocks.replace.mockClear();
  Object.assign(mocks.state, {
    hydrated: true,
    isAuthenticated: false,
    sessionExpired: false,
  });
  window.history.replaceState({}, '', '/events?evento=1');
});
describe('protected routes', () => {
  it('waits for hydration without exposing content or redirecting', () => {
    mocks.state.hydrated = false;
    render(<RequireAuth>Private content</RequireAuth>);
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it('redirects an expired session and preserves the requested event', async () => {
    mocks.state.sessionExpired = true;
    render(<RequireAuth>Private content</RequireAuth>);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?next=%2Fevents%3Fevento%3D1&reason=expired',
      ),
    );
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });
  it('renders authenticated content', () => {
    mocks.state.isAuthenticated = true;
    render(<RequireAuth>Private content</RequireAuth>);
    expect(screen.getByText('Private content')).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
