/**
 * @svelte-dev/reactor
 * Powerful reactive state management for Svelte 5
 */

// Core
export { createReactor } from './core/reactor.svelte.js';

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
  LoggerOptions,
  SyncOptions,
  ReactorDevTools,
} from './types/index.js';

// History
export { UndoRedoHistory as UndoRedoHistoryClass } from './history/undo-redo.js';

// Middleware
export { createMiddlewareChain, createLoggerMiddleware } from './middleware/index.js';

// Utils
export { deepClone, isEqual } from './utils/index.js';
