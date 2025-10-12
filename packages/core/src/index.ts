// Main API
export { persisted } from './persisted.svelte.js';

// Types
export type {
  StorageAdapter,
  Serializer,
  StorageType,
  PersistedOptions,
  PersistedData,
  StorageInfo,
} from './types/index.js';

export { QuotaExceededError } from './types/index.js';

// Storage adapters
export {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
  indexedDBAdapter,
  createIndexedDBAdapter,
} from './storages/index.js';

// Utilities
export {
  defaultSerializer,
  debounce,
  runMigrations,
  compress,
  decompress,
  isCompressionSupported,
} from './utils/index.js';

// Plugins
export {
  encrypt,
  decrypt,
  isEncryptionSupported,
  createEncryptedAdapter,
} from './plugins/index.js';
