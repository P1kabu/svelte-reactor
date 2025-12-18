# API Reference

Complete API documentation for svelte-reactor v0.2.7.

## What's New in v0.2.7

🎉 **Major improvements** in v0.2.7 - "Performance & Polish":

- **🎯 `reactor.select()` Method**: Simpler API for selective subscriptions ✨ NEW
- **🛡️ `ReactorError` Class**: Rich error context (reactor name, action, plugin, tips) ✨ NEW
- **⚡ Async Concurrency Control**: `concurrency: 'replace' | 'queue' | 'parallel'` for race conditions ✨ NEW
- **🔧 DevTools Fix**: Real subscription instead of polling (major CPU/memory improvement)
- **📦 Optimized Cloning**: Clone states once and reuse in notifySubscribers
- **🤖 AI Instructions Optimized**: 79% smaller, tailored for each AI
- **✅ 486 tests**: All features thoroughly tested

👉 See [v0.2.7 Upgrade](../../UPGRADES/UPGRADE-0.2.7.md) for complete changelog.

## Table of Contents

- [Core API](#core-api)
  - [createReactor](#createreactor)
  - [Reactor Interface](#reactor-interface)
- [Plugins](#plugins)
  - [undoRedo](#undoredo)
  - [persist](#persist)
  - [multiTabSync](#multitabsync) ✨ NEW in v0.2.5
  - [logger](#logger)
- [Helpers](#helpers)
  - [arrayActions](#arrayactions)
  - [asyncActions](#asyncactions)
- [Svelte Store Utilities](#svelte-store-utilities)
  - [derived](#derived)
  - [get](#get)
  - [readonly](#readonly)
- [DevTools](#devtools)
  - [createDevTools](#createdevtools)
  - [ReactorDevTools Interface](#reactordevtools-interface)
- [Types](#types)
  - [ReactorError](#reactorerror) ✨ NEW in v0.2.7

---

## Core API

### createReactor

Create a new reactive state reactor with plugins and middleware support.

```typescript
function createReactor<T extends object>(
  initialState: T,
  options?: ReactorOptions<T>
): Reactor<T>
```

**Parameters:**

- `initialState: T` - The initial state object (must be an object, not primitive)
- `options?: ReactorOptions<T>` - Optional configuration

**ReactorOptions:**

```typescript
interface ReactorOptions<T> {
  // Array of plugins to install
  plugins?: ReactorPlugin<T>[];

  // Reactor name for debugging/DevTools
  name?: string;

  // Enable DevTools integration (default: false)
  devtools?: boolean;
}
```

**Returns:** `Reactor<T>`

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo, persist } from 'svelte-reactor/plugins';

const counter = createReactor(
  { value: 0 },
  {
    name: 'counter',
    plugins: [
      undoRedo({ limit: 50 }),
      persist({ key: 'counter' }),
    ],
  }
);
```

---

### Reactor Interface

The reactor instance returned by `createReactor()`.

```typescript
interface Reactor<T extends object> {
  // State access (Svelte 5 rune)
  state: T;

  // Update state with an updater function
  update(updater: (state: T) => void, action?: string): void;

  // Replace entire state
  set(newState: T): void;

  // Subscribe to state changes
  subscribe(callback: (state: T) => void): () => void;
  subscribe<R>(options: SelectiveSubscribeOptions<T, R>): () => void;

  // Selective subscribe (simpler API) ✨ NEW in v0.2.7
  select<R>(
    selector: (state: T) => R,
    onChanged: (value: R, prevValue?: R) => void,
    options?: { fireImmediately?: boolean; equalityFn?: (a: R, b: R) => boolean }
  ): () => void;

  // Batch multiple updates into one history entry
  batch(fn: () => void): void;

  // Undo/Redo (requires undoRedo plugin)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clearHistory(): void;
  getHistory(): HistoryEntry<T>[];

  // DevTools integration
  inspect(): ReactorInspection;

  // Cleanup
  destroy(): void;
}
```

#### state

Reactive state object (Svelte 5 `$state` rune).

```typescript
const counter = createReactor({ value: 0 });
console.log(counter.state.value); // 0
```

#### update(updater, action?)

Update state using an updater function. The updater receives a draft state that can be mutated.

```typescript
function update(updater: (state: T) => void, action?: string): void
```

**Parameters:**

- `updater: (state: T) => void` - Function that mutates the draft state
- `action?: string` - Optional action name for debugging and history exclusion

**Example:**

```typescript
// Simple update
counter.update(state => {
  state.value++;
});

// With action name
counter.update(state => {
  state.value++;
}, 'increment');

// Complex update
todos.update(state => {
  state.items.push({ id: '1', text: 'New todo', done: false });
  state.filter = 'all';
}, 'add-todo');
```

#### set(newState)

Replace the entire state with a new object.

```typescript
function set(newState: T): void
```

**Example:**

```typescript
counter.set({ value: 100 });
```

#### batch(fn)

Batch multiple updates into a single history entry.

```typescript
function batch(fn: () => void): void
```

**Example:**

```typescript
counter.batch(() => {
  counter.update(s => { s.value++; });
  counter.update(s => { s.value++; });
  counter.update(s => { s.value++; });
});
// Only one undo needed to revert all 3 increments
```

#### subscribe(callback)

**NEW in v0.2.5:** Enhanced with selective subscription support!

Subscribe to state changes. Supports both standard (entire state) and selective (specific parts) subscriptions.

**Standard subscription:**

```typescript
function subscribe(callback: (state: T) => void, invalidate?: () => void): () => void
```

**Parameters:**
- `callback: (state: T) => void` - Called with entire state on every change
- `invalidate?: () => void` - Optional invalidate function (Svelte stores compatibility)

**Returns:** Unsubscribe function

**Example:**

```typescript
const counter = createReactor({ value: 0, name: 'Counter' });

// Subscribe to all changes
const unsubscribe = counter.subscribe(state => {
  console.log('State:', state); // { value: 0, name: 'Counter' }
});

counter.update(s => { s.value++; }); // Callback fires
counter.update(s => { s.name = 'New Counter'; }); // Callback fires

// Clean up
unsubscribe();
```

**Selective subscription:** ✨ NEW in v0.2.5

```typescript
function subscribe<R>(options: SelectiveSubscribeOptions<T, R>): () => void

interface SelectiveSubscribeOptions<T, R> {
  // Extract specific value from state
  selector: (state: T) => R;

  // Called only when selected value changes
  onChanged: (value: R, prevValue?: R) => void;

  // Fire callback immediately with current value (default: true)
  fireImmediately?: boolean;

  // Custom equality check (default: ===)
  equalityFn?: (a: R, b: R) => boolean;
}
```

**Parameters:**
- `selector` - Function that extracts the value to observe
- `onChanged` - Callback that receives the selected value (not entire state)
- `fireImmediately` - Whether to call callback immediately (default: `true`)
- `equalityFn` - Custom equality function for comparing values (default: `(a, b) => a === b`)

**Returns:** Unsubscribe function

**Example:**

```typescript
const store = createReactor({
  user: { name: 'John', age: 30 },
  count: 0
});

// Subscribe only to user.name
const unsubscribe = store.subscribe({
  selector: state => state.user.name,
  onChanged: (name, prevName) => {
    console.log(`Name changed: ${prevName} → ${name}`);
  }
});

store.update(s => { s.count++; });        // ❌ Callback NOT called
store.update(s => { s.user.age = 31; });  // ❌ Callback NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Callback called!

unsubscribe();
```

**Advanced example with custom equality:**

```typescript
import { isEqual } from 'svelte-reactor';

store.subscribe({
  selector: state => state.items,
  onChanged: (items) => console.log('Items:', items),

  // Use deep equality for arrays/objects
  equalityFn: isEqual,

  // Don't fire immediately
  fireImmediately: false
});

// Array reference changes but content is same
store.update(s => { s.items = [1, 2, 3]; });
store.update(s => { s.items = [1, 2, 3]; }); // ❌ Not called (deep equal)

store.update(s => { s.items = [1, 2, 3, 4]; }); // ✅ Called (content changed)
```

**Why use selective subscriptions?**
- ⚡ **Performance** - Avoid unnecessary re-renders/computations
- 🎯 **Precision** - React only to relevant changes
- 🧩 **Composable** - Multiple selective subscriptions per store
- 🔌 **Compatible** - Works with `derived()`, `get()`, etc.

**See [EXAMPLES.md](./EXAMPLES.md#selective-subscriptions) for more patterns**

---

#### select(selector, onChanged, options?) ✨ NEW in v0.2.7

Simpler API for selective subscriptions. This is the recommended way to subscribe to specific parts of state.

```typescript
function select<R>(
  selector: (state: T) => R,
  onChanged: (value: R, prevValue?: R) => void,
  options?: {
    fireImmediately?: boolean;  // default: true
    equalityFn?: (a: R, b: R) => boolean;  // default: ===
  }
): () => void
```

**Parameters:**
- `selector` - Function that extracts the value to observe
- `onChanged` - Callback that receives (newValue, prevValue)
- `options.fireImmediately` - Call callback immediately (default: `true`)
- `options.equalityFn` - Custom equality function (default: `===`)

**Returns:** Unsubscribe function

**Example:**

```typescript
const store = createReactor({
  user: { name: 'John', age: 30 },
  count: 0
});

// Subscribe only to user.name - simpler than subscribe({ selector, onChanged })
const unsubscribe = store.select(
  state => state.user.name,
  (name, prevName) => console.log(`Changed: ${prevName} → ${name}`)
);

store.update(s => { s.count++; });           // ❌ Callback NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Callback called!

unsubscribe();
```

**With options:**

```typescript
import { isEqual } from 'svelte-reactor';

store.select(
  state => state.items,
  (items, prevItems) => console.log('Items changed:', items),
  { fireImmediately: false, equalityFn: isEqual }
);
```

---

#### undo()

Undo the last state change. Requires `undoRedo` plugin.

```typescript
function undo(): void
```

#### redo()

Redo the previously undone state change. Requires `undoRedo` plugin.

```typescript
function redo(): void
```

#### canUndo()

Check if undo is available. Requires `undoRedo` plugin.

```typescript
function canUndo(): boolean
```

#### canRedo()

Check if redo is available. Requires `undoRedo` plugin.

```typescript
function canRedo(): boolean
```

#### clearHistory()

Clear all undo/redo history. Requires `undoRedo` plugin.

```typescript
function clearHistory(): void
```

#### getHistory()

Get the full history array. Requires `undoRedo` plugin.

```typescript
function getHistory(): HistoryEntry<T>[]

interface HistoryEntry<T> {
  state: T;
  timestamp: number;
}
```

#### inspect()

Get reactor inspection information for debugging.

```typescript
function inspect(): ReactorInspection

interface ReactorInspection {
  name?: string;
  state: unknown;
  plugins: string[];
  middlewares: string[];
  history?: {
    past: number;
    current: boolean;
    future: number;
  };
}
```

#### destroy()

Clean up the reactor and remove all listeners.

```typescript
function destroy(): void
```

---

## Plugins

### undoRedo

Enable undo/redo functionality with history management.

```typescript
function undoRedo<T extends object>(
  options?: UndoRedoOptions
): ReactorPlugin<T>
```

**UndoRedoOptions:**

```typescript
interface UndoRedoOptions {
  // Maximum history entries to keep (default: 50)
  limit?: number;

  // Action names to exclude from history
  exclude?: string[];

  // Compress identical consecutive states (default: true)
  compress?: boolean;
}
```

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

const reactor = createReactor(
  { value: 0 },
  {
    plugins: [
      undoRedo({
        limit: 100,
        exclude: ['temp-update', 'preview'],
        compress: true,
      }),
    ],
  }
);

// These will be added to history
reactor.update(s => { s.value = 1; }, 'increment');
reactor.update(s => { s.value = 2; }, 'increment');

// This won't be added to history
reactor.update(s => { s.value = 999; }, 'temp-update');

reactor.undo(); // Back to value: 2
reactor.undo(); // Back to value: 1
```

---

### persist

Automatic state persistence to localStorage, sessionStorage, or IndexedDB with cross-tab synchronization.

```typescript
function persist<T extends object>(
  options: PersistOptions
): ReactorPlugin<T>
```

**PersistOptions:**

```typescript
interface PersistOptions {
  // Storage key
  key: string;

  // Storage type (default: 'localStorage')
  // NEW in v0.2.4: Added 'indexedDB' and 'memory'
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';

  // Debounce save in milliseconds (default: 0)
  debounce?: number;

  // Version for migration (default: 1)
  version?: number;

  // Migration function
  migrate?: (stored: unknown, version: number) => unknown;

  // NEW in v0.2.4: IndexedDB configuration (only used when storage='indexedDB')
  indexedDB?: {
    database?: string;   // Database name (default: 'svelte-reactor')
    storeName?: string;  // Object store name (default: 'state')
    version?: number;    // Database version (default: 1)
  };

  // NEW in v0.2.3: Selective persistence
  // Pick specific fields to persist (dot notation supported)
  pick?: string[];

  // Omit specific fields from persistence (dot notation supported)
  // Note: Cannot use both pick and omit
  omit?: string[];

  // NEW in v0.2.4: Time-to-live in milliseconds
  // After this time, stored data is considered expired and removed
  ttl?: number;

  // NEW in v0.2.4: Callback when stored data expires
  // Called when TTL expires and data is removed from storage
  onExpire?: (key: string) => void;

  // NEW in v0.2.5: Enable LZ compression (reduces storage size by 40-70%)
  // Uses lz-string compression (UTF16-safe for all storage types)
  compress?: boolean;

  // Custom serialization (optional)
  serialize?: (state: T) => unknown;

  // Custom deserialization (optional)
  deserialize?: (stored: unknown) => T;
}
```

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

const todos = createReactor(
  { items: [], user: { name: 'John', token: 'secret123' } },
  {
    plugins: [
      persist({
        key: 'todos',
        storage: 'localStorage',
        debounce: 300,
        version: 2,
        migrate: (stored, version) => {
          if (version < 2) {
            // Migrate from v1 to v2
            return { items: (stored as any).tasks || [] };
          }
          return stored;
        },

        // NEW in v0.2.3: Exclude sensitive data
        omit: ['user.token'], // Don't persist token

        // OR: Only persist specific fields
        // pick: ['items', 'user.name']
      }),
    ],
  }
);
```

**Security Features (v0.2.3):**

```typescript
// Example 1: Exclude sensitive data
const store = createReactor({
  user: { name: 'John', email: 'john@example.com', token: 'secret' },
  settings: { theme: 'dark' },
  temp: { cache: [] }
}, {
  plugins: [
    persist({
      key: 'app',
      omit: ['user.token', 'temp'] // Exclude token and temp data
    })
  ]
});

// Example 2: Only persist specific fields
const store2 = createReactor({
  user: { name: 'John', email: 'john@example.com', token: 'secret' },
  settings: { theme: 'dark' },
  temp: { cache: [] }
}, {
  plugins: [
    persist({
      key: 'app',
      pick: ['user.name', 'user.email', 'settings'] // Only persist these
    })
  ]
});
```

**IndexedDB Storage (v0.2.4):**

```typescript
// Example 3: Large dataset with IndexedDB (50MB+ capacity)
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  size: number;
}

const gallery = createReactor<{ photos: Photo[] }>(
  { photos: [] },
  {
    plugins: [
      persist({
        key: 'photo-gallery',
        storage: 'indexedDB',  // Use IndexedDB for large data
        debounce: 1000,        // Batch writes for performance

        indexedDB: {
          database: 'photo-app',      // Custom database name
          storeName: 'gallery-data',  // Custom store name
          version: 1                  // Schema version
        }
      })
    ]
  }
);

// Add large photos - automatically persisted to IndexedDB
gallery.update(state => {
  state.photos.push({
    id: crypto.randomUUID(),
    url: 'blob:...',       // Large image blob
    thumbnail: 'data:...',
    size: 5242880          // 5MB
  });
});
```

**Memory Storage (v0.2.5):**

```typescript
// Example 4: In-memory storage (SSR-safe, testing, temporary state)
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

// Use case 1: Testing without affecting real storage
const testStore = createReactor(
  { count: 0 },
  {
    plugins: [
      persist({
        key: 'test-data',
        storage: 'memory'  // Won't affect localStorage
      })
    ]
  }
);

// Use case 2: SSR (server-side rendering) compatibility
// Memory storage works in Node.js environments (no window object required)
const ssrStore = createReactor(
  { user: null },
  {
    plugins: [
      persist({
        key: 'ssr-user',
        storage: 'memory'  // SSR-safe!
      })
    ]
  }
);

// Use case 3: Temporary state that shouldn't persist across reloads
const sessionCache = createReactor(
  { apiData: [] },
  {
    plugins: [
      persist({
        key: 'temp-cache',
        storage: 'memory'  // Lost on page reload
      })
    ]
  }
);
```

**Storage Type Comparison:**

| Storage Type | Capacity | Persistence | Best For | Compression |
|--------------|----------|-------------|----------|-------------|
| `localStorage` | 5-10 MB | Forever | Settings, preferences | ✅ Supported |
| `sessionStorage` | 5-10 MB | Tab session | Temporary data, forms | ✅ Supported |
| `indexedDB` | 50+ MB | Forever | Large datasets, offline data | ✅ Supported |
| `memory` | Unlimited | Runtime only | Testing, SSR, temp state | ✅ Supported |

**TTL Support (v0.2.4):**

```typescript
// Example 5: API Cache with auto-expiration
const apiCache = createReactor(
  { users: [], lastFetch: null },
  {
    plugins: [
      persist({
        key: 'api-cache',
        ttl: 5 * 60 * 1000,  // Expire after 5 minutes
        onExpire: (key) => {
          console.log(`Cache ${key} expired, fetching fresh data...`);
          // Trigger data refresh
        }
      })
    ]
  }
);

// Example 5: Session with auto-logout
const session = createReactor(
  { isAuthenticated: false, userId: null, token: null },
  {
    plugins: [
      persist({
        key: 'user-session',
        storage: 'sessionStorage',
        ttl: 30 * 60 * 1000,    // 30 minutes
        omit: ['token'],         // Don't persist sensitive token
        onExpire: () => {
          window.location.href = '/login';  // Redirect on expiration
        }
      })
    ]
  }
);

// Example 6: TTL with IndexedDB (long-term cache)
const offlineData = createReactor(
  { cachedPages: [] },
  {
    plugins: [
      persist({
        key: 'offline-cache',
        storage: 'indexedDB',
        ttl: 24 * 60 * 60 * 1000,  // 24 hours
        indexedDB: {
          database: 'app-cache',
          storeName: 'pages'
        }
      })
    ]
  }
);
```

**How TTL Works:**

1. **On Write:** Timestamp is automatically added when state is saved
2. **On Read:** Age is calculated and compared against TTL
3. **If Expired:**
   - Data is removed from storage
   - `onExpire` callback is invoked (if provided)
   - Initial state is used instead of expired data
4. **If Fresh:** Data loads normally

**TTL Notes:**
- ⚡ Works with all storage types (localStorage, sessionStorage, indexedDB, memory)
- 🔒 `onExpire` errors are caught and logged, won't crash app
- ✅ Compatible with migrations, pick/omit, and all other persist features
- 🎯 TTL of `0` means data expires immediately on next load
- 🛡️ TypeScript enforces non-negative numbers

**Compression (v0.2.5):**

```typescript
// Example 7: Enable compression to reduce storage size
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

// Without compression - 2.5 KB in localStorage
const largeStore = createReactor(
  {
    items: Array(100).fill({
      name: 'Product',
      description: 'A detailed product description',
      price: 29.99
    })
  },
  {
    plugins: [
      persist({
        key: 'inventory',
        compress: true  // Enable compression (40-70% size reduction)
      })
    ]
  }
);

// Example 8: Compression with large text data
const docsStore = createReactor(
  {
    content: 'Very long markdown document...'.repeat(100),
    metadata: { author: 'John', version: 1 }
  },
  {
    plugins: [
      persist({
        key: 'document',
        compress: true,  // Excellent for repetitive text (60%+ reduction)
        debounce: 500    // Combine with debounce for optimal performance
      })
    ]
  }
);

// Example 9: Compression + all other features
const advancedStore = createReactor(
  {
    users: [],
    settings: { theme: 'dark' },
    cache: { lastSync: Date.now() }
  },
  {
    plugins: [
      persist({
        key: 'app-data',
        storage: 'localStorage',
        compress: true,              // Reduce size
        debounce: 300,               // Batch writes
        ttl: 24 * 60 * 60 * 1000,   // 24h expiration
        omit: ['cache'],             // Don't persist cache
        version: 1,
        migrations: {
          1: (data) => data
        }
      })
    ]
  }
);
```

**Compression Performance:**

| Data Type | Original Size | Compressed | Reduction |
|-----------|---------------|------------|-----------|
| Repetitive objects | 2.5 KB | 0.8 KB | ~68% |
| Large text (repeated) | 2.8 KB | 0.6 KB | ~79% |
| Small objects | 50 B | 60 B | -20% ⚠️ |
| Mixed data | 1.5 KB | 0.9 KB | ~40% |

**Compression Notes:**
- 🎯 Uses `lz-string` UTF16 compression (tree-shakeable - only loaded when `compress: true`)
- ⚡ Best for: Large datasets, repetitive data, text-heavy content
- ⚠️ Not ideal for: Very small objects (<100 bytes) - may increase size
- 🔄 Backward compatible: Automatically falls back to uncompressed data if decompression fails
- 🌐 Works with all storage types: localStorage, sessionStorage, indexedDB, memory
- ✅ Compatible with all persist features: TTL, pick/omit, migrations, etc.
- 🔒 Safe for UTF-16 special characters and emojis

**When to Use Compression:**

✅ **Good use cases:**
- Large arrays of objects (>1 KB)
- Text-heavy content (documents, logs)
- Repetitive data structures
- When approaching localStorage quota (5-10 MB)

❌ **Avoid compression when:**
- State is very small (<100 bytes)
- Data is already compressed (binary, images)
- Extreme performance requirements (compression adds ~1-2ms overhead)

---

### logger

Log all state changes to the console.

```typescript
function logger<T extends object>(
  options?: LoggerOptions
): ReactorPlugin<T>
```

**LoggerOptions:**

```typescript
interface LoggerOptions {
  // Collapse console groups (default: false)
  collapsed?: boolean;

  // Custom logger function
  log?: (action: string, prevState: unknown, nextState: unknown) => void;

  // NEW in v0.2.3: Advanced filtering
  // Filter function to control what gets logged
  filter?: (action?: string, state?: unknown, prevState?: unknown) => boolean;

  // Track execution time for each action
  trackPerformance?: boolean;

  // Warn if action execution time exceeds this threshold (in ms)
  slowThreshold?: number;

  // Include timestamp in logs
  includeTimestamp?: boolean;

  // Maximum depth for object inspection in console (default: 3)
  maxDepth?: number;
}
```

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { logger } from 'svelte-reactor/plugins';

const reactor = createReactor(
  { value: 0, user: { name: 'John' } },
  {
    plugins: [
      logger({
        collapsed: true,
        log: (action, prev, next) => {
          console.log(`[${action}]`, prev, '->', next);
        },

        // NEW in v0.2.3: Filter by action name
        filter: (action) => action?.startsWith('user:'),

        // Or filter by state changes
        // filter: (action, state, prevState) => {
        //   return state.value !== prevState.value;
        // },

        // Performance tracking
        trackPerformance: true,
        slowThreshold: 100, // Warn if action takes > 100ms
        includeTimestamp: true,
        maxDepth: 3,
      }),
    ],
  }
);
```

**Advanced Filtering Examples (v0.2.3):**

```typescript
// Filter by action prefix
logger({
  filter: (action) => action?.startsWith('api:')
})

// Filter by state changes
logger({
  filter: (action, state, prevState) => {
    return state.count !== prevState.count;
  }
})

// Combine with performance tracking
logger({
  filter: (action) => !action?.includes('temp'),
  trackPerformance: true,
  slowThreshold: 50,
  collapsed: true
})
```

**Features:**

- **Auto-sync**: Changes from other tabs (localStorage) are automatically synced
- **DevTools friendly**: Manual changes in DevTools are detected
- **Debouncing**: Configurable debounce to reduce write frequency
- **Migrations**: Schema versioning for backwards compatibility

### multiTabSync

**NEW in v0.2.5** - Synchronize state across browser tabs and windows in real-time.

```typescript
function multiTabSync<T extends object>(
  options?: SyncOptions
): ReactorPlugin<T>
```

**SyncOptions:**

```typescript
interface SyncOptions {
  // Sync key (default: reactor name)
  // Reactors with the same key will sync with each other
  key?: string;

  // Enable BroadcastChannel API (default: true)
  // Falls back to localStorage events if not available
  broadcast?: boolean;

  // Sync debounce in milliseconds (default: 100)
  // Reduces broadcast frequency for rapid updates
  debounce?: number;
}
```

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { persist, multiTabSync } from 'svelte-reactor/plugins';

// Basic usage - sync across tabs
const counter = createReactor(
  { count: 0 },
  {
    name: 'counter',
    plugins: [
      persist({ key: 'counter' }),       // Persist to localStorage
      multiTabSync({ key: 'counter' })   // Sync across tabs
    ],
  }
);

// Update in one tab
counter.update(s => { s.count++; });

// All other tabs automatically receive the update! ✨
```

**Advanced Usage:**

```typescript
// Shopping cart synchronized across tabs
const cart = createReactor(
  { items: [], total: 0 },
  {
    name: 'shopping-cart',
    plugins: [
      persist({
        key: 'cart',
        storage: 'localStorage'
      }),
      multiTabSync({
        key: 'cart',
        debounce: 200  // Reduce sync frequency
      })
    ],
  }
);

// User adds item in Tab 1
cart.update(s => {
  s.items.push({ id: 1, name: 'Book', price: 20 });
  s.total = s.items.reduce((sum, item) => sum + item.price, 0);
});

// Cart in Tab 2 automatically updates! 🎉
```

**Use Cases:**

```typescript
// 1. Multi-tab dashboards
const dashboard = createReactor(dashboardState, {
  plugins: [
    multiTabSync({ key: 'dashboard' })
  ]
});

// 2. Collaborative editing (same user, multiple tabs)
const editor = createReactor(editorState, {
  plugins: [
    persist({ key: 'draft' }),
    multiTabSync({ key: 'draft', debounce: 500 })
  ]
});

// 3. Authentication state
const auth = createReactor({ user: null, token: null }, {
  plugins: [
    persist({ key: 'auth', omit: ['token'] }),
    multiTabSync({ key: 'auth' })
  ]
});

// User logs out in one tab -> all tabs redirect to login
auth.update(s => { s.user = null; s.token = null; });
```

**Browser Compatibility:**

- **BroadcastChannel API** (primary): Chrome 54+, Firefox 38+, Safari 15.4+
- **localStorage events** (fallback): All modern browsers
- **SSR-safe**: Gracefully handles server-side rendering

**Features:**

- **Real-time sync**: State changes instantly broadcast to all tabs
- **Automatic fallback**: Uses localStorage events if BroadcastChannel unavailable
- **Infinite loop prevention**: Smart detection prevents sync loops
- **Debouncing**: Configurable to reduce network/CPU usage
- **SSR compatible**: No crashes in server environments
- **Zero configuration**: Works out of the box with reactor name

**Performance:**

```typescript
// Optimize for high-frequency updates
multiTabSync({
  key: 'realtime-data',
  debounce: 300  // Max 3 syncs per second
})

// Optimize for instant sync
multiTabSync({
  key: 'critical-state',
  debounce: 0    // Immediate sync
})
```

**Integration with persist plugin:**

```typescript
// Best practice: Use same key for persist + sync
const store = createReactor(state, {
  plugins: [
    persist({
      key: 'my-app',
      storage: 'localStorage',
      debounce: 500
    }),
    multiTabSync({
      key: 'my-app',  // Same key!
      debounce: 100   // Faster sync than persist
    })
  ]
});

// Why?
// - persist saves to storage (slow, debounced)
// - multiTabSync broadcasts changes (fast)
// - Other tabs receive broadcast immediately
// - Then load from storage on refresh
```

**Important Notes:**

- Synced updates do NOT trigger `onChange` callbacks (to avoid confusion)
- Synced updates DO trigger Svelte reactivity (components re-render)
- Each reactor needs the same `key` to sync together
- Different keys = isolated sync channels
- Cleanup is automatic on reactor.destroy()

---

## Helpers

### arrayActions

Create array CRUD actions helper for a reactor field to reduce boilerplate.

```typescript
function arrayActions<S extends object, K extends keyof S, T>(
  reactor: Reactor<S>,
  field: K,
  options?: ArrayActionsOptions
): ArrayActions<T>
```

**Parameters:**

- `reactor: Reactor<S>` - The reactor instance
- `field: K` - Field name containing the array
- `options?: ArrayActionsOptions` - Optional configuration

**ArrayActionsOptions:**

```typescript
interface ArrayActionsOptions {
  // Field name to use as unique identifier (default: 'id')
  idKey?: string;

  // Action prefix for undo/redo history (default: field name)
  actionPrefix?: string;

  // NEW in v0.2.4: Pagination configuration (opt-in)
  pagination?: {
    pageSize?: number;    // Items per page (default: 20)
    initialPage?: number; // Starting page number (default: 1)
  };
}
```

**Returns:** `ArrayActions<T>`

**ArrayActions Interface:**

```typescript
interface ArrayActions<T> {
  // Add item to array
  add(item: T): void;

  // Update item by id
  update(id: any, updates: Partial<T>): void;

  // Update item by id using updater function
  updateBy(id: any, updater: (item: T) => void): void;

  // Remove item by id
  remove(id: any): void;

  // Remove items matching predicate
  removeWhere(predicate: (item: T) => boolean): void;

  // Clear all items
  clear(): void;

  // Toggle boolean field for item
  toggle(id: any, field: keyof T): void;

  // Replace entire array
  set(items: T[]): void;

  // Filter items
  filter(predicate: (item: T) => boolean): void;

  // NEW in v0.2.3: Sort array
  sort(compareFn: (a: T, b: T) => number): void;

  // NEW in v0.2.3: Bulk update multiple items
  bulkUpdate(ids: any[], updates: Partial<T>): void;

  // NEW in v0.2.3: Bulk remove multiple items
  bulkRemove(idsOrPredicate: any[] | ((item: T) => boolean)): void;

  // Find item by id
  find(id: any): T | undefined;

  // Check if item exists
  has(id: any): boolean;

  // Get array length
  count(): number;

  // NEW in v0.2.4: Pagination methods (only available when pagination is enabled)
  getPaginated?(): PaginatedResult<T>;
  setPage?(page: number): void;
  nextPage?(): boolean;
  prevPage?(): boolean;
  firstPage?(): void;
  lastPage?(): void;
}

/**
 * Paginated result with metadata (NEW in v0.2.4)
 */
interface PaginatedResult<T> {
  items: T[];        // Items for current page
  page: number;      // Current page number (1-indexed)
  totalPages: number;// Total number of pages
  totalItems: number;// Total number of items in array
  hasNext: boolean;  // Whether next page exists
  hasPrev: boolean;  // Whether previous page exists
  pageSize: number;  // Items per page
}
```

**Example:**

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';
import { undoRedo, persist } from 'svelte-reactor/plugins';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const todos = createReactor({ items: [] as Todo[] }, {
  plugins: [persist({ key: 'todos' }), undoRedo()]
});

// Create array actions helper
const actions = arrayActions(todos, 'items', { idKey: 'id' });

// CRUD operations - no more manual update() calls!
actions.add({ id: '1', text: 'Buy milk', done: false });
actions.update('1', { done: true });
actions.toggle('1', 'done');
actions.remove('1');

// Advanced operations
actions.removeWhere(item => item.done);
actions.filter(item => !item.done);

// NEW in v0.2.3: Sorting
actions.sort((a, b) => a.priority - b.priority); // Sort by priority
actions.sort((a, b) => b.createdAt - a.createdAt); // Newest first
actions.sort((a, b) => a.text.localeCompare(b.text)); // Alphabetically

// NEW in v0.2.3: Bulk operations
actions.bulkUpdate(['1', '2', '3'], { done: true }); // Update multiple
actions.bulkRemove(['1', '2']); // Remove multiple by ids
actions.bulkRemove(item => item.done); // Remove by predicate

// Query operations (don't trigger updates)
const item = actions.find('1');
const exists = actions.has('1');
const count = actions.count();
```

**New Methods in v0.2.3:**

```typescript
// Sort array with comparator function
actions.sort((a, b) => a.priority - b.priority);
// Supports undo/redo - entire sort operation is one history entry

// Bulk update multiple items at once
actions.bulkUpdate(['id1', 'id2', 'id3'], {
  status: 'completed',
  completedAt: Date.now()
});
// More efficient than calling update() multiple times

// Bulk remove by ids or predicate
actions.bulkRemove(['id1', 'id2']); // Remove specific ids
actions.bulkRemove(item => item.done && item.age > 30); // Remove by condition
// Both methods support undo/redo
```

**New Methods in v0.2.4: Pagination**

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const todos = createReactor({ items: [] as Todo[] });

// Enable pagination (opt-in)
const paginated = arrayActions(todos, 'items', {
  idKey: 'id',
  pagination: {
    pageSize: 20,      // Items per page (default: 20)
    initialPage: 1     // Starting page (default: 1)
  }
});

// Get paginated data with full metadata
const result = paginated.getPaginated!();
console.log(result);
// {
//   items: [...],        // Current page items
//   page: 1,             // Current page (1-indexed)
//   totalPages: 5,       // Total number of pages
//   totalItems: 100,     // Total items in array
//   hasNext: true,       // Whether next page exists
//   hasPrev: false,      // Whether previous page exists
//   pageSize: 20         // Items per page
// }

// Navigation methods
paginated.nextPage!();    // Go to next page (returns false if on last page)
paginated.prevPage!();    // Go to previous page (returns false if on first page)
paginated.setPage!(5);    // Jump to specific page
paginated.firstPage!();   // Jump to first page
paginated.lastPage!();    // Jump to last page

// Pagination works seamlessly with all arrayActions methods
paginated.add({ id: '101', text: 'New task', done: false });
paginated.sort((a, b) => a.text.localeCompare(b.text));
paginated.filter(item => !item.done);
// getPaginated() always returns current page after modifications

// Real-world example: Svelte component
/*
<script lang="ts">
  import { paginated } from './stores';

  const { items, page, totalPages, hasNext, hasPrev } = $derived(
    paginated.getPaginated!()
  );
</script>

{#each items as todo}
  <div>{todo.text}</div>
{/each}

<div class="pagination">
  <button disabled={!hasPrev} onclick={() => paginated.prevPage!()}>
    Previous
  </button>
  <span>Page {page} of {totalPages}</span>
  <button disabled={!hasNext} onclick={() => paginated.nextPage!()}>
    Next
  </button>
</div>
*/
```

**Pagination Features:**
- ✅ Opt-in (no overhead when not used)
- ✅ Auto-clamping to valid page range (won't crash on invalid pages)
- ✅ Works with all arrayActions methods (sort, filter, bulkUpdate, etc.)
- ✅ 1-indexed pages (user-friendly: page 1, 2, 3...)
- ✅ Complete metadata (totalPages, hasNext, hasPrev, totalItems)
- ✅ Navigation methods return boolean success status
- ✅ Safe for empty arrays (returns page 1 with 0 items)

**Features:**

- **Less boilerplate**: No need to write `update()` for every operation
- **Type-safe**: Full TypeScript inference for array items
- **Undo/Redo compatible**: All methods work seamlessly with undoRedo plugin
- **Action names**: Automatic action names for better debugging (`items:add`, `items:update`, `items:sort`, etc.)
- **Bulk operations**: Efficient bulk update/remove in v0.2.3

---

### asyncActions

Create async actions helper with automatic loading/error state management.

```typescript
function asyncActions<S extends object, T extends Record<string, AsyncAction<any, any>>>(
  reactor: Reactor<S>,
  actions: T,
  options?: AsyncActionOptions
): AsyncActions<T>
```

**Parameters:**

- `reactor: Reactor<S>` - The reactor instance
- `actions: T` - Object with async action functions
- `options?: AsyncActionOptions` - Optional configuration

**AsyncActionOptions:**

```typescript
interface AsyncActionOptions {
  // Field name for loading state (default: 'loading')
  loadingKey?: string;

  // Field name for error state (default: 'error')
  errorKey?: string;

  // Action prefix for undo/redo history (default: 'async')
  actionPrefix?: string;

  // Reset error on new request (default: true)
  resetErrorOnStart?: boolean;

  // NEW in v0.2.3: Retry configuration
  retry?: {
    // Number of retry attempts (default: 3)
    attempts?: number;
    // Delay between retries in ms (default: 1000)
    delay?: number;
    // Backoff strategy: 'linear' | 'exponential' (default: 'exponential')
    backoff?: 'linear' | 'exponential';
    // Custom retry condition (default: retry on any error)
    retryOn?: (error: Error) => boolean;
  };

  // NEW in v0.2.3: Debounce delay in milliseconds
  // Waits for this duration of inactivity before executing
  debounce?: number;

  // NEW in v0.2.7: Concurrency control for race conditions
  // 'replace' - Cancel previous request, only latest completes (default)
  // 'queue' - Queue requests, execute sequentially
  // 'parallel' - All requests run in parallel
  concurrency?: 'replace' | 'queue' | 'parallel';
}

// NEW in v0.2.3: Async controller for cancellation
interface AsyncController {
  cancel(): void;
}
```

**Returns:** `AsyncActions<T>`

**Example:**

```typescript
import { createReactor, asyncActions } from 'svelte-reactor';

interface User {
  id: number;
  name: string;
}

interface StoreState {
  users: User[];
  loading: boolean;
  error: Error | null;
}

const store = createReactor<StoreState>({
  users: [],
  loading: false,
  error: null,
});

// Create async actions
const api = asyncActions(store, {
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    const users = await response.json();
    return { users };
  },
  createUser: async (name: string, email: string) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const newUser = await response.json();
    return { users: [...store.state.users, newUser] };
  },
  deleteUser: async (id: number) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return { users: store.state.users.filter(u => u.id !== id) };
  },
});

// Usage - automatic loading & error handling!
await api.fetchUsers();
// During execution:
//   store.state.loading = true
// After success:
//   store.state.loading = false
//   store.state.error = null
//   store.state.users = [...]

try {
  await api.createUser('John', 'john@example.com');
} catch (error) {
  // After error:
  //   store.state.loading = false
  //   store.state.error = error
}
```

**With Custom Options:**

```typescript
const api = asyncActions(
  store,
  {
    loadData: async () => {
      const data = await fetchData();
      return { data };
    },
  },
  {
    loadingKey: 'isLoading',
    errorKey: 'lastError',
    actionPrefix: 'api',
    resetErrorOnStart: true,
  }
);

// Now uses store.state.isLoading and store.state.lastError
```

**NEW in v0.2.3: Retry Logic**

```typescript
const api = asyncActions(
  store,
  {
    fetchUsers: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return { users: await response.json() };
    }
  },
  {
    retry: {
      attempts: 3,           // Retry up to 3 times
      delay: 1000,           // Wait 1s between retries
      backoff: 'exponential' // 1s, 2s, 4s, 8s... (exponential backoff)
    }
  }
);

// Automatically retries on failure!
await api.fetchUsers();
// If it fails, retries 3 times before throwing

// Custom retry condition
const api2 = asyncActions(
  store,
  {
    fetchData: async () => {
      const res = await fetch('/api/data');
      return { data: await res.json() };
    }
  },
  {
    retry: {
      attempts: 5,
      delay: 500,
      backoff: 'linear', // 500ms, 1000ms, 1500ms, 2000ms...
      retryOn: (error) => {
        // Only retry on network errors, not 404s
        return error.message.includes('network');
      }
    }
  }
);
```

**NEW in v0.2.3: Debouncing**

```typescript
const api = asyncActions(
  store,
  {
    searchUsers: async (query: string) => {
      const response = await fetch(`/api/users?q=${query}`);
      return { results: await response.json() };
    }
  },
  {
    debounce: 300 // Wait 300ms of inactivity before executing
  }
);

// Type fast - only last request executes!
api.searchUsers('j');
api.searchUsers('jo');
api.searchUsers('joh');
api.searchUsers('john'); // Only this one runs after 300ms
```

**NEW in v0.2.3: Manual Cancellation**

```typescript
const api = asyncActions(store, {
  fetchData: async () => {
    const response = await fetch('/api/data');
    return { data: await response.json() };
  }
});

// Start request and get controller
const controller = api.fetchData();

// Cancel if needed
setTimeout(() => {
  controller.cancel(); // Cancels in-flight request
}, 1000);

// Debounced actions also support cancellation
const searchApi = asyncActions(
  store,
  { search: async (q: string) => { /* ... */ } },
  { debounce: 300 }
);

const ctrl = searchApi.search('query');
ctrl.cancel(); // Cancel pending/in-flight request
```

**Concurrency control (v0.2.7):**

```typescript
// 'replace' mode - only latest request completes (default)
const api = asyncActions(store, {
  search: async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`);
    return { results: await res.json() };
  }
}, { concurrency: 'replace' });

// Rapid calls - only the last one updates state
api.search('a');   // Canceled (stale)
api.search('ab');  // Canceled (stale)
api.search('abc'); // ✅ Only this updates state

// 'parallel' mode - all requests run simultaneously
const parallelApi = asyncActions(store, {
  fetchItem: async (id: number) => { /* ... */ }
}, { concurrency: 'parallel' });

// All three requests run in parallel
await Promise.all([
  parallelApi.fetchItem(1),
  parallelApi.fetchItem(2),
  parallelApi.fetchItem(3)
]);
```

**Features:**

- **Automatic state management**: Handles loading/error states automatically
- **Type-safe**: Full TypeScript inference for action parameters and return values
- **Error handling**: Catches errors and updates error state
- **Customizable**: Configure field names and behavior
- **Works with undo/redo**: Action names like `async:fetchUsers:start`, `async:fetchUsers:success`

**Action Lifecycle:**

1. **Start**: Sets `loading: true`, optionally resets `error: null`
2. **Success**: Sets `loading: false`, `error: null`, applies returned state
3. **Error**: Sets `loading: false`, `error: <Error>`

---

### computedStore

**NEW in v0.2.5:** Create a memoized computed store with dependency tracking.

```typescript
function computedStore<T extends object, R>(
  source: Reactor<T>,
  compute: (state: T) => R,
  options?: ComputedStoreOptions<R>
): Readable<R>
```

**Parameters:**

- `source: Reactor<T>` - Source reactor to derive from
- `compute: (state: T) => R` - Computation function
- `options?: ComputedStoreOptions<R>` - Optional configuration

**ComputedStoreOptions:**

```typescript
interface ComputedStoreOptions<R> {
  // Dependency keys - only recompute when these fields change
  // Supports nested paths: 'user.profile.name'
  keys?: string[];

  // Custom equality function for result comparison
  // Prevents updates if new result equals previous result
  // Default: (a, b) => a === b
  equals?: (a: R, b: R) => boolean;
}
```

**Returns:** `Readable<R>` - Svelte-compatible readable store

**Features:**

- 🎯 **Dependency tracking** - Only recomputes when specified fields change
- ⚡ **Smart caching** - Avoids expensive recomputations (2-10x faster)
- 📦 **Stable references** - Returns same object if content unchanged
- 🔗 **Composable** - Works with `derived()`, `get()`, and all Svelte APIs
- 🌲 **Tree-shakeable** - Only adds ~1KB when used

**Basic Example:**

```typescript
import { createReactor, computedStore } from 'svelte-reactor';

const store = createReactor({
  items: [
    { id: 1, name: 'Apple', done: false },
    { id: 2, name: 'Banana', done: true },
    { id: 3, name: 'Orange', done: false }
  ],
  filter: 'all',
  metadata: { lastUpdated: Date.now() }
});

// Computed store - only recalculates when items or filter change
const filteredItems = computedStore(
  store,
  state => {
    if (state.filter === 'completed') return state.items.filter(item => item.done);
    if (state.filter === 'active') return state.items.filter(item => !item.done);
    return state.items;
  },
  {
    keys: ['items', 'filter']  // Only recompute when these change
  }
);

// Use like any Svelte store
filteredItems.subscribe(items => console.log(items));
console.log(get(filteredItems));

// Updating metadata doesn't trigger recomputation! 🚀
store.update(s => { s.metadata.lastUpdated = Date.now(); });
```

**With Custom Equality:**

```typescript
import { computedStore, isEqual } from 'svelte-reactor';

const computed = computedStore(
  store,
  state => expensiveCalculation(state.data),
  {
    keys: ['data', 'settings.theme'],  // Supports nested paths
    equals: isEqual  // Deep equality check
  }
);

// Won't notify subscribers if result is deeply equal
store.update(s => { s.data = [...s.data]; }); // Same content = no notification
```

**Shopping Cart Example:**

```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const cart = createReactor({
  items: [] as CartItem[],
  discount: 0,
  taxRate: 0.1,
  metadata: { lastModified: Date.now() }
});

// Computed total - only recalculates when relevant fields change
const total = computedStore(
  cart,
  state => {
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const afterDiscount = subtotal * (1 - state.discount);
    return afterDiscount * (1 + state.taxRate);
  },
  {
    keys: ['items', 'discount', 'taxRate']
    // metadata changes won't trigger recalculation!
  }
);

// In Svelte component
$: totalPrice = $total;  // Reactively updates, but efficiently!
```

**Performance Comparison:**

```typescript
// ❌ Without computedStore - recalculates on EVERY state change
const total = derived(cart, $cart => expensiveCalculation($cart));

// ✅ With computedStore - recalculates only when dependencies change
const total = computedStore(
  cart,
  state => expensiveCalculation(state),
  { keys: ['items', 'prices'] }
);

// Performance benefit: 2-10x faster for expensive computations
```

**Nested Path Support:**

```typescript
const store = createReactor({
  user: {
    profile: {
      name: 'John',
      avatar: 'url'
    },
    settings: {
      theme: 'dark'
    }
  },
  metadata: { version: 1 }
});

const userName = computedStore(
  store,
  state => state.user.profile.name.toUpperCase(),
  {
    keys: ['user.profile.name']  // Nested path tracking!
  }
);

// Only recomputes when user.profile.name changes
// Changes to theme, avatar, or metadata won't trigger recomputation
```

**Use Cases:**

- 📊 **Expensive filters/sorts** - Only recompute when data or criteria change
- 🛒 **Shopping cart totals** - Only recalculate when items or prices change
- 📝 **Form validation** - Only validate when relevant fields change
- 🎨 **UI computations** - Only update styles when theme changes
- 🔍 **Search results** - Only filter when query or data changes

**Tips:**

- Use `keys` option when you know which fields affect the computation
- Use `equals: isEqual` for deep comparison of arrays/objects
- Omit `keys` to compute on every state change (like `derived()`)
- Combine with `derived()` for multi-store computations

---

## Svelte Store Utilities

**NEW in v0.2.4:** Re-exported from `svelte/store` for convenience.

All svelte-reactor stores are 100% compatible with Svelte's store API. These utilities are re-exported so you can import everything from a single source.

### derived

Create a store whose value is computed from one or more other stores.

```typescript
function derived<S extends Stores, T>(
  stores: S,
  fn: (values: StoresValues<S>) => T,
  initial_value?: T
): Readable<T>
```

**Parameters:**

- `stores: S` - One or more stores to derive from (single store or array)
- `fn: (values: StoresValues<S>) => T` - Function that computes the derived value
- `initial_value?: T` - Optional initial value (computed immediately if not provided)

**Returns:** `Readable<T>` - A readonly store with the computed value

**Examples:**

```typescript
import { simpleStore, derived } from 'svelte-reactor';

// Single store
const count = simpleStore(0);
const doubled = derived(count, $count => $count * 2);

// Multiple stores
const firstName = simpleStore('John');
const lastName = simpleStore('Doe');
const fullName = derived(
  [firstName, lastName],
  ([$first, $last]) => `${$first} ${$last}`
);

// With initial value
const delayedCount = derived(count, $count => $count * 2, 0);
```

**With createReactor:**

```typescript
import { createReactor, derived } from 'svelte-reactor';

interface CartState {
  items: Array<{ price: number; quantity: number }>;
}

const cart = createReactor<CartState>({ items: [] });

const totalPrice = derived(
  cart,
  $cart => $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const totalItems = derived(
  cart,
  $cart => $cart.items.reduce((sum, item) => sum + item.quantity, 0)
);

const cartSummary = derived(
  [totalPrice, totalItems],
  ([$price, $items]) => ({ price: $price, items: $items })
);
```

---

### get

Get the current value from a store without subscribing.

```typescript
function get<T>(store: Readable<T>): T
```

**Parameters:**

- `store: Readable<T>` - Any Svelte store (writable, readable, or derived)

**Returns:** `T` - The current value of the store

**Examples:**

```typescript
import { simpleStore, derived, get } from 'svelte-reactor';

const count = simpleStore(42);
console.log(get(count)); // 42

const doubled = derived(count, $count => $count * 2);
console.log(get(doubled)); // 84

count.set(100);
console.log(get(count)); // 100
console.log(get(doubled)); // 200
```

**With createReactor:**

```typescript
import { createReactor, get } from 'svelte-reactor';

const user = createReactor({ name: 'John', age: 30 });

console.log(get(user)); // { name: 'John', age: 30 }

user.update(state => {
  state.age = 31;
});

console.log(get(user).age); // 31
```

**Note:** `get()` subscribes, reads the value, and immediately unsubscribes. For frequent reads, consider using a regular subscription.

---

### readonly

Create a readonly version of a store.

```typescript
function readonly<T>(store: Readable<T>): Readable<T>
```

**Parameters:**

- `store: Readable<T>` - Any Svelte store

**Returns:** `Readable<T>` - A readonly store (no `set` or `update` methods)

**Examples:**

```typescript
import { simpleStore, readonly, get } from 'svelte-reactor';

const count = simpleStore(0);
const readonlyCount = readonly(count);

// readonlyCount has no set() or update() methods
// readonlyCount.set(5); // TypeScript error

// But subscribing and reading work
readonlyCount.subscribe(value => console.log(value));
console.log(get(readonlyCount)); // 0

// Changes to original are reflected
count.set(42);
console.log(get(readonlyCount)); // 42
```

**Use cases:**

- Expose state to components without allowing modifications
- Create public API for a private writable store
- Prevent accidental state mutations

```typescript
// Private writable store
const _settings = simpleStore({ theme: 'dark', lang: 'en' });

// Public readonly export
export const settings = readonly(_settings);

// Only internal code can modify
export function setTheme(theme: string) {
  _settings.update(s => { s.theme = theme; });
}
```

---

## DevTools

### createDevTools

Create a DevTools instance for time-travel debugging and state inspection.

```typescript
function createDevTools<T extends object>(
  reactor: Reactor<T>,
  options?: { name?: string }
): ReactorDevTools<T>
```

**Parameters:**

- `reactor: Reactor<T>` - The reactor instance
- `options?: { name?: string }` - Optional DevTools name

**Returns:** `ReactorDevTools<T>`

**Example:**

```typescript
import { createReactor } from 'svelte-reactor';
import { createDevTools } from 'svelte-reactor/devtools';

const reactor = createReactor({ value: 0 });
const devtools = createDevTools(reactor, { name: 'Counter' });
```

---

### ReactorDevTools Interface

```typescript
interface ReactorDevTools<T extends object> {
  // Jump to specific history index
  timeTravel(index: number): void;

  // Export state as JSON string
  exportState(): string;

  // Import state from JSON string
  importState(json: string): void;

  // Reset to initial state
  reset(): void;

  // Get state at specific index
  getStateAt(index: number): { state: T; timestamp: number } | null;

  // Subscribe to state changes
  subscribe(callback: (state: T) => void): () => void;
}
```

#### timeTravel(index)

Jump to a specific point in history.

```typescript
function timeTravel(index: number): void
```

**Example:**

```typescript
devtools.timeTravel(5); // Jump to history index 5
```

#### exportState()

Export complete reactor state as JSON string.

```typescript
function exportState(): string
```

**Returns:** JSON string containing state, history, plugins, and middlewares

**Example:**

```typescript
const snapshot = devtools.exportState();
localStorage.setItem('reactor-snapshot', snapshot);
```

#### importState(json)

Import state from JSON string.

```typescript
function importState(json: string): void
```

**Example:**

```typescript
const snapshot = localStorage.getItem('reactor-snapshot');
if (snapshot) {
  devtools.importState(snapshot);
}
```

#### reset()

Reset reactor to initial state and clear history.

```typescript
function reset(): void
```

#### getStateAt(index)

Get state at specific history index.

```typescript
function getStateAt(index: number): { state: T; timestamp: number } | null
```

**Example:**

```typescript
const info = devtools.getStateAt(3);
if (info) {
  console.log('State:', info.state);
  console.log('Timestamp:', new Date(info.timestamp));
}
```

#### subscribe(callback)

Subscribe to state changes.

```typescript
function subscribe(callback: (state: T) => void): () => void
```

**Returns:** Unsubscribe function

**Example:**

```typescript
const unsubscribe = devtools.subscribe(state => {
  console.log('State changed:', state);
});

// Later...
unsubscribe();
```

---

## Types

### ReactorPlugin

Plugin interface for extending reactor functionality.

```typescript
interface ReactorPlugin<T extends object> {
  install: (reactor: Reactor<T>) => {
    middlewares?: Middleware<T>[];
    methods?: Record<string, unknown>;
  };
}
```

### Middleware

Middleware for intercepting state changes.

```typescript
interface Middleware<T extends object> {
  name: string;
  onBeforeUpdate?: (prevState: T, nextState: T, action?: string) => void;
  onAfterUpdate?: (prevState: T, nextState: T, action?: string) => void;
  onError?: (error: Error) => void;
}
```

### HistoryEntry

History entry for undo/redo.

```typescript
interface HistoryEntry<T> {
  state: T;
  timestamp: number;
}
```

### ReactorInspection

Reactor inspection information.

```typescript
interface ReactorInspection {
  name?: string;
  state: unknown;
  plugins: string[];
  middlewares: string[];
  history?: {
    past: number;
    current: boolean;
    future: number;
  };
}
```

### ReactorError ✨ NEW in v0.2.7

Custom error class with rich context for debugging.

```typescript
import { ReactorError } from 'svelte-reactor';

interface ReactorErrorContext {
  reactor?: string;   // Reactor name
  action?: string;    // Action being performed
  plugin?: string;    // Plugin that caused error
  state?: unknown;    // State at time of error
  cause?: Error;      // Original error
  tip?: string;       // Helpful suggestion
}

class ReactorError extends Error {
  readonly context: ReactorErrorContext;

  constructor(message: string, context?: ReactorErrorContext);

  // Format error with full context
  toString(): string;

  // Static factory methods
  static withTip(message: string, tip: string, context?: Omit<ReactorErrorContext, 'tip'>): ReactorError;
  static destroyed(reactorName?: string): ReactorError;
  static invalidState(message: string, reactorName?: string, state?: unknown): ReactorError;
  static pluginError(pluginName: string, message: string, cause?: Error): ReactorError;
}
```

**Example:**

```typescript
// Throwing with context
throw new ReactorError('Update failed', {
  reactor: 'counter',
  action: 'increment',
  tip: 'Check if state is initialized correctly.'
});

// Output:
// [Reactor:counter] Update failed
//   Action: increment
//   Tip: Check if state is initialized correctly.

// Using static methods
throw ReactorError.destroyed('myStore');
// [Reactor:myStore] Cannot operate on destroyed reactor
//   Tip: Create a new reactor instance or check your cleanup logic.

throw ReactorError.pluginError('persist', 'Storage quota exceeded');
// [Reactor] Plugin "persist" failed: Storage quota exceeded
//   Plugin: persist
//   Tip: Check the "persist" plugin configuration and state compatibility.
```

---

## Migration Guide

### From v0.1.x to v0.2.x

**New Features:**
- `arrayActions()` helper for array CRUD operations
- `persist` plugin now syncs across tabs (localStorage) and detects DevTools changes
- 149 tests (was 93)

**API Changes:**
- No breaking changes

**Improvements:**
- `persist` plugin auto-syncs when storage changes externally
- Better debugging with `arrayActions` automatic action names

**Example Migration:**

```typescript
// Before (v0.1.x)
function addTodo(text) {
  todos.update(s => ({
    items: [...s.items, { id: Date.now(), text, done: false }]
  }));
}

// After (v0.2.x) - using arrayActions
const actions = arrayActions(todos, 'items', { idKey: 'id' });
actions.add({ id: Date.now(), text, done: false });
```

### From v0.2.2 to v0.2.3

**New Features:**
- **persist plugin** - `pick` and `omit` options for selective persistence (+8 tests)
- **arrayActions** - `sort()`, `bulkUpdate()`, `bulkRemove()` methods (+13 tests)
- **asyncActions** - Retry logic, debouncing, and cancellation (+14 tests)
- **logger plugin** - Advanced filtering, performance tracking (+12 tests)
- **Integration tests** - 5 new complex scenario tests (+11 tests)
- 232 tests (was 174, +58 new tests)

**Bug Fixes:**
- Fixed unhandled promise rejection on cancellation (asyncActions)
- Fixed debounce cancellation with promise chains
- Fixed empty pick array handling (persist plugin)

**No Breaking Changes** - Fully backward compatible

### From v0.2.1 to v0.2.2

**Bug Fixes:**
- Memory leak fixes - Proper cleanup of subscribers and middlewares on destroy
- Performance optimization - Skip unnecessary updates when state unchanged
- Enhanced error handling - Better validation and context-aware error messages
- Persist plugin improvements - Quota exceeded handling and auto-cleanup
- 181 tests (was 172)

**No Breaking Changes** - Fully backward compatible

### From v0.2.x to v0.3.x (Planned)

- IndexedDB storage adapter
- Computed/Derived State API
- Selectors API with memoization
- Multi-tab sync with BroadcastChannel

---

## Performance Notes

- **State updates**: ~0.037ms for simple updates
- **Undo/Redo overhead**: ~0.05ms per operation
- **Bundle size**: 13.27 KB gzipped (full package with v0.2.3 features), 1.05 KB (plugins only)
- **Memory**: History limited by `undoRedo({ limit })` option
- **Test coverage**: 232 comprehensive tests

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks.
