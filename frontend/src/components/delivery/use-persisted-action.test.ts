import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePersistedAction } from './use-persisted-action';

describe('persisted delivery actions', () => {
  it('does not confirm a write after the delivery screen closes', async () => {
    let finish!: () => void;
    const saved = vi.fn();
    const { result, unmount } = renderHook(() => usePersistedAction('A'));
    let task!: Promise<void>;
    act(() => {
      task = result.current.execute(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
        saved,
      );
    });
    unmount();
    await act(async () => {
      finish();
      await task;
    });
    expect(saved).not.toHaveBeenCalled();
  });
  it('confirms only after the write and ignores duplicate clicks', async () => {
    let finish!: () => void;
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const saved = vi.fn();
    const { result } = renderHook(() => usePersistedAction('A'));
    let task!: Promise<void>;
    act(() => {
      task = result.current.execute(write, saved);
    });
    expect(result.current.saving).toBe(true);
    expect(saved).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.execute(write, saved);
    });
    expect(write).toHaveBeenCalledOnce();
    await act(async () => {
      finish();
      await task;
    });
    expect(saved).toHaveBeenCalledOnce();
    expect(result.current.saving).toBe(false);
  });
  it('shows failed writes without confirming success and permits retry', async () => {
    const { result } = renderHook(() => usePersistedAction('A'));
    const saved = vi.fn();
    await act(async () => {
      await result.current.execute(async () => {
        throw new Error('Banco indisponível');
      }, saved);
    });
    expect(result.current.error).toContain('Banco indisponível');
    expect(saved).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.execute(async () => {}, saved);
    });
    expect(result.current.error).toBeNull();
    expect(saved).toHaveBeenCalledOnce();
  });
  it('does not apply completion from another event', async () => {
    let finish!: () => void;
    const saved = vi.fn();
    const { result, rerender } = renderHook(
      ({ event }) => usePersistedAction(event),
      { initialProps: { event: 'A' } },
    );
    let task!: Promise<void>;
    act(() => {
      task = result.current.execute(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
        saved,
      );
    });
    rerender({ event: 'B' });
    await act(async () => {
      finish();
      await task;
    });
    expect(saved).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });
});
