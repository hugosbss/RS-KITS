import { expect, it, vi } from 'vitest';
import { navigateTo, replaceLocation } from './navigation';

it('navigates to modules and replaces legacy routes without retaining the old entry', () => {
  const assign = vi.fn(),
    replace = vi.fn();
  vi.stubGlobal('window', { location: { assign, replace } });
  navigateTo('/downloads');
  replaceLocation('/events?criar=1');
  expect(assign).toHaveBeenCalledWith('/downloads');
  expect(replace).toHaveBeenCalledWith('/events?criar=1');
});
