import { untrack } from 'svelte';
import type {
  StorageAdapter,
  StorageType,
  PersistedOptions,
  Serializer,
} from './types/index.js';
import { QuotaExceededError } from './types/index.js';
import {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
  indexedDBAdapter,
} from './storages/index.js';
import { defaultSerializer, serializeValue, deserializeValue } from './utils/serializer.js';
import { debounce } from './utils/debounce.js';
import { runMigrations } from './utils/migrations.js';

/**
 * Get storage adapter from type or custom adapter
 */
function getStorageAdapter(storage: StorageType | StorageAdapter): StorageAdapter {
  if (typeof storage === 'object') {
    return storage;
  }

  switch (storage) {
    case 'localStorage':
      return localStorageAdapter;
    case 'sessionStorage':
      return sessionStorageAdapter;
    case 'memory':
      return memoryStorageAdapter;
    case 'indexedDB':
      return indexedDBAdapter;
    default:
      return localStorageAdapter;
  }
}

/**
 * Load value from storage
 */
function loadFromStorage<T>(
  key: string,
  adapter: StorageAdapter,
  serializer: Serializer<T>,
  version?: number,
  migrations?: Record<number, (data: any) => any>
): T | null {
  try {
    const stored = adapter.get(key);

    // For MVP, we only support synchronous storage adapters
    // Async storage (like IndexedDB) will be added in Phase 2
    if (stored instanceof Promise) {
      console.warn('Async storage adapters are not yet supported in persisted()');
      return null;
    }

    if (stored === null) return null;

    const data = deserializeValue<T>(stored, serializer);
    if (!data) return null;

    let { value } = data;
    const storedVersion = data.__version ?? 1;

    // Run migrations if needed
    if (version && storedVersion < version && migrations) {
      value = runMigrations(value, storedVersion, version, migrations);
    }

    return value;
  } catch {
    return null;
  }
}

/**
 * Save value to storage
 */
function saveToStorage<T>(
  key: string,
  value: T,
  adapter: StorageAdapter,
  serializer: Serializer<T>,
  version?: number,
  onQuotaExceeded?: (error: QuotaExceededError) => void
): void {
  try {
    const serialized = serializeValue(value, version, serializer);
    const result = adapter.set(key, serialized);

    // Handle async storage (for future Phase 2)
    if (result instanceof Promise) {
      result.catch((error) => {
        if (error instanceof QuotaExceededError) {
          onQuotaExceeded?.(error);
        } else {
          console.error('Failed to save to storage:', error);
        }
      });
    }
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      onQuotaExceeded?.(error);
    } else {
      console.error('Failed to save to storage:', error);
    }
  }
}

/**
 * Setup tab synchronization using storage events
 */
function setupTabSync<T>(
  key: string,
  getValue: () => T,
  setValue: (newValue: T) => void,
  adapter: StorageAdapter,
  serializer: Serializer<T>
): () => void {
  if (typeof window === 'undefined' || adapter.name === 'memory') {
    return () => {};
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === key && event.newValue) {
      const data = deserializeValue<T>(event.newValue, serializer);
      if (data) {
        // Use untrack to avoid triggering effects
        untrack(() => {
          setValue(data.value);
        });
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Create a persisted reactive state using Svelte 5 runes
 *
 * @example
 * ```ts
 * let count = persisted('counter', $state(0));
 * ```
 *
 * @param key - Storage key
 * @param initialValue - Initial reactive state value (must use $state)
 * @param options - Persistence options
 * @returns The reactive state value
 */
export function persisted<T>(
  key: string,
  initialValue: T,
  options?: PersistedOptions<T>
): T {
  const {
    storage = 'localStorage',
    serializer = defaultSerializer as Serializer<T>,
    debounce: debounceMs = 0,
    sync = false,
    ssr = true,
    onQuotaExceeded,
    version,
    migrations,
  } = options ?? {};

  // SSR detection
  const isSSR = typeof window === 'undefined';
  if (isSSR && ssr) {
    // Return initial value for SSR, no persistence
    return initialValue;
  }

  // Get storage adapter
  const adapter = getStorageAdapter(storage);

  // Load persisted value
  const storedValue = loadFromStorage(key, adapter, serializer, version, migrations);

  // If we have a stored value, we need to mutate the initial state
  if (storedValue !== null) {
    // For primitive types and objects, we can directly assign
    if (typeof initialValue === 'object' && initialValue !== null) {
      Object.assign(initialValue, storedValue);
    } else {
      // For primitives, we need to return the stored value
      // Note: This means the initial $state must be recreated with stored value
      initialValue = storedValue;
    }
  }

  // Create save function (with optional debouncing)
  const saveValue = debounceMs
    ? debounce(
        (value: T) => saveToStorage(key, value, adapter, serializer, version, onQuotaExceeded),
        debounceMs
      )
    : (value: T) => saveToStorage(key, value, adapter, serializer, version, onQuotaExceeded);

  // Setup effect to save on changes
  $effect(() => {
    // Track the reactive value
    const currentValue = initialValue;
    saveValue(currentValue);
  });

  // Setup tab sync if enabled
  if (sync && !isSSR) {
    const getValue = () => initialValue;
    const setValue = (newValue: T) => {
      if (typeof initialValue === 'object' && initialValue !== null) {
        Object.assign(initialValue, newValue);
      } else {
        initialValue = newValue;
      }
    };

    setupTabSync(key, getValue, setValue, adapter, serializer);
  }

  return initialValue;
}
