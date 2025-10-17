/**
 * Persist plugin - direct storage integration
 */

import type { ReactorPlugin, PersistOptions, Middleware } from '../types/index.js';
import { deepClone } from '../utils/index.js';
import { pick, omit } from '../utils/path.js';

/**
 * Enable state persistence using direct storage access
 *
 * @example
 * ```ts
 * import { persist } from 'svelte-reactor/plugins';
 *
 * const reactor = createReactor(state, {
 *   plugins: [persist({ key: 'my-state' })],
 * });
 * ```
 */
export function persist<T extends object>(options: PersistOptions): ReactorPlugin<T> {
  // Validate required options
  if (!options || typeof options !== 'object') {
    throw new TypeError('[persist] options must be an object');
  }

  if (!options.key || typeof options.key !== 'string') {
    throw new TypeError('[persist] options.key is required and must be a non-empty string');
  }

  const {
    key,
    storage = 'localStorage',
    debounce = 0,
    compress = false,
    version,
    migrations,
    serialize,
    deserialize,
    pick: pickPaths,
    omit: omitPaths,
  } = options;

  // Validate debounce
  if (typeof debounce !== 'number' || debounce < 0) {
    throw new TypeError(`[persist] options.debounce must be a non-negative number, got ${debounce}`);
  }

  let debounceTimer: any;
  let storageBackend: Storage | null = null;
  let storageListener: ((e: StorageEvent) => void) | null = null;

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

      // Custom deserializer
      if (deserialize) {
        data = deserialize(data);
      }

      return data;
    } catch (error) {
      console.error(`[persist:${key}] Failed to load state from ${storage}:`, error);
      // Try to recover by clearing corrupted data
      try {
        storageBackend?.removeItem(key);
        console.warn(`[persist:${key}] Cleared corrupted data from storage`);
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  // Save state to storage
  function saveState(state: T): void {
    if (!storageBackend) return;

    try {
      // Deep clone to handle Proxy objects from Svelte 5
      let data: any = deepClone(state);

      // Apply pick/omit if specified
      if (pickPaths && pickPaths.length > 0) {
        data = pick(data, pickPaths);
      } else if (omitPaths && omitPaths.length > 0) {
        data = omit(data, omitPaths);
      }

      // Custom serializer
      if (serialize) {
        data = serialize(data);
      }

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
      // Check if quota exceeded
      const isQuotaExceeded =
        error instanceof DOMException &&
        (error.code === 22 || // Chrome
         error.code === 1014 || // Firefox
         error.name === 'QuotaExceededError' ||
         error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

      if (isQuotaExceeded) {
        console.error(`[persist:${key}] Storage quota exceeded in ${storage}. Consider using compression or clearing old data.`, error);
      } else {
        console.error(`[persist:${key}] Failed to save state to ${storage}:`, error);
      }
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

      // Listen for storage changes from other tabs/windows (localStorage only)
      // or from manual changes in DevTools (both localStorage and sessionStorage)
      if (typeof window !== 'undefined' && storageBackend) {
        storageListener = (e: StorageEvent) => {
          // Only react to changes for our key
          if (e.key !== key) return;

          // Ignore changes from the same window (we already updated)
          if (e.storageArea !== storageBackend) return;

          // Load and apply the new state
          const newState = loadState();
          if (newState) {
            Object.assign(context.state, newState);
          }
        };

        window.addEventListener('storage', storageListener);
      }
    },

    destroy() {
      // Clear any pending debounce
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Remove storage event listener
      if (storageListener && typeof window !== 'undefined') {
        window.removeEventListener('storage', storageListener);
        storageListener = null;
      }
    },
  };
}
