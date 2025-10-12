/**
 * Undo/Redo plugin
 */

import type { ReactorPlugin, UndoRedoOptions } from '../types/index.js';
import { UndoRedoHistory } from '../history/undo-redo.js';

/**
 * Enable undo/redo functionality
 *
 * @example
 * ```ts
 * const reactor = createReactor(state, {
 *   plugins: [undoRedo({ limit: 50 })],
 * });
 *
 * reactor.undo();
 * reactor.redo();
 * ```
 */
export function undoRedo<T extends object>(options?: UndoRedoOptions): ReactorPlugin<T> {
  const { limit = 50 } = options ?? {};

  return {
    name: 'undo-redo',

    init(context) {
      // Create history instance
      context.history = new UndoRedoHistory(context.state, limit);
    },

    destroy() {
      // Cleanup handled by reactor
    },
  };
}
