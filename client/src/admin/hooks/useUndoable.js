import { useCallback, useRef, useState } from 'react';

const LIMIT = 100;
const COALESCE_MS = 800; // rapid edits (typing) collapse into one undo step

/**
 * State with undo/redo history. `set` records a step; `reset` replaces the value and clears history
 * (used after loading from the server). Returns stable callbacks.
 */
export function useUndoable(initial) {
  const [value, setValue] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const lastPush = useRef(0);
  const current = useRef(initial);
  const [, force] = useState(0);

  const set = useCallback((updater) => {
    const prev = current.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (next === prev) return;
    const now = Date.now();
    if (now - lastPush.current > COALESCE_MS || past.current.length === 0) {
      past.current = [...past.current, prev].slice(-LIMIT);
    }
    lastPush.current = now;
    future.current = [];
    current.current = next;
    setValue(next);
  }, []);

  const reset = useCallback((next) => {
    past.current = [];
    future.current = [];
    lastPush.current = 0;
    current.current = next;
    setValue(next);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return false;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [current.current, ...future.current];
    lastPush.current = 0;
    current.current = prev;
    setValue(prev);
    force((n) => n + 1);
    return true;
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return false;
    const [next, ...rest] = future.current;
    future.current = rest;
    past.current = [...past.current, current.current];
    lastPush.current = 0;
    current.current = next;
    setValue(next);
    force((n) => n + 1);
    return true;
  }, []);

  return { value, set, reset, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
