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
} from './types/index.js';

// Helper types
export type { WritableStore, PersistedStoreOptions, ArrayActions, ArrayActionsOptions, AsyncActions, AsyncActionOptions, AsyncState } from './helpers/index.js';

// History
export { UndoRedoHistory as UndoRedoHistoryClass } from './history/undo-redo.js';

// Middleware
export { createMiddlewareChain, createLoggerMiddleware } from './middleware/index.js';

// Utils
export {
  deepClone,
  isEqual,
  diff,
  formatPath,
  applyPatch,
  getChangeSummary,
  getPath,
  setPath,
  deletePath,
  pick,
  omit,
} from './utils/index.js';

// Utils types
export type { DiffOperation, DiffEntry, DiffResult } from './utils/index.js';

// DevTools
export { createDevTools } from './devtools/index.js';

// Svelte store utilities
// Re-export from svelte/store for convenience - all svelte-reactor stores are compatible
export { derived, get, readonly } from 'svelte/store';
export type { Readable } from 'svelte/store';
