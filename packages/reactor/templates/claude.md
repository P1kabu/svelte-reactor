# Svelte Reactor - Claude AI Rules

<library>
name: svelte-reactor
version: 0.2.9
description: Reactive state management for Svelte 5 with plugins
</library>

<documentation>
Full documentation available at:
- [README.md](./README.md) - Overview and quick start
- [API.md](./API.md) - Complete API reference
- [PLUGINS.md](./PLUGINS.md) - Plugin development guide
- [EXAMPLES.md](./EXAMPLES.md) - Code examples
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - Optimization strategies
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Error handling patterns
- [CHANGELOG.md](./CHANGELOG.md) - Version history
</documentation>

<core-api>
## createReactor(initialState, options)
```typescript
import { createReactor } from 'svelte-reactor';

const store = createReactor({ count: 0 }, {
  name: 'counter',        // For debugging
  plugins: [],            // undoRedo, persist, logger
  devtools: false         // Enable Redux DevTools
});
```

### Methods
- `store.state` - Current state (reactive)
- `store.update(fn, action?)` - Update state with function
- `store.set(partial)` - Merge partial state
- `store.subscribe(fn)` - Subscribe to changes
- `store.select(selector, callback, options?)` - Selective subscription
- `store.undo()` / `store.redo()` - History navigation
- `store.canUndo()` / `store.canRedo()` - Check availability
- `store.batch(fn)` - Batch multiple updates
- `store.destroy()` - Cleanup (prevents memory leaks)
</core-api>

<plugins>
## Plugins

### undoRedo
```typescript
import { undoRedo } from 'svelte-reactor/plugins';
const store = createReactor(state, { plugins: [undoRedo({ limit: 50 })] });
```

### persist
```typescript
import { persist } from 'svelte-reactor/plugins';

persist({
  key: 'app-state',
  storage: 'localStorage',    // 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  omit: ['user.token'],       // Exclude sensitive fields
  pick: ['settings'],         // Include only these fields
  debounce: 300,              // Save delay in ms
  ttl: 5 * 60 * 1000,         // Auto-expire after 5 minutes
  onExpire: (key) => {},      // Callback on expiration
  onReady: (state) => {}      // Callback when IndexedDB data loaded (v0.2.9)
})
```

### sync (multiTabSync)
```typescript
import { sync } from 'svelte-reactor/plugins';

sync({ key: 'app-state', debounce: 100 })  // Sync state across browser tabs
```

### logger
```typescript
import { logger } from 'svelte-reactor/plugins';
logger({ filter: (action) => action?.startsWith('user:'), trackPerformance: true })
```
</plugins>

<helpers>
## Helper Functions

### simpleStore(initialValue)
```typescript
import { simpleStore } from 'svelte-reactor';
const count = simpleStore(0);  // Svelte-compatible writable
count.set(5);
count.update(n => n + 1);
console.log(count.get());  // Read value with .get()
```

### persistedStore(key, initialValue, options?)
```typescript
import { persistedStore } from 'svelte-reactor';
const settings = persistedStore('settings', { theme: 'dark' });
console.log(settings.get().theme);  // ✅ Use .get() to read value
```

### Reading Values
| Store type | Read (non-reactive) | Read (reactive) |
|------------|---------------------|-----------------|
| `simpleStore` | `.get()` | `$store` |
| `persistedStore` | `.get()` | `$store` |
| `createReactor` | `.state` | `.state` |

### computedStore(reactor, selector, options?)
```typescript
import { computedStore, isEqual } from 'svelte-reactor';

const filtered = computedStore(store, state =>
  state.items.filter(i => !i.done),
  { keys: ['items', 'filter'], equals: isEqual }
);
```

### arrayActions(reactor, key, options?)
```typescript
import { arrayActions } from 'svelte-reactor';
const actions = arrayActions(store, 'items', { idKey: 'id' });

actions.add(item);
actions.update(id, updates);
actions.remove(id);
actions.toggle(id, 'done');
actions.bulkUpdate(ids, updates);
actions.sort((a, b) => a.priority - b.priority);
```

### arrayPagination(reactor, key, options?)
```typescript
import { arrayPagination } from 'svelte-reactor';
const pagination = arrayPagination(store, 'items', { pageSize: 20 });

const { items, page, totalPages, hasNext, hasPrev } = pagination.getPage();
pagination.nextPage();
pagination.prevPage();
pagination.setPage(3);
pagination.firstPage();
pagination.lastPage();
```

### asyncActions(reactor, actions, options?)
```typescript
import { asyncActions } from 'svelte-reactor';

const api = asyncActions(store, {
  fetchUsers: async () => {
    const res = await fetch('/api/users');
    return { users: await res.json() };
  }
}, {
  concurrency: 'replace'  // 'replace' | 'queue'
});

await api.fetchUsers();
api.fetchUsers.cancel();  // Cancel request
```
</helpers>

<selective-subscriptions>
## Selective Subscriptions
Subscribe only to specific state changes:

```typescript
store.select(
  state => state.user.name,
  (name, prevName) => console.log(`Changed: ${prevName} -> ${name}`),
  { fireImmediately: false, equalityFn: isEqual }
);
```
</selective-subscriptions>

<patterns>
## Correct Patterns

```typescript
// State updates
store.update(s => { s.count++; }, 'increment');

// Cleanup in components
import { onDestroy } from 'svelte';
onDestroy(() => store.destroy());

// Batch updates (single notification)
store.batch(() => {
  store.update(s => { s.count++; });
  store.update(s => { s.name = 'John'; });
});
```
</patterns>

<anti-patterns>
## Anti-patterns (AVOID)

```typescript
// Direct mutation
store.state.count++;  // WRONG

// Missing cleanup
const store = createReactor({});  // Memory leak without destroy()

// Storing sensitive data
persist({ key: 'auth', pick: ['token'] });  // WRONG - use omit

// Unnecessary subscriptions
store.subscribe(state => {}); // Use select() for specific fields
```
</anti-patterns>

<exports>
## Package Exports
```typescript
// Main
import { createReactor, simpleStore, persistedStore, computedStore } from 'svelte-reactor';
import { arrayActions, arrayPagination, asyncActions } from 'svelte-reactor';
import { derived, get, readonly, isEqual } from 'svelte-reactor';

// Plugins
import { undoRedo, persist, logger, sync } from 'svelte-reactor/plugins';

// Utilities
import { batched, debouncedBatch } from 'svelte-reactor/utils/batch';
```
</exports>

<errors>
## Error Handling
Errors include context: `[Reactor:name] message`

```typescript
// ReactorError has rich context
import { ReactorError } from 'svelte-reactor';

// Common errors:
// - "Cannot operate on destroyed reactor"
// - "Storage quota exceeded"
// - "initialState must be a non-null object"
```
</errors>
