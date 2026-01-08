/**
 * Multi-tab synchronization plugin using BroadcastChannel API
 *
 * NOTE: localStorage fallback was removed in v0.2.9.
 * This plugin requires BroadcastChannel API (95%+ browser support).
 */

import type { ReactorPlugin, PluginContext, Middleware, SyncOptions } from '../types/index.js';

/**
 * Enable multi-tab state synchronization
 *
 * Synchronizes state changes across browser tabs/windows using BroadcastChannel API.
 * Requires a modern browser with BroadcastChannel support (95%+).
 *
 * @example
 * ```ts
 * import { createReactor } from 'svelte-reactor';
 * import { multiTabSync, persist } from 'svelte-reactor/plugins';
 *
 * const reactor = createReactor({ count: 0 }, {
 *   name: 'counter',
 *   plugins: [
 *     persist({ key: 'counter' }),
 *     multiTabSync({ key: 'counter' })
 *   ],
 * });
 * ```
 */
export function multiTabSync<T extends object>(options: SyncOptions = {}): ReactorPlugin<T> {
  const {
    key,
    broadcast = true,
    debounce = 100,
  } = options;

  // Validate debounce
  if (typeof debounce !== 'number' || debounce < 0) {
    throw new TypeError(`[multiTabSync] options.debounce must be a non-negative number, got ${debounce}`);
  }

  let channel: BroadcastChannel | null = null;
  let debounceTimer: any;
  let context: PluginContext<T> | null = null;
  let isReceivingUpdate = false;

  return {
    name: 'multiTabSync',

    init(ctx: PluginContext<T>): void {
      context = ctx;

      // Use reactor name as default key
      const syncKey = key || ctx.name || 'reactor';

      // Only works in browser environment
      if (typeof window === 'undefined') {
        return;
      }

      // Check for BroadcastChannel support
      if (typeof BroadcastChannel === 'undefined') {
        console.warn(
          `[multiTabSync] BroadcastChannel API is not available in this browser.\n` +
          `Multi-tab sync will be disabled. Most modern browsers support this API (95%+).`
        );
        return;
      }

      if (!broadcast) {
        return;
      }

      try {
        channel = new BroadcastChannel(syncKey);

        // Listen for messages from other tabs
        channel.onmessage = (event) => {
          if (event.data.type === 'state-update') {
            // Mark that we're receiving an update to prevent infinite loops
            isReceivingUpdate = true;

            try {
              // Update each property individually to trigger Svelte reactivity
              const newState = event.data.state;
              for (const key in newState) {
                if (Object.prototype.hasOwnProperty.call(newState, key)) {
                  (ctx.state as any)[key] = newState[key];
                }
              }
            } finally {
              // Reset flag after a small delay to ensure the update propagates
              setTimeout(() => {
                isReceivingUpdate = false;
              }, 0);
            }
          }
        };

        // Register middleware to broadcast state changes
        const middleware: Middleware<T> = {
          name: 'multiTabSync-broadcaster',

          onAfterUpdate(prevState: T, nextState: T, action?: string): void {
            // Don't broadcast if we're receiving an update from another tab
            if (isReceivingUpdate) {
              return;
            }

            // Clear existing timer
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }

            // Debounce broadcasts to avoid spamming
            debounceTimer = setTimeout(() => {
              const message = {
                type: 'state-update',
                state: nextState,
                action,
                timestamp: Date.now(),
              };

              try {
                channel?.postMessage(message);
              } catch (error) {
                console.error(`[multiTabSync:${syncKey}] Failed to broadcast message:`, error);
              }
            }, debounce);
          },
        };

        ctx.middlewares.push(middleware);
      } catch (error) {
        console.error(`[multiTabSync:${syncKey}] Failed to create BroadcastChannel:`, error);
      }
    },

    destroy(): void {
      // Clear debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
      }

      // Close BroadcastChannel
      if (channel) {
        channel.close();
        channel = null;
      }

      context = null;
    },
  };
}
