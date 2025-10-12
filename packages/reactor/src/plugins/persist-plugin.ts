/**
 * Persist plugin - integration with @svelte-dev/persist
 */

import type { ReactorPlugin, PersistOptions } from '../types/index.js';

/**
 * Enable state persistence using @svelte-dev/persist
 *
 * @example
 * ```ts
 * import { persist } from '@svelte-dev/reactor/plugins';
 *
 * const reactor = createReactor(state, {
 *   plugins: [persist({ key: 'my-state' })],
 * });
 * ```
 */
export function persist<T extends object>(options: PersistOptions): ReactorPlugin<T> {
  const { key, storage = 'localStorage', debounce = 0 } = options;

  // This will be implemented after integrating with @svelte-dev/persist
  // For now, return a placeholder plugin

  return {
    name: 'persist',

    init(context) {
      // TODO: Implement persist integration
      // This will use @svelte-dev/persist's persisted() function
      // to automatically sync reactor state with storage

      console.info(`[Reactor] Persist plugin initialized with key: ${key}`);
      console.warn('[Reactor] Persist plugin not yet fully implemented - coming soon!');
    },

    destroy() {
      // Cleanup
    },
  };
}
