/**
 * Persist plugin - direct storage integration
 */

import type { ReactorPlugin, PersistOptions, Middleware } from '../types/index.js';

/**
 * Enable state persistence using direct storage access
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

  let debounceTimer: any;
  let storageBackend: Storage | null = null;

  // Get storage backend
  function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (storage) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      case 'memory':
        return null; // In-memory storage not implemented yet
      case 'indexedDB':
        return null; // IndexedDB not implemented yet
      default:
        return window.localStorage;
    }
  }

  // Load state from storage
  function loadState(): T | null {
    if (!storageBackend) return null;

    try {
      const item = storageBackend.getItem(key);
      if (!item) return null;

      let data = JSON.parse(item);

      // Handle compression (basic implementation)
      if (compress && typeof data === 'string') {
        // Decompress if needed (not implemented - just parse again)
        data = JSON.parse(data);
      }

      // Handle migrations
      if (version && migrations && data.__version !== version) {
        const currentVersion = data.__version || 0;
        for (let v = currentVersion + 1; v <= version; v++) {
          if (migrations[v]) {
            data = migrations[v](data);
          }
        }
        data.__version = version;
      }

      return data;
    } catch (error) {
      console.error('[Reactor persist] Failed to load state:', error);
      return null;
    }
  }

  // Save state to storage
  function saveState(state: T): void {
    if (!storageBackend) return;

    try {
      let data: any = { ...state };

      // Add version
      if (version) {
        data.__version = version;
      }

      let serialized = JSON.stringify(data);

      // Handle compression (basic implementation)
      if (compress) {
        // Compress if needed (not implemented - just stringify again)
        serialized = JSON.stringify(serialized);
      }

      storageBackend.setItem(key, serialized);
    } catch (error) {
      console.error('[Reactor persist] Failed to save state:', error);
    }
  }

  return {
    name: 'persist',

    init(context) {
      // Initialize storage backend
      storageBackend = getStorage();

      // Load persisted state
      const loadedState = loadState();
      if (loadedState) {
        Object.assign(context.state, loadedState);
      }

      // Create middleware to sync changes
      const persistMiddleware: Middleware<T> = {
        name: 'persist-sync',

        onAfterUpdate(prevState, nextState) {
          // Debounce if needed
          if (debounce > 0) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              saveState(nextState);
            }, debounce);
          } else {
            saveState(nextState);
          }
        },
      };

      // Register middleware
      context.middlewares.push(persistMiddleware);
    },

    destroy() {
      // Clear any pending debounce
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    },
  };
}
