/**
 * Core types for svelte-reactor
 */

/**
 * Subscriber callback type (Svelte stores compatible)
 */
export type Subscriber<T> = (value: T) => void;

/**
 * Unsubscribe function type (Svelte stores compatible)
 */
export type Unsubscriber = () => void;

/**
 * Reactor instance returned by createReactor
 */
export interface Reactor<T extends object> {
  /** Reactive state (Svelte $state) */
  readonly state: T;

  /** Subscribe to state changes (Svelte stores API compatible) */
  subscribe(subscriber: Subscriber<T>): Unsubscriber;

  /** Update state using an updater function */
  update(updater: (state: T) => void, action?: string): void;

  /** Set state directly */
  set(newState: Partial<T>): void;

  /** Undo last change */
  undo(): void;

  /** Redo last undone change */
  redo(): void;

  /** Check if undo is available */
  canUndo(): boolean;

  /** Check if redo is available */
  canRedo(): boolean;

  /** Batch multiple updates into single history entry */
  batch(fn: () => void): void;

  /** Clear all history */
  clearHistory(): void;

  /** Get history entries */
  getHistory(): HistoryEntry<T>[];

  /** Get reactor inspection data (for DevTools) */
  inspect(): ReactorInspection<T>;

  /** Cleanup and destroy reactor */
  destroy(): void;
}

/**
 * Options for creating a reactor
 */
export interface ReactorOptions<T extends object> {
  /** Plugins to initialize */
  plugins?: ReactorPlugin<T>[];

  /** Name for DevTools */
  name?: string;

  /** Enable DevTools integration */
  devtools?: boolean;

  /** Callback for state changes (for non-Svelte context) */
  onChange?: (state: T, prevState: T, action?: string) => void;
}

/**
 * Plugin interface
 */
export interface ReactorPlugin<T extends object> {
  /** Plugin name */
  name: string;

  /** Initialize plugin with context */
  init(context: PluginContext<T>): void;

  /** Cleanup when reactor is destroyed */
  destroy?(): void;
}

/**
 * Context provided to plugins
 */
export interface PluginContext<T extends object> {
  /** Reactive state */
  state: T;

  /** Undo/Redo history (if enabled) */
  history?: UndoRedoHistory<T>;

  /** Registered middlewares */
  middlewares: Middleware<T>[];

  /** Reactor name */
  name?: string;
}

/**
 * Middleware interface
 */
export interface Middleware<T extends object> {
  /** Middleware name */
  name: string;

  /** Called before state update */
  onBeforeUpdate?(prevState: T, nextState: T, action?: string): void;

  /** Called after state update */
  onAfterUpdate?(prevState: T, nextState: T, action?: string): void;

  /** Called when error occurs */
  onError?(error: Error): void;
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry<T> {
  /** State snapshot */
  state: T;

  /** Timestamp of change */
  timestamp: number;

  /** Optional action name */
  action?: string;
}

/**
 * History stack structure
 */
export interface HistoryStack<T> {
  /** Past states */
  past: HistoryEntry<T>[];

  /** Future states (for redo) */
  future: HistoryEntry<T>[];

  /** Current state */
  current: T;
}

/**
 * Undo/Redo history manager
 */
export interface UndoRedoHistory<T> {
  /** Add new state to history */
  push(prevState: T, nextState: T, action?: string): void;

  /** Undo last change */
  undo(): T | null;

  /** Redo last undone change */
  redo(): T | null;

  /** Check if undo is available */
  canUndo(): boolean;

  /** Check if redo is available */
  canRedo(): boolean;

  /** Start batch mode */
  startBatch(): void;

  /** End batch mode */
  endBatch(): void;

  /** Clear all history */
  clear(): void;

  /** Get history stack */
  getStack(): HistoryStack<T>;
}

/**
 * Reactor inspection data for DevTools
 */
export interface ReactorInspection<T extends object> {
  /** Reactor name */
  name: string;

  /** Current state */
  state: T;

  /** History stack */
  history: HistoryStack<T>;

  /** Registered middlewares */
  middlewares: string[];

  /** Registered plugins */
  plugins: string[];
}

/**
 * Options for undo/redo plugin
 */
export interface UndoRedoOptions {
  /** Maximum history entries (default: 50) */
  limit?: number;

  /** Actions to exclude from history */
  exclude?: string[];

  /** Enable history compression (merge similar consecutive states) */
  compress?: boolean;

  /** Custom state comparison for compression */
  compareStates?: (a: any, b: any) => boolean;

  /** Group actions by name (merge consecutive actions with same name) */
  groupByAction?: boolean;
}

/**
 * Supported storage types for persistence
 *
 * @remarks
 * - `localStorage` - Browser localStorage (default, 5-10MB limit)
 * - `sessionStorage` - Browser sessionStorage (cleared on tab close)
 * - `indexedDB` - Browser IndexedDB (50MB+ limit, async)
 * - `memory` - In-memory storage (for testing/SSR)
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';

/**
 * Options for persist plugin
 */
export interface PersistOptions {
  /** Storage key */
  key: string;

  /** Storage type (default: 'localStorage') */
  storage?: StorageType;

  /** Debounce writes in milliseconds (default: 0) */
  debounce?: number;

  /** Enable compression (default: false) */
  compress?: boolean;

  /** Schema version for migrations */
  version?: number;

  /** Migration functions */
  migrations?: Record<number, (data: any) => any>;

  /** Custom serializer (for selective persistence) */
  serialize?: (state: any) => any;

  /** Custom deserializer */
  deserialize?: (stored: any) => any;

  /** Pick specific paths to persist (e.g., ['user.name', 'settings']) */
  pick?: string[];

  /** Omit specific paths from persistence (e.g., ['user.token', 'temp']) */
  omit?: string[];

  /**
   * IndexedDB configuration (only used when storage='indexedDB')
   */
  indexedDB?: {
    /** Database name (default: 'svelte-reactor') */
    database?: string;

    /** Object store name (default: 'state') */
    storeName?: string;

    /** Database version (default: 1) */
    version?: number;
  };
}

/**
 * Options for logger plugin
 */
export interface LoggerOptions {
  /** Collapse console groups (default: false) */
  collapsed?: boolean;

  /** Filter actions to log (now supports state comparison) */
  filter?: (action?: string, state?: any, prevState?: any) => boolean;

  /** Track performance and show execution time (default: false) */
  trackPerformance?: boolean;

  /** Warn if action takes longer than this (in ms). Requires trackPerformance */
  slowThreshold?: number;

  /** Include timestamp in logs (default: false) */
  includeTimestamp?: boolean;

  /** Maximum depth for logged objects (default: 3) */
  maxDepth?: number;
}

/**
 * Options for sync plugin (multi-tab)
 */
export interface SyncOptions {
  /** Sync key (default: reactor name) */
  key?: string;

  /** Enable broadcast channel (default: true) */
  broadcast?: boolean;

  /** Sync debounce in milliseconds (default: 100) */
  debounce?: number;
}

/**
 * DevTools API
 */
export interface ReactorDevTools<T extends object> {
  /** Reactor name */
  name: string;

  /** History entries */
  history: HistoryEntry<T>[];

  /** Time travel to specific index */
  timeTravel(index: number): void;

  /** Export state as JSON */
  exportState(): string;

  /** Import state from JSON */
  importState(data: string): void;

  /** Get inspection data */
  inspect(): ReactorInspection<T>;

  /** Reset to initial state */
  reset(): void;

  /** Get state at specific history index */
  getStateAt(index: number): T | null;

  /** Subscribe to state changes */
  subscribe(callback: (inspection: ReactorInspection<T>) => void): () => void;
}
