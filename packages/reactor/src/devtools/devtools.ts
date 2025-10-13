/**
 * DevTools API for reactor debugging and inspection
 */

import type { Reactor, ReactorDevTools, ReactorInspection, HistoryEntry } from '../types/index.js';
import { untrack } from 'svelte';

/**
 * Create DevTools instance for a reactor
 *
 * @example
 * ```ts
 * const reactor = createReactor({ value: 0 });
 * const devtools = createDevTools(reactor);
 *
 * // Time travel
 * devtools.timeTravel(5);
 *
 * // Export/Import
 * const exported = devtools.exportState();
 * devtools.importState(exported);
 * ```
 */
export function createDevTools<T extends object>(
  reactor: Reactor<T>,
  options?: {
    name?: string;
  }
): ReactorDevTools<T> {
  const name = options?.name || 'Reactor';

  /**
   * Get current history entries
   */
  function getHistory(): HistoryEntry<T>[] {
    const inspection = reactor.inspect();
    return inspection.history.past;
  }

  /**
   * Time travel to specific history index
   */
  function timeTravel(index: number): void {
    const history = getHistory();

    if (index < 0 || index >= history.length) {
      console.warn(`[DevTools] Invalid history index: ${index}`);
      return;
    }

    const entry = history[index];

    // Use untrack to avoid triggering effects
    untrack(() => {
      Object.assign(reactor.state, entry.state);
    });
  }

  /**
   * Export current state and history as JSON
   */
  function exportState(): string {
    const inspection = reactor.inspect();

    const data = {
      name,
      timestamp: Date.now(),
      state: inspection.state,
      history: inspection.history,
      plugins: inspection.plugins,
      middlewares: inspection.middlewares,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import state and history from JSON
   */
  function importState(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      // Validate data
      if (!data.state) {
        throw new Error('Invalid import data: missing state');
      }

      // Import state
      untrack(() => {
        Object.assign(reactor.state, data.state);
      });

      console.log(`[DevTools] Imported state from ${data.name || 'unknown'}`);
    } catch (error) {
      console.error('[DevTools] Failed to import state:', error);
      throw error;
    }
  }

  /**
   * Get detailed inspection data
   */
  function inspect(): ReactorInspection<T> {
    return reactor.inspect();
  }

  /**
   * Reset reactor to initial state
   */
  function reset(): void {
    const history = getHistory();

    if (history.length === 0) {
      console.warn('[DevTools] No history to reset');
      return;
    }

    // Go to first history entry (initial state)
    timeTravel(0);
  }

  /**
   * Get state at specific history index
   */
  function getStateAt(index: number): T | null {
    const history = getHistory();

    if (index < 0 || index >= history.length) {
      return null;
    }

    return history[index].state;
  }

  /**
   * Subscribe to state changes (for external devtools)
   */
  function subscribe(callback: (inspection: ReactorInspection<T>) => void): () => void {
    // Create an effect to watch for changes
    let unsubscribe: (() => void) | undefined;

    // Simple polling approach (in real implementation, use $effect.root)
    const interval = setInterval(() => {
      callback(reactor.inspect());
    }, 100);

    return () => {
      clearInterval(interval);
      unsubscribe?.();
    };
  }

  return {
    name,
    get history() {
      return getHistory();
    },
    timeTravel,
    exportState,
    importState,
    inspect,
    reset,
    getStateAt,
    subscribe,
  };
}
