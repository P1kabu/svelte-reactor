/**
 * Storage adapter interface for persisted state
 */
export interface StorageAdapter {
  /** Name of the storage adapter */
  name: string;

  /** Get a value from storage */
  get(key: string): string | null | Promise<string | null>;

  /** Set a value in storage */
  set(key: string, value: string): void | Promise<void>;

  /** Remove a value from storage */
  remove(key: string): void | Promise<void>;

  /** Clear all values from storage */
  clear(): void | Promise<void>;
}

/**
 * Serializer interface for converting values to/from strings
 */
export interface Serializer<T> {
  /** Convert value to string */
  stringify(value: T): string;

  /** Parse string to value */
  parse(str: string): T;
}

/**
 * Storage types supported out of the box
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'memory' | 'indexedDB';

/**
 * Options for persisted state
 */
export interface PersistedOptions<T> {
  /** Storage backend to use (default: 'localStorage') */
  storage?: StorageType | StorageAdapter;

  /** Custom serializer (default: JSON) */
  serializer?: Serializer<T>;

  /** Debounce writes in milliseconds (default: 0) */
  debounce?: number;

  /** Enable compression for large data (default: false) */
  compress?: boolean;

  /** Enable tab synchronization (default: false) */
  sync?: boolean;

  /** Handle SSR gracefully (default: true) */
  ssr?: boolean;

  /** Callback when storage quota is exceeded */
  onQuotaExceeded?: (error: QuotaExceededError) => void;

  /** Schema version for migrations */
  version?: number;

  /** Migration functions */
  migrations?: Record<number, (data: any) => any>;
}

/**
 * Persisted state metadata
 */
export interface PersistedData<T> {
  /** The actual data */
  value: T;

  /** Schema version */
  __version?: number;

  /** Timestamp of last update */
  __timestamp?: number;
}

/**
 * Error thrown when storage quota is exceeded
 */
export class QuotaExceededError extends Error {
  constructor(
    public key: string,
    public attemptedSize: number
  ) {
    super(`Storage quota exceeded for key "${key}" (attempted size: ${attemptedSize} bytes)`);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Storage information
 */
export interface StorageInfo {
  /** Bytes used */
  used: number;

  /** Total quota in bytes */
  quota: number;

  /** Percentage used */
  percentage: number;

  /** Number of stored items */
  items: number;
}
