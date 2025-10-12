/**
 * Core reactor implementation with Svelte 5 Runes
 */

import { untrack } from 'svelte';
import type {
  Reactor,
  ReactorOptions,
  ReactorInspection,
  PluginContext,
  Middleware,
} from '../types/index.js';
import { UndoRedoHistory } from '../history/undo-redo.js';
import { createMiddlewareChain } from '../middleware/middleware.js';
import { deepClone } from '../utils/clone.js';

/**
 * Create a reactor with undo/redo, middleware, and plugin support
 *
 * @example
 * ```ts
 * const counter = createReactor({ value: 0 }, {
 *   plugins: [undoRedo(), logger()],
 * });
 *
 * counter.update(state => { state.value++; });
 * counter.undo();
 * ```
 */
export function createReactor<T extends object>(
  initialState: T,
  options?: ReactorOptions<T>
): Reactor<T> {
  const { plugins = [], name = 'reactor', devtools = false } = options ?? {};

  // Create reactive state with Svelte 5 $state
  let state = $state(initialState) as T;

  // Middleware array
  const middlewares: Middleware<T>[] = [];

  // History (will be set by undo/redo plugin if enabled)
  let history: UndoRedoHistory<T> | undefined;

  // Track if reactor is destroyed
  let destroyed = false;

  // Plugin context
  const pluginContext: PluginContext<T> = {
    state,
    history,
    middlewares,
    name,
  };

  // Initialize plugins
  for (const plugin of plugins) {
    try {
      plugin.init(pluginContext);

      // Update history reference if plugin added it
      if (pluginContext.history) {
        history = pluginContext.history;
      }
    } catch (error) {
      console.error(`[Reactor] Failed to initialize plugin "${plugin.name}":`, error);
    }
  }

  // Create middleware chain
  const middlewareChain = createMiddlewareChain(middlewares);

  /**
   * Update state using an updater function
   */
  function update(updater: (state: T) => void): void {
    if (destroyed) {
      console.warn('[Reactor] Cannot update destroyed reactor');
      return;
    }

    try {
      // Capture previous state
      const prevState = deepClone(state);

      // Run before middlewares
      const nextState = deepClone(state);
      updater(nextState);
      middlewareChain.runBefore(prevState, nextState);

      // Apply update
      updater(state);

      // Push to history
      if (history) {
        history.push(prevState, state);
      }

      // Run after middlewares
      middlewareChain.runAfter(prevState, state);
    } catch (error) {
      middlewareChain.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Set state directly
   */
  function set(newState: Partial<T>): void {
    update((state) => {
      Object.assign(state, newState);
    });
  }

  /**
   * Undo last change
   */
  function undo(): void {
    if (!history) {
      console.warn('[Reactor] Undo/redo not enabled. Add undoRedo plugin.');
      return;
    }

    const prevState = history.undo();
    if (prevState) {
      // Use untrack to avoid triggering effects
      untrack(() => {
        Object.assign(state, prevState);
      });
    }
  }

  /**
   * Redo last undone change
   */
  function redo(): void {
    if (!history) {
      console.warn('[Reactor] Undo/redo not enabled. Add undoRedo plugin.');
      return;
    }

    const nextState = history.redo();
    if (nextState) {
      // Use untrack to avoid triggering effects
      untrack(() => {
        Object.assign(state, nextState);
      });
    }
  }

  /**
   * Check if undo is available
   */
  function canUndo(): boolean {
    return history?.canUndo() ?? false;
  }

  /**
   * Check if redo is available
   */
  function canRedo(): boolean {
    return history?.canRedo() ?? false;
  }

  /**
   * Batch multiple updates into single history entry
   */
  function batch(fn: () => void): void {
    if (!history) {
      // No history, just run the function
      fn();
      return;
    }

    history.startBatch();
    try {
      fn();
    } finally {
      history.endBatch();
    }
  }

  /**
   * Get reactor inspection data (for DevTools)
   */
  function inspect(): ReactorInspection<T> {
    return {
      name,
      state: deepClone(state),
      history: history?.getStack() ?? { past: [], future: [], current: state },
      middlewares: middlewares.map((m) => m.name),
      plugins: plugins.map((p) => p.name),
    };
  }

  /**
   * Cleanup and destroy reactor
   */
  function destroy(): void {
    if (destroyed) return;

    destroyed = true;

    // Cleanup plugins
    for (const plugin of plugins) {
      try {
        plugin.destroy?.();
      } catch (error) {
        console.error(`[Reactor] Failed to destroy plugin "${plugin.name}":`, error);
      }
    }

    // Clear history
    history?.clear();
  }

  // Return reactor instance
  return {
    get state() {
      return state;
    },
    update,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    batch,
    inspect,
    destroy,
  };
}
