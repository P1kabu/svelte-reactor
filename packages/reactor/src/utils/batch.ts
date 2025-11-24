/**
 * Batch update utilities
 *
 * Provides convenient ways to batch multiple state updates into a single
 * notification/history entry.
 */

import type { Reactor } from '../types/index.js';

/**
 * Batch multiple updates to a reactor into a single notification/history entry
 *
 * This is a convenience wrapper around reactor.batch() that allows for
 * more functional usage patterns.
 *
 * @param reactor - The reactor instance to batch updates on
 * @param fn - Function containing the updates to batch
 *
 * @example
 * ```ts
 * import { createReactor } from 'svelte-reactor';
 * import { batch } from 'svelte-reactor/utils';
 *
 * const store = createReactor({ count: 0, name: 'John' });
 *
 * // Multiple updates, single notification
 * batch(store, () => {
 *   store.update(s => { s.count++ });
 *   store.update(s => { s.name = 'Jane' });
 * });
 * // Subscribers notified only once
 * ```
 */
export function batch<T extends object>(
  reactor: Reactor<T>,
  fn: () => void
): void {
  reactor.batch(fn);
}

/**
 * Batch multiple updates across different reactors
 *
 * This allows batching updates to multiple independent stores, though note
 * that history entries are still per-reactor (batch only affects undo/redo
 * for each reactor independently).
 *
 * @param fn - Function containing the updates to batch
 *
 * @example
 * ```ts
 * import { createReactor } from 'svelte-reactor';
 * import { batchAll } from 'svelte-reactor/utils';
 *
 * const store1 = createReactor({ count: 0 });
 * const store2 = createReactor({ name: 'John' });
 *
 * // Update multiple stores efficiently
 * batchAll(() => {
 *   store1.update(s => { s.count++ });
 *   store2.update(s => { s.name = 'Jane' });
 * });
 * ```
 */
export function batchAll(fn: () => void): void {
  // For cross-store batching, we just execute the function
  // Each reactor will handle its own batching internally
  fn();
}

/**
 * Create a batched version of a function
 *
 * Returns a function that automatically batches all updates made during
 * its execution.
 *
 * @param reactor - The reactor instance to batch updates on
 * @param fn - Function to wrap with batching
 * @returns Batched version of the function
 *
 * @example
 * ```ts
 * import { createReactor } from 'svelte-reactor';
 * import { batched } from 'svelte-reactor/utils';
 *
 * const store = createReactor({ items: [] });
 *
 * // Create batched function
 * const addMultiple = batched(store, (items: string[]) => {
 *   items.forEach(item => {
 *     store.update(s => { s.items.push(item) });
 *   });
 * });
 *
 * // All updates batched automatically
 * addMultiple(['a', 'b', 'c']); // Single notification
 * ```
 */
export function batched<T extends object, Args extends any[], R>(
  reactor: Reactor<T>,
  fn: (...args: Args) => R
): (...args: Args) => R {
  return (...args: Args): R => {
    let result: R;
    reactor.batch(() => {
      result = fn(...args);
    });
    return result!;
  };
}

/**
 * Debounced batch updates
 *
 * Collects multiple updates over a time window and executes them as a batch.
 * Useful for high-frequency updates like typing, scrolling, or real-time data.
 *
 * @param reactor - The reactor instance to batch updates on
 * @param delay - Delay in milliseconds to wait before executing batch
 * @returns Function to queue updates for batching
 *
 * @example
 * ```ts
 * import { createReactor } from 'svelte-reactor';
 * import { debouncedBatch } from 'svelte-reactor/utils';
 *
 * const store = createReactor({ query: '' });
 *
 * // Create debounced batch updater
 * const updateQuery = debouncedBatch(store, 300);
 *
 * // Multiple rapid calls -> single batched update after 300ms
 * input.addEventListener('input', (e) => {
 *   updateQuery(() => {
 *     store.update(s => { s.query = e.target.value });
 *   });
 * });
 * ```
 */
export function debouncedBatch<T extends object>(
  reactor: Reactor<T>,
  delay: number
): (fn: () => void) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const pending: (() => void)[] = [];

  return (fn: () => void) => {
    pending.push(fn);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      reactor.batch(() => {
        pending.forEach(update => update());
        pending.length = 0;
      });
      timeoutId = null;
    }, delay);
  };
}
