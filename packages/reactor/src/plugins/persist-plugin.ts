/**
 * Persist plugin - integration with @svelte-dev/persist
 */

import type { ReactorPlugin, PersistOptions } from '../types/index.js';
import { persisted } from '@svelte-dev/persist';

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
  const {
    key,
    storage = 'localStorage',
    debounce = 0,
    compress = false,
    version,
    migrations,
  } = options;

  let persistedState: any;
  let cleanupEffect: (() => void) | undefined;

  return {
    name: 'persist',

    init(context) {
      // Create persisted state using @svelte-dev/persist
      persistedState = persisted(key, context.state, {
        storage,
        debounce,
        compress,
        version,
        migrations,
        ssr: true,
      });

      // Load persisted state into reactor state
      Object.assign(context.state, persistedState);

      // Setup effect to sync reactor state to persisted state
      const syncToPersisted = () => {
        $effect(() => {
          // Track reactor state changes
          const currentState = context.state;

          // Sync to persisted state
          Object.assign(persistedState, currentState);
        });
      };

      // Run sync effect
      try {
        syncToPersisted();
      } catch (error) {
        console.error('[Reactor] Failed to sync with persist:', error);
      }
    },

    destroy() {
      // Cleanup effect if needed
      cleanupEffect?.();
    },
  };
}
