import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from './page';
import RootLayout, { metadata, viewport } from './layout';
const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-test' }),
}));
vi.mock('@/components/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
describe('root routes', () => {
  it('redirects the entry point to the dashboard', () => {
    HomePage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
  it('sets Portuguese document language, preserves child content and prevents indexing private pages', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>Private app</main>
      </RootLayout>,
    );
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('Private app');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(viewport.initialScale).toBe(1);
  });
});
