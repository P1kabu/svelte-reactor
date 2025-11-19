# API Reference

Complete API documentation for svelte-reactor.

## Table of Contents

- [Core API](#core-api)
  - [createReactor](#createreactor)
  - [Reactor Interface](#reactor-interface)
- [Plugins](#plugins)
  - [undoRedo](#undoredo)
  - [persist](#persist)
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
- [Utilities](#utilities)
  - [diff](#diff)
  - [applyPatch](#applypatch)
  - [getChangeSummary](#getchangesummary)
  - [deepClone](#deepclone)
  - [isEqual](#isequal)
- [Types](#types)

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

**Storage Type Comparison:**

| Storage Type | Capacity | Persistence | Best For |
|--------------|----------|-------------|----------|
| `localStorage` | 5-10 MB | Forever | Settings, preferences |
| `sessionStorage` | 5-10 MB | Tab session | Temporary data, forms |
| `indexedDB` | 50+ MB | Forever | Large datasets, offline data |
| `memory` | Unlimited | Runtime | Testing, SSR |

**TTL Support (v0.2.4):**

```typescript
// Example 4: API Cache with auto-expiration
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

## Utilities

### diff

Compare two states and return a diff result.

```typescript
function diff<T extends object>(
  oldState: T,
  newState: T
): DiffResult
```

**DiffResult:**

```typescript
interface DiffResult {
  changes: DiffEntry[];
  hasChanges: boolean;
}

interface DiffEntry {
  path: string[];
  type: 'add' | 'remove' | 'modify';
  oldValue?: unknown;
  newValue?: unknown;
}
```

**Example:**

```typescript
import { diff } from 'svelte-reactor/utils';

const oldState = { user: { name: 'Alice', age: 30 }, count: 5 };
const newState = { user: { name: 'Bob', age: 30 }, count: 5, active: true };

const result = diff(oldState, newState);
// {
//   hasChanges: true,
//   changes: [
//     { path: ['user', 'name'], type: 'modify', oldValue: 'Alice', newValue: 'Bob' },
//     { path: ['active'], type: 'add', newValue: true }
//   ]
// }
```

---

### applyPatch

Apply a diff patch to a state object.

```typescript
function applyPatch<T extends object>(
  state: T,
  diffResult: DiffResult
): T
```

**Example:**

```typescript
import { diff, applyPatch } from 'svelte-reactor/utils';

const oldState = { value: 1 };
const newState = { value: 2 };
const changes = diff(oldState, newState);

const patched = applyPatch(oldState, changes);
// patched = { value: 2 }
```

---

### getChangeSummary

Get a summary of changes from a diff result.

```typescript
function getChangeSummary(
  diffResult: DiffResult
): { added: number; modified: number; removed: number }
```

**Example:**

```typescript
import { diff, getChangeSummary } from 'svelte-reactor/utils';

const changes = diff(oldState, newState);
const summary = getChangeSummary(changes);
// { added: 2, modified: 3, removed: 1 }
```

---

### deepClone

Create a deep clone of an object using `structuredClone`.

```typescript
function deepClone<T>(obj: T): T
```

**Example:**

```typescript
import { deepClone } from 'svelte-reactor/utils';

const original = { user: { name: 'Alice' }, items: [1, 2, 3] };
const cloned = deepClone(original);

cloned.user.name = 'Bob';
console.log(original.user.name); // 'Alice' (unchanged)
```

---

### isEqual

Deep equality check for two values.

```typescript
function isEqual(a: unknown, b: unknown): boolean
```

**Example:**

```typescript
import { isEqual } from 'svelte-reactor/utils';

isEqual({ a: 1 }, { a: 1 }); // true
isEqual({ a: 1 }, { a: 2 }); // false
isEqual([1, 2], [1, 2]); // true
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
