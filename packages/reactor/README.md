# svelte-reactor

> **Production-ready** reactive state management for Svelte 5 with full **Svelte stores API** compatibility

[![npm version](https://img.shields.io/npm/v/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![npm downloads](https://img.shields.io/npm/dm/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-reactor?style=flat&label=gzip)](https://bundlephobia.com/package/svelte-reactor)
[![Build Status](https://github.com/P1kabu/svelte-reactor/workflows/CI/badge.svg)](https://github.com/P1kabu/svelte-reactor/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

**The most powerful state management for Svelte 5** - Combines the simplicity of Svelte stores with advanced features like undo/redo, persistence, and time-travel debugging.

## ✨ What's New in v0.2.7 - "Performance & Polish"

🎯 **`reactor.select()` Method** - Simpler API for selective subscriptions
🛡️ **`ReactorError` Class** - Rich error context with reactor name, action, plugin, tips
⚡ **Async Concurrency Control** - `concurrency: 'replace' | 'queue' | 'parallel'` for race conditions
🔧 **DevTools Fix** - Real subscription instead of polling (major CPU/memory improvement)
📦 **Optimized Cloning** - Clone states once and reuse in notifySubscribers
🤖 **AI Instructions Optimized** - 79% smaller (2430 → 498 lines), tailored for each AI
✅ **486 tests** - All features thoroughly tested

**Documentation:**
- 📖 **[PLUGINS.md](./PLUGINS.md)** - Complete plugin development guide with 4 working examples
- 🚀 **[PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)** - Optimization strategies with 5 runnable demos
- 🛡️ **[ERROR_HANDLING.md](./ERROR_HANDLING.md)** - Error handling patterns with 20 examples

Previous versions:
- **v0.2.5**: Selective subscriptions, computed stores, 25% smaller bundle
- **v0.2.4**: IndexedDB storage, TTL, pagination, derived stores export
- **v0.2.3**: Selective persistence, retry/cancellation, bulk operations

👉 **[Quick Start Guide](./QUICK_START.md)** | **[Migration Guide](./MIGRATION.md)** | **[v0.2.7 Upgrade](../../UPGRADES/UPGRADE-0.2.7.md)**

## 🚀 Features

- **✅ Svelte Stores Compatible** - Full `subscribe()` API, works with `$store` auto-subscription
- **🎯 Selective Subscriptions** - `reactor.select()` for subscribing to specific state parts ✨ Improved in v0.2.7
- **📊 Computed Stores** - Memoized computed state with dependency tracking (2-10x faster) ✨ NEW in v0.2.5
- **🔗 Derived Stores** - `derived()`, `get()`, `readonly()` exported for single-import convenience
- **📦 Simple Helpers** - `simpleStore()`, `persistedStore()`, `arrayActions()`, `asyncActions()`, `computedStore()`
- **🤖 AI-Powered Development** - Built-in AI assistant integration (Claude, Cursor, Copilot)
- **♻️ Undo/Redo** - Built-in history management with batch operations
- **💾 Smart Persistence** - localStorage, sessionStorage, IndexedDB (50MB+), **Memory Storage** ✨ NEW in v0.2.5
- **🗜️ Data Compression** - Built-in LZ compression (40-70% smaller, tree-shakeable) ✨ NEW in v0.2.5
- **🔄 Multi-Tab Sync** - Real-time synchronization across browser tabs ✨ NEW in v0.2.5
- **🔒 Security First** - Exclude sensitive data (tokens, passwords) from persistence
- **🔄 Network Resilience** - Retry logic with exponential backoff, request cancellation
- **📊 Bulk Operations** - Sort, bulk update/remove for arrays
- **🎯 Advanced Logging** - Filter by action/state, performance tracking
- **🎮 DevTools** - Time-travel debugging and state inspection
- **⚡ SSR-Ready** - Works seamlessly with SvelteKit on server and client
- **🎯 Type-safe** - Full TypeScript support with excellent inference
- **🪶 Lightweight** - **11.04 KB gzipped** (core), tree-shakeable modules ✨ 25% smaller in v0.2.5
- **📚 Rich Documentation** - 3+ comprehensive guides (plugins, performance, error handling)
- **0️⃣ Zero dependencies** - Only requires Svelte 5

## Installation

```bash
npm install svelte-reactor
```

```bash
pnpm add svelte-reactor
```

```bash
yarn add svelte-reactor
```

## Upgrading

📖 **[View All Upgrade Guides](../../UPGRADES/)**

- [v0.2.3](../../UPGRADES/UPGRADE-0.2.3.md) - Feature enhancements (selective persistence, retry, bulk ops)
- [v0.2.2](../../UPGRADES/UPGRADE-0.2.2.md) - Bug fixes & stability improvements

For general migration tips, see [MIGRATION.md](./MIGRATION.md).

### 🤖 AI Assistant Setup (Optional)

Supercharge your development with AI-powered code suggestions! Run this once to configure your AI assistant:

```bash
npx svelte-reactor init-ai
```

This will generate AI instructions for:
- **Claude Code** - `.claude/README.md` (automatically read by Claude)
- **Cursor AI** - `.cursorrules` (automatically read by Cursor)
- **GitHub Copilot** - `.github/copilot-instructions.md`

Your AI assistant will then understand svelte-reactor patterns and suggest optimal code!

**Advanced options:**
```bash
# Merge with existing AI instructions
npx svelte-reactor init-ai --merge

# Overwrite existing files
npx svelte-reactor init-ai --force
```

## 📖 Quick Start

### 🎯 Simple Counter (3 lines!)

```typescript
import { simpleStore } from 'svelte-reactor';

export const counter = simpleStore(0);
```

```svelte
<script>
  import { counter } from './stores';
</script>

<!-- Works with $ auto-subscription! -->
<button onclick={() => counter.update(n => n + 1)}>
  Count: {$counter}
</button>
```

### 💾 Persisted Counter (Auto-saves to localStorage)

```typescript
import { persistedStore } from 'svelte-reactor';

// Automatically persists to localStorage
export const counter = persistedStore('counter', 0);
```

```svelte
<script>
  import { counter } from './stores';
</script>

<!-- State persists across page reloads! -->
<button onclick={() => counter.update(n => n + 1)}>
  Count: {$counter}
</button>
```

### 🔒 Secure User Store (Exclude sensitive data) - NEW in v0.2.3

```typescript
import { persistedStore } from 'svelte-reactor';

export const user = persistedStore('user', {
  name: 'John',
  email: 'john@example.com',
  token: 'secret_token_123',
  sessionId: 'temp_session',
  preferences: { theme: 'dark' }
}, {
  // Option 1: Only persist specific fields
  pick: ['name', 'email', 'preferences'],

  // Option 2: Exclude sensitive fields (can't use both)
  // omit: ['token', 'sessionId']
});

// Tokens never saved to localStorage - secure by default!
```

### ♻️ Advanced Store with Undo/Redo

```typescript
import { persistedReactor } from 'svelte-reactor';
import { undoRedo, logger } from 'svelte-reactor/plugins';

export const editor = persistedReactor('editor', {
  content: '',
  history: []
}, {
  additionalPlugins: [
    undoRedo({ limit: 50 }),
    logger({ collapsed: true })
  ]
});
```

```svelte
<script>
  import { editor } from './stores';
</script>

<textarea bind:value={editor.state.content}></textarea>

<button onclick={() => editor.undo()} disabled={!editor.canUndo()}>
  Undo ↩
</button>
<button onclick={() => editor.redo()} disabled={!editor.canRedo()}>
  Redo ↪
</button>
```

## 📚 API Overview

### Helper Functions (Recommended)

#### `simpleStore(initialValue, options?)`

Simple writable store compatible with Svelte's `$store` syntax.

**→ [See full example in Quick Start](./QUICK_START.md#simple-counter-store)**

```typescript
import { simpleStore } from 'svelte-reactor';

const counter = simpleStore(0);
counter.subscribe(value => console.log(value));
counter.update(n => n + 1);
counter.set(5);
console.log(counter.get()); // 5
```

#### `persistedStore(key, initialValue, options?)`

Create a store that automatically persists to localStorage, sessionStorage, or IndexedDB.

**→ [See full example in Quick Start](./QUICK_START.md#persisted-store-auto-save-to-localstorage)**

```typescript
import { persistedStore } from 'svelte-reactor';

const settings = persistedStore('app-settings', { theme: 'dark' }, {
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  debounce: 300,           // Save after 300ms of inactivity

  // NEW in v0.2.3: Security options
  omit: ['user.token', 'temp'], // Exclude sensitive/temporary data
  // OR
  pick: ['theme', 'lang'],      // Only persist specific fields (can't use both)
});
```

#### `persistedReactor(key, initialState, options?)`

Full reactor API with automatic persistence and plugin support.

**→ [See full example in Quick Start](./QUICK_START.md#full-reactor-with-undoredo)**

```typescript
import { persistedReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

const store = persistedReactor('my-state', { count: 0 }, {
  additionalPlugins: [undoRedo()],
  omit: ['temp'], // Exclude temporary fields
});

store.update(s => { s.count++; });
store.undo(); // Undo last change
```

#### `arrayActions(reactor, field, options?)`

Simplify array management with built-in CRUD operations.

**→ [See Migration Guide](./MIGRATION.md#working-with-arrays)**

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

const todos = createReactor({ items: [] });
const actions = arrayActions(todos, 'items', { idKey: 'id' });

// Simple CRUD - no manual update() needed!
actions.add({ id: '1', text: 'Buy milk', done: false, priority: 1 });
actions.update('1', { done: true });
actions.toggle('1', 'done');
actions.remove('1');

// NEW in v0.2.3: Sorting and bulk operations
actions.sort((a, b) => a.priority - b.priority); // Sort by priority
actions.bulkUpdate(['1', '2', '3'], { done: true }); // Update multiple
actions.bulkRemove(['1', '2']); // Remove multiple
actions.bulkRemove(item => item.done); // Remove by predicate

// Query operations
const item = actions.find('1');
const count = actions.count();

// NEW in v0.2.4: Pagination for large datasets
const paginated = arrayActions(todos, 'items', {
  idKey: 'id',
  pagination: {
    pageSize: 20,      // Items per page
    initialPage: 1     // Starting page
  }
});

// Get paginated data with metadata
const { items, page, totalPages, hasNext, hasPrev } = paginated.getPaginated();

// Navigation
paginated.nextPage();   // Go to next page (returns false if on last page)
paginated.prevPage();   // Go to previous page (returns false if on first page)
paginated.setPage(5);   // Jump to specific page
paginated.firstPage();  // Jump to first page
paginated.lastPage();   // Jump to last page
```

#### `asyncActions(reactor, actions, options?)`

Manage async operations with automatic loading and error states.

**→ [See Migration Guide](./MIGRATION.md#async-operations--loading-states)**

```typescript
import { createReactor, asyncActions } from 'svelte-reactor';

const store = createReactor({
  users: [],
  loading: false,
  error: null
});

const api = asyncActions(store, {
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch');
    return { users: await response.json() };
  },
  searchUsers: async (query: string) => {
    const response = await fetch(`/api/users?q=${query}`);
    return { users: await response.json() };
  }
}, {
  // NEW in v0.2.3: Retry with exponential backoff
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential' // 1s, 2s, 4s, 8s...
  },
  // NEW in v0.2.3: Debounce for search
  debounce: 300 // Wait 300ms before executing
});

// Automatic loading & error management!
await api.fetchUsers();
// Automatically retries 3 times on failure!

// Debounced search - only last call executes
api.searchUsers('j');
api.searchUsers('jo');
api.searchUsers('john'); // Only this one runs after 300ms

// Manual cancellation
const controller = api.fetchUsers();
controller.cancel(); // Cancel in-flight request
```

---

### 🔗 Derived Stores

**NEW in v0.2.4:** `derived`, `get`, and `readonly` are now exported from `svelte-reactor` for convenience!

All svelte-reactor stores are 100% compatible with Svelte's store API, including `derived()` stores. You can now import everything from a single source:

```typescript
import { simpleStore, derived, get, readonly } from 'svelte-reactor';

// Create base stores
const firstName = simpleStore('John');
const lastName = simpleStore('Doe');

// Derive computed values
const fullName = derived(
  [firstName, lastName],
  ([$first, $last]) => `${$first} ${$last}`
);

console.log(get(fullName)); // "John Doe"

firstName.set('Jane');
console.log(get(fullName)); // "Jane Doe"

// Create readonly versions
const readonlyName = readonly(fullName);
// readonlyName has no .set() or .update() methods
```

**Real-world example - Shopping Cart:**

```typescript
import { createReactor, derived, get } from 'svelte-reactor';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const cart = createReactor<{ items: CartItem[] }>({
  items: []
});

// Derive total items
const totalItems = derived(
  cart,
  $cart => $cart.items.reduce((sum, item) => sum + item.quantity, 0)
);

// Derive total price
const totalPrice = derived(
  cart,
  $cart => $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// Combine derived stores
const cartSummary = derived(
  [totalItems, totalPrice],
  ([$items, $price]) => `${$items} items - $${$price.toFixed(2)}`
);

// Add items to cart
cart.update(state => {
  state.items.push({ id: 1, name: 'Product A', price: 10, quantity: 2 });
});

console.log(get(cartSummary)); // "2 items - $20.00"
```

**Why use derived stores?**
- ✅ **Automatic updates** - Recomputes when dependencies change
- ✅ **Memoization** - Only recomputes when inputs change
- ✅ **Composable** - Combine multiple stores easily
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Single import** - No need to import from `svelte/store`

**Exported utilities:**
- `derived()` - Create computed stores from one or more stores
- `get()` - Get current value from any store (one-time read)
- `readonly()` - Create read-only version of a store

---

### 🎯 Selective Subscriptions

**NEW in v0.2.5:** Subscribe to specific parts of state for better performance!

Instead of subscribing to the entire state, you can subscribe to just the parts you care about. The callback only fires when the selected value changes.

**Basic example:**

```typescript
import { createReactor } from 'svelte-reactor';

const store = createReactor({
  user: { name: 'John', age: 30 },
  count: 0
});

// Selective subscribe - only fires when user.name changes
store.subscribe({
  selector: state => state.user.name,
  onChanged: (name, prevName) => {
    console.log(`Name: ${prevName} → ${name}`);
  }
});

store.update(s => { s.count++; });        // ❌ Callback NOT called
store.update(s => { s.user.age = 31; });  // ❌ Callback NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Callback called!
```

**Advanced options:**

```typescript
import { isEqual } from 'svelte-reactor';

store.subscribe({
  selector: state => state.items,
  onChanged: (items) => console.log(items),

  // Don't fire immediately (default: true)
  fireImmediately: false,

  // Custom equality (useful for arrays/objects)
  equalityFn: isEqual  // Deep comparison
});
```

**Why use selective subscriptions?**
- ⚡ **Performance** - Avoid unnecessary re-renders and computations
- 🎯 **Precision** - React only to relevant state changes
- 🧩 **Composable** - Multiple selective subscriptions per store
- 🔌 **Svelte-compatible** - Works seamlessly with `derived()`, `get()`, etc.

**Real-world example - Form validation:**

```typescript
const form = createReactor({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Validate each field independently
form.subscribe({
  selector: s => s.email,
  onChanged: (email) => validateEmail(email)
});

form.subscribe({
  selector: s => [s.password, s.confirmPassword],
  onChanged: ([pwd, confirm]) => validatePasswordMatch(pwd, confirm),
  equalityFn: isEqual  // Deep comparison for arrays
});

// Changes to 'name' don't trigger email or password validation! 🎯
```

**See [EXAMPLES.md](./EXAMPLES.md#selective-subscriptions) for more patterns**

---

### 📊 Computed Stores

**NEW in v0.2.5:** Memoized computed state with dependency tracking!

Instead of recomputing on every state change, `computedStore()` intelligently tracks dependencies and only recomputes when they change. This provides massive performance benefits for expensive operations.

**Basic example:**

```typescript
import { createReactor, computedStore } from 'svelte-reactor';

const store = createReactor({
  items: [
    { id: 1, name: 'Apple', done: false },
    { id: 2, name: 'Banana', done: true },
    { id: 3, name: 'Orange', done: false }
  ],
  filter: 'all'
});

// Computed store - automatically updates when items or filter change
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
```

**Advanced options:**

```typescript
import { computedStore, isEqual } from 'svelte-reactor';

const computed = computedStore(
  store,
  state => expensiveComputation(state.data),
  {
    // Dependency tracking - only recompute when these fields change
    keys: ['data', 'user.preferences'],  // Supports nested paths!

    // Custom equality - prevents updates if result is deeply equal
    equals: isEqual  // Use deep comparison instead of ===
  }
);
```

**Why use computed stores?**
- ⚡ **Performance** - Avoid expensive recomputations (2-10x faster)
- 🎯 **Smart caching** - Only recomputes when dependencies change
- 📦 **Stable references** - Same result object if content unchanged
- 🔗 **Composable** - Works with `derived()`, `get()`, and all Svelte APIs

**Real-world example - Shopping cart:**

```typescript
const cart = createReactor({
  items: [
    { id: 1, name: 'Laptop', price: 999, quantity: 1 },
    { id: 2, name: 'Mouse', price: 29, quantity: 2 }
  ],
  discount: 0,
  taxRate: 0.1
});

// Computed total - only recalculates when items, discount, or taxRate change
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
  }
);

// In Svelte component
$: totalPrice = $total;  // Reactively updates, but efficiently!
```

**Performance comparison:**

```typescript
// ❌ Without computedStore - recalculates on EVERY state change
const total = derived(cart, $cart => expensiveCalculation($cart));

// ✅ With computedStore - recalculates only when dependencies change
const total = computedStore(
  cart,
  state => expensiveCalculation(state),
  { keys: ['items', 'discount'] }
);

// Updating metadata won't trigger recomputation! 🚀
cart.update(s => { s.metadata.lastUpdated = Date.now(); });
```

**See [EXAMPLES.md](./EXAMPLES.md#computed-stores) for more patterns**

---

### 💾 IndexedDB Storage

**NEW in v0.2.4:** Store large amounts of data (50MB+) with IndexedDB!

IndexedDB provides significantly more storage capacity than localStorage (typically 5-10MB). Perfect for:
- 📸 **Large datasets** - Photos, documents, media files
- 📊 **Offline-first apps** - Cache API responses, sync data
- 🎮 **Games** - Save states, assets, progress
- 📝 **Rich content editors** - Store documents, drafts, history

**Quick Start:**

```typescript
import { persistedStore } from 'svelte-reactor';

const photos = persistedStore('my-photos', { items: [] }, {
  storage: 'indexedDB',  // Use IndexedDB instead of localStorage
  indexedDB: {
    database: 'my-app',   // Optional: database name (default: 'svelte-reactor')
    storeName: 'photos',  // Optional: store name (default: 'state')
    version: 1            // Optional: database version (default: 1)
  }
});

// Use it like any other store!
photos.update(state => {
  state.items.push({ id: 1, url: '...', size: 5000000 }); // 5MB photo
});
```

**Storage Comparison:**

| Feature | localStorage | sessionStorage | IndexedDB | memory |
|---------|-------------|----------------|-----------|--------|
| **Capacity** | 5-10 MB | 5-10 MB | 50+ MB | Unlimited |
| **Persistence** | Forever | Tab session | Forever | Runtime only |
| **Async** | No | No | Yes (transparent) | No |
| **Performance** | Fast | Fast | Slower startup, fast after | Fastest |
| **Use Case** | Settings | Temp data | Large datasets | Testing |

**IndexedDB Configuration:**

```typescript
import { persistedReactor } from 'svelte-reactor';

const store = persistedReactor('large-data', { documents: [] }, {
  storage: 'indexedDB',
  debounce: 500,  // Debounce writes for performance

  indexedDB: {
    database: 'my-app-db',      // Database name
    storeName: 'app-state',     // Object store name
    version: 1                  // Schema version
  },

  // Exclude sensitive data
  omit: ['user.token', 'temp']
});
```

**Real-world example - Photo Gallery:**

```typescript
import { persistedStore } from 'svelte-reactor';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  size: number;
  metadata: Record<string, any>;
}

const gallery = persistedStore<{ photos: Photo[] }>(
  'photo-gallery',
  { photos: [] },
  {
    storage: 'indexedDB',
    debounce: 1000,  // Save after 1s of inactivity
    indexedDB: {
      database: 'photo-app',
      storeName: 'gallery-state',
      version: 1
    }
  }
);

// Add photos - they're automatically persisted to IndexedDB
gallery.update(state => {
  state.photos.push({
    id: crypto.randomUUID(),
    url: 'blob:...',          // Large image data
    thumbnail: 'data:...',
    size: 5242880,            // 5MB
    metadata: { /* ... */ }
  });
});

// Access in Svelte components
// {#each $gallery.photos as photo}
//   <img src={photo.url} alt="Photo" />
// {/each}
```

**Important Notes:**

⚡ **Async Behavior:** IndexedDB operations are asynchronous, but svelte-reactor provides a synchronous-like API:
- Reads happen instantly from an in-memory cache
- Writes are batched and persisted in the background
- All pending writes are automatically flushed on page unload

🔒 **Data Safety:** The persist plugin tracks all pending writes and flushes them before cleanup, ensuring no data loss even if the app closes immediately after a write.

📊 **Quota Management:** Browser quotas vary (typically 50MB-1GB). Use the storage estimate API to check available space:

```typescript
// Check storage quota
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log(`Used: ${estimate.usage} bytes`);
  console.log(`Quota: ${estimate.quota} bytes`);
  console.log(`Available: ${estimate.quota - estimate.usage} bytes`);
}
```

**When to use each storage type:**
- **localStorage** - Settings, preferences, small data (< 1MB)
- **sessionStorage** - Temporary data, form drafts, wizard state
- **indexedDB** - Large datasets, offline data, media files (> 5MB)
- **memory** - Testing, SSR, ephemeral state

---

### ⏱️ Time-To-Live (TTL) Support

**NEW in v0.2.4:** Automatically expire cached data after a specified time!

TTL (Time-To-Live) enables automatic expiration of persisted data. Perfect for:
- 🔄 **API Caches** - Auto-refresh stale data
- 🔐 **Session Data** - Auto-logout after inactivity
- 📝 **Temporary Storage** - Auto-cleanup of temporary data
- 🎯 **Fresh Content** - Ensure users see up-to-date information

**Quick Start:**

```typescript
import { persistedStore } from 'svelte-reactor';

const apiCache = persistedStore('api-cache', { data: null }, {
  ttl: 5 * 60 * 1000,  // 5 minutes in milliseconds
  onExpire: (key) => {
    console.log(`Cache expired: ${key}, fetching fresh data...`);
    // Trigger data refresh
  }
});

// Data persists for 5 minutes, then expires automatically
apiCache.update(state => {
  state.data = { users: ['Alice', 'Bob'], fetchedAt: Date.now() };
});
```

**Real-world Example - API Cache with Auto-Refresh:**

```typescript
import { persistedStore } from 'svelte-reactor';

interface CacheState {
  users: User[];
  lastFetch: number | null;
}

const userCache = persistedStore<CacheState>(
  'user-cache',
  { users: [], lastFetch: null },
  {
    storage: 'localStorage',
    ttl: 5 * 60 * 1000,  // Cache expires after 5 minutes
    onExpire: async (key) => {
      console.log('User cache expired, refreshing...');
      // Automatically refetch data when cache expires
      await fetchUsers();
    }
  }
);

async function fetchUsers() {
  const response = await fetch('/api/users');
  const users = await response.json();

  userCache.update(state => {
    state.users = users;
    state.lastFetch = Date.now();
  });
}

// On app load:
// - If cache is fresh (< 5 minutes old), use cached data ✅
// - If cache expired, onExpire triggers and fetches fresh data 🔄
```

**Session Management with Auto-Logout:**

```typescript
import { persistedStore } from 'svelte-reactor';

const session = persistedStore(
  'user-session',
  { isAuthenticated: false, userId: null, token: null },
  {
    storage: 'sessionStorage',
    ttl: 30 * 60 * 1000,  // 30 minutes
    omit: ['token'],      // Don't persist sensitive token
    onExpire: (key) => {
      console.log('Session expired, redirecting to login...');
      window.location.href = '/login';
    }
  }
);

// User stays logged in for 30 minutes of inactivity
// After 30 minutes, session expires and user is redirected to login
```

**TTL with IndexedDB:**

```typescript
import { persistedStore } from 'svelte-reactor';

const offlineQueue = persistedStore(
  'sync-queue',
  { pendingActions: [] },
  {
    storage: 'indexedDB',
    ttl: 24 * 60 * 60 * 1000,  // 24 hours
    onExpire: (key) => {
      console.log('Sync queue expired, clearing old data...');
    }
  }
);

// Offline actions persist for 24 hours, then auto-cleanup
```

**How TTL Works:**

1. 📝 **On Write:** Timestamp is automatically added to persisted data
2. 📖 **On Read:** Age is calculated and compared to TTL
3. ⏰ **If Expired:**
   - Data is removed from storage
   - `onExpire` callback is called (if provided)
   - Initial state is used instead
4. ✅ **If Fresh:** Data is loaded normally

**Important Notes:**

- ⚡ **Zero TTL (`ttl: 0`):** Data expires immediately on next load
- 🔒 **Callback Errors:** `onExpire` errors are caught and logged, won't break app
- 🎯 **Works with all storage types:** localStorage, sessionStorage, indexedDB, memory
- 🔄 **Compatible with migrations:** TTL check happens before migrations run
- 🛡️ **Type Safe:** TypeScript enforces non-negative numbers

---

### Core API

#### `createReactor(initialState, options?)`

Create a new reactor instance with undo/redo, middleware, and plugin support.

**Parameters:**

- `initialState: T` - Initial state object
- `options?: ReactorOptions<T>` - Optional configuration

**Options:**

```typescript
interface ReactorOptions<T> {
  // Plugin system
  plugins?: ReactorPlugin<T>[];

  // Reactor name (for DevTools)
  name?: string;

  // Enable DevTools integration
  devtools?: boolean;
}
```

**Returns:** `Reactor<T>`

```typescript
interface Reactor<T> {
  // State access
  state: T;

  // Svelte stores API (v0.2.0+)
  subscribe(subscriber: (state: T) => void): () => void;

  // Actions
  update(updater: (state: T) => void, action?: string): void;
  set(newState: Partial<T>): void;

  // Undo/Redo (available with undoRedo plugin)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clearHistory(): void;
  getHistory(): HistoryEntry<T>[];

  // Batch operations
  batch(fn: () => void): void;

  // DevTools
  inspect(): ReactorInspection;

  // Cleanup
  destroy(): void;
}
```

## Plugins

### Built-in Plugins

#### `undoRedo(options?)`

Enable undo/redo functionality.

```typescript
import { undoRedo } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    undoRedo({
      limit: 50,                    // History limit (default: 50)
      exclude: ['skip-history'],    // Actions to exclude from history
      compress: true,                // Compress identical consecutive states
    }),
  ],
});

// Use with action names for better debugging
reactor.update(state => { state.value++; }, 'increment');
reactor.update(state => { state.temp = 123; }, 'skip-history'); // Won't add to history
```

#### `persist(options)`

Built-in state persistence with security features.

```typescript
import { persist } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    persist({
      key: 'my-state',
      storage: 'localStorage',    // or 'sessionStorage'
      debounce: 300,               // Save after 300ms

      // NEW in v0.2.0: Security options
      omit: ['user.token'],        // Exclude sensitive fields
      pick: ['settings', 'theme'], // Or only persist specific fields

      // NEW in v0.2.0: Custom serialization
      serialize: (state) => ({      // Custom save logic
        ...state,
        savedAt: Date.now()
      }),
      deserialize: (stored) => {    // Custom load logic
        const { savedAt, ...state } = stored;
        return state;
      },

      // Optional features
      compress: false,
      version: 1,
      migrations: {
        1: (old) => ({ ...old, newField: 'value' })
      },
    }),
  ],
});
```

#### `logger(options?)`

Log all state changes to console with advanced filtering.

```typescript
import { logger } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    logger({
      collapsed: true, // Collapse console groups

      // NEW in v0.2.3: Advanced filtering
      filter: (action, state, prevState) => {
        // Only log user actions
        return action?.startsWith('user:');
        // Or only log when count changes
        // return state.count !== prevState.count;
      },

      // NEW in v0.2.3: Performance tracking
      trackPerformance: true,  // Show execution time
      slowThreshold: 100,      // Warn if action takes > 100ms
      includeTimestamp: true,  // Add timestamp to logs
      maxDepth: 3,             // Limit object depth in console
    }),
  ],
});
```

## DevTools

Built-in DevTools API for time-travel debugging and state inspection:

```typescript
import { createReactor } from 'svelte-reactor';
import { createDevTools } from 'svelte-reactor/devtools';

const reactor = createReactor({ value: 0 });
const devtools = createDevTools(reactor, { name: 'MyReactor' });

// Time travel
devtools.timeTravel(5); // Jump to history index 5

// Export/Import state
const snapshot = devtools.exportState();
devtools.importState(snapshot);

// Inspect current state
const info = devtools.getStateAt(3);
console.log(info.state, info.timestamp);

// Subscribe to changes
const unsubscribe = devtools.subscribe((state) => {
  console.log('State changed:', state);
});

// Reset to initial state
devtools.reset();
```

## Middleware

Create custom middleware for advanced use cases:

```typescript
import { createReactor } from 'svelte-reactor';

const loggingMiddleware = {
  name: 'logger',
  onBeforeUpdate(prevState, nextState, action) {
    console.log(`[${action}] Before:`, prevState);
  },
  onAfterUpdate(prevState, nextState, action) {
    console.log(`[${action}] After:`, nextState);
  },
  onError(error) {
    console.error('Error:', error);
  },
};

const reactor = createReactor(initialState, {
  plugins: [
    {
      install: () => ({ middlewares: [loggingMiddleware] })
    }
  ],
});
```

## Performance

Reactor is highly optimized for performance:

- **Simple state update**: 26,884 ops/sec (~0.037ms)
- **Update with undo/redo**: 11,636 ops/sec (~0.086ms)
- **100 sequential updates**: 331 ops/sec (~3ms)
- **Bundle size**: 14.68 KB gzipped (full package, v0.2.4)

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks.

## Examples

### Complete Todo App

```svelte
<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { persist, undoRedo } from 'svelte-reactor/plugins';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  const todos = createReactor(
    { items: [] as Todo[], filter: 'all' as 'all' | 'active' | 'done' },
    {
      plugins: [
        persist({ key: 'todos', debounce: 300 }),
        undoRedo({ limit: 50 }),
      ],
    }
  );

  let newTodoText = $state('');

  function addTodo() {
    if (!newTodoText.trim()) return;
    todos.update(state => {
      state.items.push({
        id: crypto.randomUUID(),
        text: newTodoText.trim(),
        done: false,
      });
    }, 'add-todo');
    newTodoText = '';
  }

  function toggleTodo(id: string) {
    todos.update(state => {
      const todo = state.items.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    }, 'toggle-todo');
  }

  function removeTodo(id: string) {
    todos.update(state => {
      state.items = state.items.filter(t => t.id !== id);
    }, 'remove-todo');
  }

  const filtered = $derived(
    todos.state.filter === 'all'
      ? todos.state.items
      : todos.state.items.filter(t =>
          todos.state.filter === 'done' ? t.done : !t.done
        )
  );
</script>

<input bind:value={newTodoText} onkeydown={e => e.key === 'Enter' && addTodo()} />
<button onclick={addTodo}>Add</button>

<div>
  <button onclick={() => todos.update(s => { s.filter = 'all'; })}>All</button>
  <button onclick={() => todos.update(s => { s.filter = 'active'; })}>Active</button>
  <button onclick={() => todos.update(s => { s.filter = 'done'; })}>Done</button>
</div>

{#each filtered as todo (todo.id)}
  <div>
    <input type="checkbox" checked={todo.done} onchange={() => toggleTodo(todo.id)} />
    <span style:text-decoration={todo.done ? 'line-through' : 'none'}>{todo.text}</span>
    <button onclick={() => removeTodo(todo.id)}>×</button>
  </div>
{/each}

<button onclick={() => todos.undo()} disabled={!todos.canUndo()}>Undo</button>
<button onclick={() => todos.redo()} disabled={!todos.canRedo()}>Redo</button>
```

## API Documentation

For complete API reference, see [API.md](./API.md).

For more examples, see [EXAMPLES.md](./EXAMPLES.md).

## Roadmap

### ✅ v0.1.0 - MVP (Released)
- ✅ Core reactor with Svelte 5 Runes
- ✅ Basic undo/redo functionality
- ✅ Plugin system (undoRedo, persist, logger)
- ✅ DevTools API with time-travel debugging
- ✅ State utilities (diff, clone, equality)
- ✅ TypeScript types
- ✅ 93 tests

### ✅ v0.2.0 - Production Ready (Released)
- ✅ **Full Svelte stores API** - `subscribe()` support, `$store` auto-subscription
- ✅ **Helper functions** - `simpleStore()`, `persistedStore()`, `persistedReactor()`
- ✅ **Array Actions Helper** - `arrayActions()` for CRUD operations
- ✅ **Enhanced persistence** - `pick`/`omit`, custom serialization, cross-tab sync
- ✅ **Security features** - Exclude sensitive data from persistence
- ✅ 149 tests (+56)

### ✅ v0.2.1 - Async & Helpers (Released)
- ✅ **Async Actions Helper** - `asyncActions()` for automatic loading/error states
- ✅ **Enhanced Migration Guide** - Array and async operation examples
- ✅ **Advanced testing** - 3 complexity tests for concurrent operations
- ✅ 172 tests (+23)

### ✅ v0.2.4 - DX Improvements & Advanced Features (Current)
- ✅ **Derived Stores Export** - `derived()`, `get()`, `readonly()` from single import
- ✅ **IndexedDB Storage** - 50MB+ capacity for large datasets
- ✅ **TTL (Time-To-Live)** - Auto-expire cached data with `ttl` and `onExpire`
- ✅ **Pagination Helper** - Built-in pagination for `arrayActions()`
- ✅ **Storage Type Safety** - TypeScript union types + runtime validation
- ✅ **AI Setup Fix** - `init-ai` creates files AI assistants actually read
- ✅ 326 tests (+94)

### ✅ v0.2.3 - Feature Enhancements (Released)
- ✅ **Selective Persistence** - `pick`/`omit` options for security
- ✅ **Array Enhancements** - `sort()`, `bulkUpdate()`, `bulkRemove()`
- ✅ **Async Retry & Cancellation** - Retry logic, debouncing, cancellation
- ✅ **Advanced Logger** - Filter by action/state, performance tracking
- ✅ **Critical Bug Fixes** - Unhandled rejection fixes
- ✅ 232 tests (+58)

### ✅ v0.2.2 - Bug Fixes & Stability (Released)
- ✅ **Memory Leak Fixes** - Proper cleanup of subscribers and middlewares
- ✅ **Performance Optimization** - Skip unnecessary updates
- ✅ **Enhanced Error Handling** - Better validation and error messages
- ✅ 181 tests (+9)

### 🔜 v0.3.0 - Advanced Features (Planned)
- 🔄 Computed/Derived State API
- 🔄 Selectors API with memoization
- 🔄 Multi-tab sync with BroadcastChannel
- 🔄 Image compression for persist plugin

### 🚀 v1.0.0 - Stable Release (Future)
- React/Vue adapters
- Redux DevTools extension
- Advanced performance optimizations
- Comprehensive ecosystem

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run benchmarks
pnpm bench

# Build
pnpm build

# Type check
pnpm typecheck
```

## Testing

The package includes comprehensive test coverage:

- **326 tests** covering all features (+94 new in v0.2.4)
- Unit tests for core reactor, plugins, helpers, utilities, and DevTools
- Advanced complexity tests for edge cases and concurrent operations
- Integration tests for v0.2.4 features (TTL, pagination, IndexedDB)
- Performance benchmarks for all operations
- TypeScript type checking

Run tests with `pnpm test` or `pnpm test:watch` for development.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/P1kabu/svelte-reactor/blob/master/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details

## Credits

Built with love for the Svelte community.
