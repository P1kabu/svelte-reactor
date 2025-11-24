/**
 * svelte-reactor
 * Powerful reactive state management for Svelte 5
 */

// Core
export { createReactor } from './core/reactor.svelte.js';

// Helpers (convenient wrappers)
export { simpleStore, persistedStore, persistedReactor, arrayActions, asyncActions } from './helpers/index.js';

// Types
export type {
  Reactor,
  ReactorOptions,
  ReactorPlugin,
  PluginContext,
  Middleware,
  HistoryEntry,
  HistoryStack,
  UndoRedoHistory,
  ReactorInspection,
  UndoRedoOptions,
  PersistOptions,
  StorageType,
  LoggerOptions,
  SyncOptions,
  ReactorDevTools,
  Subscriber,
  Unsubscriber,
  SelectiveSubscribeOptions,
} from './types/index.js';

// Helper types
export type { WritableStore, PersistedStoreOptions, ArrayActions, ArrayActionsOptions, PaginationOptions, PaginatedResult, AsyncActions, AsyncActionOptions, AsyncState } from './helpers/index.js';

// DevTools
export { createDevTools } from './devtools/index.js';

// Batch utilities
export { batch, batchAll, batched, debouncedBatch } from './utils/batch.js';

// Svelte store utilities
// Re-export from svelte/store for convenience - all svelte-reactor stores are compatible
export { derived, get, readonly } from 'svelte/store';
export type { Readable } from 'svelte/store';
