import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUndoable } from '../admin/hooks/useUndoable.js';

describe('useUndoable (editor undo/redo)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const step = (result, value) => {
    act(() => result.current.set(value));
    vi.advanceTimersByTime(1000); // separate steps (no coalescing)
  };

  it('undoes and redoes changes in order', () => {
    const { result } = renderHook(() => useUndoable('a'));
    step(result, 'b');
    step(result, 'c');
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.value).toBe('b');
    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.redo());
    expect(result.current.value).toBe('b');
    expect(result.current.canRedo).toBe(true);
  });

  it('coalesces rapid edits (typing) into one undo step', () => {
    const { result } = renderHook(() => useUndoable(''));
    act(() => result.current.set('H'));
    act(() => result.current.set('Hi'));
    act(() => result.current.set('Hi!'));
    act(() => result.current.undo());
    expect(result.current.value).toBe('');
  });

  it('a new edit clears the redo stack; reset clears history', () => {
    const { result } = renderHook(() => useUndoable(1));
    step(result, 2);
    act(() => result.current.undo());
    step(result, 3);
    expect(result.current.canRedo).toBe(false);
    act(() => result.current.reset(10));
    expect(result.current.value).toBe(10);
    expect(result.current.canUndo).toBe(false);
  });
});
