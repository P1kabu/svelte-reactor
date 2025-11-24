# Svelte Reactor Rules

## Quick Reference

- Use `createReactor()` for all state management
- Always use `.update()` or `.set()` for state changes
- Never mutate state directly
- Use plugins for common features

## Core API

```typescript
import { createReactor } from 'svelte-reactor';
const store = createReactor(initialState, options);
```

## Plugins

- `undoRedo()` - Undo/redo functionality
- `persist({ key, storage?, pick?, omit?, ttl?, onExpire? })` - Storage persistence
  - **v0.2.3:** selective persistence (pick/omit)
  - **v0.2.4:** IndexedDB support (50MB+) - `storage: 'indexedDB'`
  - **v0.2.4:** TTL support - auto-expire cached data with `ttl` and `onExpire`
- `logger({ filter?, trackPerformance? })` - Console logging (v0.2.3: advanced filtering)

## Helpers

- **NEW in v0.2.4:** `derived`, `get`, `readonly` - Svelte store utilities (single import!)
  ```typescript
  import { simpleStore, derived, get } from 'svelte-reactor';
  const doubled = derived(count, $c => $c * 2);
  console.log(get(doubled)); // Read value without subscribing
  ```
- `persistedStore(key, initialValue, options?)` - Simple persisted store (Svelte API)
  ```typescript
  const counter = persistedStore('counter', 0, { debounce: 300 });
  ```
- `persistedReactor(key, initialState, options?)` - Full reactor API with persistence
  ```typescript
  const app = persistedReactor('app', { count: 0 }, {
    ttl: 60 * 60 * 1000,  // 1 hour
    additionalPlugins: [undoRedo()]
  });
  ```
- `arrayActions(reactor, field, { idKey, pagination? })` - CRUD operations for arrays
  - Methods: `add`, `update`, `remove`, `toggle`, `filter`, `find`, `has`, etc.
  - **NEW in v0.2.3:** `sort`, `bulkUpdate`, `bulkRemove`
  - **NEW in v0.2.4:** Pagination support for large datasets
    ```typescript
    const actions = arrayActions(todos, 'items', {
      idKey: 'id',
      pagination: { pageSize: 20 }
    });
    const { items, page, totalPages } = actions.getPaginated();
    actions.nextPage(); actions.prevPage(); actions.setPage(5);
    ```
- `asyncActions(reactor, actions, options)` - Async operations with loading/error
  - Automatic `loading` and `error` state management
  - Options: `loadingKey`, `errorKey`, `actionPrefix`
  - **NEW in v0.2.3:** `retry`, `debounce`, cancellation with `.cancel()`

## Best Practices (v0.2.5)

✅ **DO:**
- Use createReactor for reactive state
- Combine multiple plugins
- Use .update() for state changes
- Enable devtools in development
- Call destroy() when component unmounts (prevents memory leaks!)
- Use arrayActions() and asyncActions() helpers
- Add action names for better debugging
- Use derived stores for computed values
- Use IndexedDB for large datasets (>5MB)
- **NEW:** Use selective subscriptions for performance (form fields, component optimization)

❌ **DON'T:**
- Mutate state directly
- Mix with writable() stores
- Forget to destroy() reactor (memory leak!)
- Persist sensitive data without encryption
- Skip input validation (reactor validates automatically)

## v0.2.5 Features (Latest)

🎯 **Selective Subscriptions:** Subscribe to specific state fields
```typescript
import { createReactor, isEqual } from 'svelte-reactor';

const store = createReactor({
  user: { name: 'John', age: 30 },
  count: 0
});

// Only fires when name changes
store.subscribe({
  selector: state => state.user.name,
  onChanged: (name, prevName) => console.log(`${prevName} → ${name}`)
});

store.update(s => { s.count++; });        // ❌ NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Called!

// Deep equality for arrays/objects
store.subscribe({
  selector: state => state.items,
  onChanged: (items) => console.log('Items changed!'),
  equalityFn: isEqual,  // Deep comparison
  fireImmediately: false  // Don't fire on mount
});
```

⚡ **Critical Path Optimizations:** 2-10x faster updates

📦 **Batch Utilities:** Optimized batch operations

## v0.2.4 Features

🔗 **Derived Stores:** Single import for all Svelte store utilities
```typescript
import { simpleStore, derived, get, readonly } from 'svelte-reactor';
const doubled = derived(count, $c => $c * 2);
```

💾 **IndexedDB Storage:** 50MB+ capacity for large datasets
```typescript
persist({
  key: 'photos',
  storage: 'indexedDB',  // 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  indexedDB: { database: 'my-app', storeName: 'photos' }
})
```

⏱️ **TTL (Time-To-Live):** Auto-expire cached data
```typescript
// API cache with 5-minute expiration
persist({
  key: 'api-cache',
  ttl: 5 * 60 * 1000,  // 5 minutes
  onExpire: (key) => console.log(`Cache ${key} expired`)
})

// Session with auto-logout
persist({
  key: 'session',
  storage: 'sessionStorage',
  ttl: 30 * 60 * 1000,  // 30 minutes
  omit: ['token'],
  onExpire: () => window.location.href = '/login'
})
```

🎯 **Storage Type Safety:** TypeScript types + runtime validation
```typescript
// TypeScript now catches typos: 'localstorage' ❌ → 'localStorage' ✅
```

## v0.2.3 Features

🔒 **Selective Persistence:** Pick/omit fields for security
```typescript
persist({ key: 'app', omit: ['user.token'] }) // Don't save sensitive data
```

⚡ **Retry & Debounce:** Automatic retry with backoff + request debouncing
```typescript
asyncActions(store, actions, {
  retry: { attempts: 3, backoff: 'exponential' },
  debounce: 300
})
```

📊 **Performance Tracking:** Logger with execution time monitoring
```typescript
logger({ trackPerformance: true, slowThreshold: 16 })
```

🎯 **Bulk Operations:** Efficient multi-item updates
```typescript
actions.bulkUpdate(['1', '2', '3'], { done: true });
actions.sort((a, b) => a.priority - b.priority);
```

## Common Patterns

### Counter
```typescript
const counter = createReactor({ value: 0 }, {
  plugins: [undoRedo()]
});
```

### Todos with Persistence
```typescript
import { arrayActions } from 'svelte-reactor';

const todos = createReactor({ items: [] }, {
  plugins: [persist({ key: 'todos' }), undoRedo()]
});

const actions = arrayActions(todos, 'items', { idKey: 'id' });
actions.add({ id: '1', text: 'Buy milk', done: false });
actions.toggle('1', 'done');
actions.remove('1');
```

### Async Data Fetching
```typescript
import { asyncActions } from 'svelte-reactor';

const store = createReactor({ users: [], loading: false, error: null });

const api = asyncActions(store, {
  fetchUsers: async () => {
    const res = await fetch('/api/users');
    return { users: await res.json() };
  }
});

await api.fetchUsers(); // Automatic loading/error handling
```

### Form State
```typescript
const form = createReactor({ name: '', email: '' });
form.update(s => ({ ...s, name: 'John' }));
```

## Advanced

- Custom middleware for state transformation
- DevTools integration for debugging
- Full Svelte stores API compatibility
- SSR support (SvelteKit ready)

---

**Current Version:** v0.2.5 (461 tests, production-ready)
**Key Updates:** Selective subscriptions, critical path optimizations, batch utilities
