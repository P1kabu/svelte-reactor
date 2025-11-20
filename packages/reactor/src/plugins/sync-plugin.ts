/**
 * Multi-tab synchronization plugin using BroadcastChannel API
 */

import type { ReactorPlugin, PluginContext, Middleware, SyncOptions } from '../types/index.js';

/**
 * Enable multi-tab state synchronization
 *
 * Synchronizes state changes across browser tabs/windows using BroadcastChannel API.
 * Falls back to localStorage events for older browsers.
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
  let storageListener: ((e: StorageEvent) => void) | null = null;
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

      // Try to use BroadcastChannel (modern browsers)
      if (broadcast && typeof BroadcastChannel !== 'undefined') {
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
        } catch (error) {
          console.error(`[multiTabSync:${syncKey}] Failed to create BroadcastChannel:`, error);
          // Fall through to localStorage fallback
        }
      }

      // Fallback: Use localStorage events for older browsers or if BroadcastChannel fails
      if (!channel) {
        const storageKey = `__reactor_sync_${syncKey}`;

        storageListener = (e: StorageEvent) => {
          if (e.key === storageKey && e.newValue) {
            try {
              const data = JSON.parse(e.newValue);

              // Mark that we're receiving an update to prevent infinite loops
              isReceivingUpdate = true;

              try {
                // Update each property individually to trigger Svelte reactivity
                const newState = data.state;
                for (const key in newState) {
                  if (Object.prototype.hasOwnProperty.call(newState, key)) {
                    (ctx.state as any)[key] = newState[key];
                  }
                }
              } finally {
                // Reset flag after a small delay
                setTimeout(() => {
                  isReceivingUpdate = false;
                }, 0);
              }
            } catch (error) {
              console.error(`[multiTabSync:${syncKey}] Failed to parse storage event:`, error);
            }
          }
        };

        window.addEventListener('storage', storageListener);
      }

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

            if (channel) {
              // Send via BroadcastChannel
              try {
                channel.postMessage(message);
              } catch (error) {
                console.error(`[multiTabSync:${syncKey}] Failed to broadcast message:`, error);
              }
            } else if (storageListener) {
              // Send via localStorage (fallback)
              try {
                const storageKey = `__reactor_sync_${syncKey}`;
                window.localStorage.setItem(storageKey, JSON.stringify(message));
              } catch (error) {
                console.error(`[multiTabSync:${syncKey}] Failed to write to localStorage:`, error);
              }
            }
          }, debounce);
        },
      };

      ctx.middlewares.push(middleware);
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

      // Remove storage listener
      if (storageListener && typeof window !== 'undefined') {
        window.removeEventListener('storage', storageListener);
        storageListener = null;
      }

      context = null;
    },
  };
}
