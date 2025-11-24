# Svelte Reactor

State management for Svelte 5 with plugins, undo/redo, and persistence.

## Installation

```bash
npm install svelte-reactor
```

## Basic Usage

```typescript
import { createReactor } from 'svelte-reactor';

// Create store
const counter = createReactor({ value: 0 });

// Update state
counter.update(s => ({ value: s.value + 1 }));

// Subscribe
counter.subscribe(state => console.log(state.value));
```

## Persisted Stores Helper

```typescript
import { persistedStore, persistedReactor } from 'svelte-reactor';

// ✅ GOOD: Simple persisted store (Svelte stores API)
const counter = persistedStore('counter', 0);
counter.update(n => n + 1); // Auto-saved to localStorage

// ✅ GOOD: With options (TTL, security, etc.)
const settings = persistedStore('app-settings', { theme: 'dark' }, {
  storage: 'localStorage',
  debounce: 300,
  ttl: 60 * 60 * 1000,  // 1 hour cache
  omit: ['user.token']  // Security: exclude sensitive data
});

// ✅ GOOD: Full reactor API with persistence
const app = persistedReactor(
  'app-state',
  { count: 0, user: { name: 'John' } },
  {
    storage: 'indexedDB',     // Large data support
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    additionalPlugins: [undoRedo()]  // Add undo/redo
  }
);

// Full reactor methods available
app.undo();
app.redo();
app.update(state => { state.count++; });

// ❌ BAD: Manual persist plugin for simple cases
const counter = createReactor({ value: 0 }, {
  plugins: [persist({ key: 'counter' })]
}); // Too verbose!
```

**When to use:**
- `persistedStore()` - Simple values, Svelte stores API
- `persistedReactor()` - Complex state, need undo/redo
- Manual `persist` plugin - Maximum control

## Array Actions Helper

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

// ✅ GOOD: Array CRUD without boilerplate
const todos = createReactor({ items: [] });
const actions = arrayActions(todos, 'items', { idKey: 'id' });

actions.add({ id: '1', text: 'Buy milk', done: false });
actions.update('1', { done: true });
actions.toggle('1', 'done');
actions.remove('1');

// Query operations
const item = actions.find('1');
const count = actions.count();

// ❌ BAD: Manual update() for every operation
todos.update(s => ({ items: [...s.items, newItem] }));
todos.update(s => ({ items: s.items.map(/* ... */) }));
```

**Available methods:**
`add`, `update`, `updateBy`, `remove`, `removeWhere`, `clear`, `toggle`, `set`, `filter`, `find`, `has`, `count`

**NEW in v0.2.3:**
`sort`, `bulkUpdate`, `bulkRemove`

```typescript
// Bulk operations (v0.2.3)
actions.sort((a, b) => a.priority - b.priority);
actions.bulkUpdate(['1', '2', '3'], { done: true });
actions.bulkRemove(['1', '2']); // or predicate: item => item.done
```

**NEW in v0.2.4:**
Pagination for large datasets

```typescript
// Enable pagination (v0.2.4)
const actions = arrayActions(todos, 'items', {
  idKey: 'id',
  pagination: {
    pageSize: 20,    // Items per page
    initialPage: 1   // Start on page 1
  }
});

// Get paginated data
const { items, page, totalPages, hasNext, hasPrev } = actions.getPaginated();

// Navigation
actions.nextPage();     // Go to next page
actions.prevPage();     // Go to previous page
actions.setPage(5);     // Jump to page 5
actions.firstPage();    // Jump to first page
actions.lastPage();     // Jump to last page

// Display in UI
console.log(`Page ${page} of ${totalPages}`);
console.log(`Showing ${items.length} items`);
if (hasNext) console.log('More items available');
```

## Async Actions Helper

```typescript
import { createReactor, asyncActions } from 'svelte-reactor';

// ✅ GOOD: Async operations with automatic loading/error
const store = createReactor({
  users: [],
  loading: false,
  error: null
});

const api = asyncActions(store, {
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    return { users: await response.json() };
  },
  createUser: async (name: string, email: string) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    });
    const newUser = await response.json();
    return { users: [...store.state.users, newUser] };
  }
});

// Usage
await api.fetchUsers();
// ✅ store.state.loading was automatically true during fetch
// ✅ store.state.users now has data
// ✅ store.state.error is null

// ❌ BAD: Manual loading/error management
let loading = false;
let error = null;
async function fetchUsers() {
  loading = true;
  try {
    const response = await fetch('/api/users');
    users = await response.json();
    error = null;
  } catch (e) {
    error = e;
  } finally {
    loading = false;
  }
}
```

**Options:**
- `loadingKey` - Custom field name (default: 'loading')
- `errorKey` - Custom field name (default: 'error')
- `actionPrefix` - Debugging prefix (default: 'async')

**NEW in v0.2.3:**
- `retry` - Retry configuration with exponential/linear backoff
- `debounce` - Debounce delay in milliseconds

```typescript
// Retry with exponential backoff
const api = asyncActions(store, actions, {
  retry: { attempts: 3, delay: 1000, backoff: 'exponential' }
});

// Debouncing for search
const searchApi = asyncActions(store, { search: async (q) => {...} }, {
  debounce: 300
});

// Cancellation
const request = api.fetchUsers();
request.cancel(); // Cancel in-flight request
```

## With Plugins

### Undo/Redo

```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

// ✅ GOOD: Counter with undo/redo
const counter = createReactor({ value: 0 }, {
  plugins: [undoRedo({ maxHistory: 50 })]
});

counter.update(s => ({ value: s.value + 1 }));
counter.undo(); // Back to 0
counter.redo(); // Forward to 1

// ❌ BAD: Direct mutation
let count = 0;
count++; // Don't do this!
```

### Persistence

```typescript
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

// ✅ GOOD: Persisted state
const settings = createReactor({ theme: 'dark' }, {
  plugins: [persist({ key: 'app-settings' })]
});

// State automatically saved to localStorage
settings.update(s => ({ theme: 'light' }));

// NEW in v0.2.3: Selective persistence with pick/omit
const app = createReactor({
  user: { name: 'John', token: 'secret123' },
  settings: { theme: 'dark' }
}, {
  plugins: [
    persist({
      key: 'app',
      omit: ['user.token'] // Don't persist sensitive data
    })
  ]
});

// NEW in v0.2.4: IndexedDB for large datasets (50MB+)
const photos = createReactor({ items: [] }, {
  plugins: [
    persist({
      key: 'photos',
      storage: 'indexedDB',  // 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
      indexedDB: {
        database: 'my-app',
        storeName: 'photos',
        version: 1
      }
    })
  ]
});

// NEW in v0.2.4: TTL (Time-To-Live) - Auto-expire cached data
const apiCache = createReactor({ data: null }, {
  plugins: [
    persist({
      key: 'api-cache',
      ttl: 5 * 60 * 1000,  // Expire after 5 minutes
      onExpire: (key) => {
        console.log(`Cache ${key} expired, refreshing...`);
      }
    })
  ]
});

// Session with auto-logout
const session = createReactor({ userId: null }, {
  plugins: [
    persist({
      key: 'user-session',
      storage: 'sessionStorage',
      ttl: 30 * 60 * 1000,  // 30 minutes
      onExpire: () => window.location.href = '/login'
    })
  ]
});

// ❌ BAD: Manual localStorage
localStorage.setItem('theme', 'dark'); // Don't do this!
```

### Logger

```typescript
import { createReactor } from 'svelte-reactor';
import { logger } from 'svelte-reactor/plugins';

// ✅ GOOD: Debug with logger
const store = createReactor({ user: null }, {
  plugins: [logger()]
});

// All changes logged automatically

// NEW in v0.2.3: Advanced filtering and performance tracking
const store2 = createReactor({ count: 0 }, {
  plugins: [
    logger({
      filter: (action) => action?.startsWith('user:'), // Only log user actions
      trackPerformance: true,  // Track execution time
      slowThreshold: 16,       // Warn if >16ms
    })
  ]
});

// ❌ BAD: Manual console.log everywhere
console.log('before', user);
user = newUser;
console.log('after', user);
```

## Real-World Examples

### Todo List

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';
import { persist, undoRedo } from 'svelte-reactor/plugins';

// ✅ GOOD: Full-featured todos with arrayActions helper
const todos = createReactor({ items: [] }, {
  plugins: [
    persist({ key: 'todos' }),
    undoRedo()
  ]
});

// Use arrayActions helper to reduce boilerplate
const actions = arrayActions(todos, 'items', { idKey: 'id' });

function addTodo(text) {
  actions.add({ id: Date.now(), text, done: false });
}

function toggleTodo(id) {
  actions.toggle(id, 'done');
}

function deleteTodo(id) {
  actions.remove(id);
}

// ❌ BAD: Manual update() for every operation
todos.update(s => ({
  items: [...s.items, newItem] // Too much boilerplate!
}));

// ❌ BAD: Imperative approach
let todoList = [];
todoList.push({ text: 'Buy milk' }); // Don't!
```

### Shopping Cart

```typescript
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

// ✅ GOOD: Reactive cart
const cart = createReactor({ items: [], total: 0 }, {
  plugins: [persist({ key: 'cart' })]
});

function addToCart(product) {
  cart.update(s => {
    const items = [...s.items, product];
    const total = items.reduce((sum, p) => sum + p.price, 0);
    return { items, total };
  });
}

// ❌ BAD: Mutating directly
cart.items.push(product); // Don't!
cart.total += product.price; // Don't!
```

### Form with Validation

```typescript
import { createReactor } from 'svelte-reactor';

// ✅ GOOD: Reactive form
const form = createReactor({
  name: '',
  email: '',
  errors: {}
});

function updateField(field, value) {
  form.update(s => ({
    ...s,
    [field]: value,
    errors: { ...s.errors, [field]: null }
  }));
}

function validate() {
  form.update(s => {
    const errors = {};
    if (!s.name) errors.name = 'Required';
    if (!s.email.includes('@')) errors.email = 'Invalid';
    return { ...s, errors };
  });
}

// ❌ BAD: Separate state variables
let name = '';
let email = '';
let errors = {}; // Hard to sync!
```

## Advanced Patterns

### Custom Middleware

```typescript
// ✅ GOOD: Validation middleware
const validateAge = (next) => (state) => {
  if (state.age < 0) {
    console.warn('Age cannot be negative');
    return next({ ...state, age: 0 });
  }
  return next(state);
};

const user = createReactor({ name: '', age: 0 }, {
  middleware: [validateAge]
});
```

### DevTools

```typescript
// ✅ GOOD: Debug with DevTools
const store = createReactor({ count: 0 }, {
  devtools: true,
  name: 'Counter'
});

// Time-travel debugging in Redux DevTools!
```

### Combined Plugins

```typescript
// ✅ GOOD: All features together
const app = createReactor({ user: null, settings: {} }, {
  plugins: [
    logger(),
    persist({ key: 'app-state' }),
    undoRedo({ maxHistory: 100 })
  ],
  devtools: true
});

// Logging + Persistence + Undo/Redo + DevTools!

// ❌ BAD: Implementing each feature manually
// Tons of boilerplate code...
```

## Common Mistakes (v0.2.3)

```typescript
// ❌ BAD: Direct mutation
const store = createReactor({ count: 0 });
store.count++; // Error: store is not mutable

// ✅ GOOD: Use update
store.update(s => ({ count: s.count + 1 }));

// ❌ BAD: Forgetting to spread
store.update(s => ({ name: 'John' })); // Loses other fields!

// ✅ GOOD: Spread existing state
store.update(s => ({ ...s, name: 'John' }));

// ❌ BAD: Not destroying reactor
const store = createReactor({ value: 0 });
// Memory leak if not cleaned up!

// ✅ GOOD: Always cleanup
import { onDestroy } from 'svelte';
onDestroy(() => store.destroy());
```

## Selective Subscriptions (v0.2.5)

```typescript
// NEW in v0.2.5: Subscribe to specific state fields for performance
import { createReactor, isEqual } from 'svelte-reactor';

const store = createReactor({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' },
  count: 0
});

// ✅ GOOD: Only fires when name changes
store.subscribe({
  selector: state => state.user.name,
  onChanged: (name, prevName) => {
    console.log(`Name: ${prevName} → ${name}`);
  }
});

store.update(s => { s.count++; });        // ❌ NOT called
store.update(s => { s.user.age = 31; });  // ❌ NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Called!

// ❌ BAD: Standard subscription fires on ANY change
store.subscribe(state => {
  console.log(state.user.name); // Fires even when count changes!
});
```

**Options:**
- `selector` - Select specific state part
- `onChanged` - Callback with (newValue, prevValue)
- `fireImmediately` - Fire on mount (default: true)
- `equalityFn` - Custom equality (use `isEqual` for deep comparison)

**Use cases:**
- 🎯 Form field validation (only validate changed field)
- 🎯 Component optimization (subscribe to needed slice)
- 🎯 Expensive computations (only when dependencies change)
- 🎯 Multiple independent subscriptions

## Derived Stores (v0.2.4)

```typescript
// NEW in v0.2.4: Import derived stores from svelte-reactor (single import!)
import { simpleStore, derived, get, readonly } from 'svelte-reactor';

// ✅ GOOD: Single import source
const count = simpleStore(0);
const doubled = derived(count, $c => $c * 2);

console.log(get(doubled)); // 0
count.set(5);
console.log(get(doubled)); // 10

// ❌ BAD: Multiple imports
import { simpleStore } from 'svelte-reactor';
import { derived, get } from 'svelte/store'; // Don't need this anymore!
```

**Real-world example - Shopping Cart:**
```typescript
import { createReactor, derived, get } from 'svelte-reactor';

const cart = createReactor<{ items: CartItem[] }>({ items: [] });

// Derive total price - auto-updates when cart changes
const totalPrice = derived(
  cart,
  $cart => $cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

console.log(get(totalPrice)); // $0.00
// Add items...
console.log(get(totalPrice)); // $120.00
```

## v0.2.5 Features

### Selective Subscriptions
```typescript
// ✅ Subscribe to specific fields - massive performance boost
store.subscribe({
  selector: state => state.user.email,
  onChanged: (email) => validateEmail(email),
  fireImmediately: false
});
```

### Critical Path Optimizations
- 2-10x faster state updates
- Optimized subscription system
- Reduced memory allocations

### Batch Utilities
```typescript
import { batch } from 'svelte-reactor';

// Efficient batch operations
batch(store, (state) => {
  state.user.name = 'John';
  state.user.age = 30;
  state.settings.theme = 'dark';
}); // Single notification to subscribers
```

## v0.2.4 Features

### IndexedDB Storage (50MB+)
```typescript
// ✅ Store large datasets (photos, documents, offline data)
const photos = createReactor({ items: [] }, {
  plugins: [
    persist({
      key: 'photos',
      storage: 'indexedDB',  // Much larger capacity than localStorage
      indexedDB: { database: 'my-app', storeName: 'photos' }
    })
  ]
});
```

### Derived Stores Export
```typescript
// ✅ Single import for all store utilities
import { simpleStore, derived, get, readonly } from 'svelte-reactor';
```

### Storage Type Safety
```typescript
// ✅ TypeScript catches typos + runtime validation
storage: 'indexedDB'  // Correct ✅
storage: 'indexDB'    // Error: Type '"indexDB"' is not assignable to type 'StorageType' ❌
```

## v0.2.3 Features

### Selective Persistence (Security)
```typescript
// ✅ Protect sensitive data from localStorage
const store = createReactor({
  user: { name: 'John', token: 'secret' },
  settings: { theme: 'dark' }
}, {
  plugins: [
    persist({
      key: 'app',
      omit: ['user.token'] // Don't save tokens!
    })
  ]
});
```

### Retry & Debounce (Reliability)
```typescript
// ✅ Automatic retry with exponential backoff
const api = asyncActions(store, actions, {
  retry: { attempts: 3, backoff: 'exponential' }
});

// ✅ Debounce search requests
const searchApi = asyncActions(store, { search: async (q) => {...} }, {
  debounce: 300
});
```

### Bulk Operations (Performance)
```typescript
// ✅ Update/remove multiple items efficiently
actions.bulkUpdate(['1', '2', '3'], { done: true });
actions.bulkRemove(item => item.done);
actions.sort((a, b) => a.priority - b.priority);
```

### Performance Tracking
```typescript
// ✅ Monitor slow operations
logger({
  trackPerformance: true,
  slowThreshold: 16, // Warn if >16ms
  filter: (action) => !action?.includes('temp')
})
```

## TypeScript

```typescript
interface State {
  count: number;
  user: { name: string } | null;
}

// ✅ GOOD: Typed store
const store = createReactor<State>({
  count: 0,
  user: null
});

// Full type safety!
store.update(s => ({ ...s, count: s.count + 1 }));
```

---

**Current Version:** v0.2.5 (461 tests, production-ready)

**NEW in v0.2.5:**
- 🎯 **Selective Subscriptions** - Subscribe to specific state fields for performance
- ⚡ **Critical Path Optimizations** - 2-10x faster state updates
- 📦 **Batch Utilities** - Optimized batch state operations

**Also in v0.2.4:**
- ✅ Derived stores export (`derived`, `get`, `readonly`) - single import!
- ✅ IndexedDB storage support (50MB+ capacity for large datasets)
- ✅ TTL (Time-To-Live) support - auto-expire cached data with `ttl` and `onExpire`
- ✅ Storage type safety with TypeScript union types + runtime validation

**Key Features:**
- Selective persistence with pick/omit (protect sensitive data)
- Retry with exponential backoff (reliable network requests)
- Debouncing and cancellation (optimize search and async ops)
- Bulk operations (efficient multi-item updates)
- Performance tracking (monitor slow operations)
- Full Svelte stores API compatibility

**Key Takeaway:** Use `createReactor()` for all state, never mutate directly, always destroy() on unmount, leverage plugins and helpers for common features.
