# Svelte Reactor - Cursor AI Rules

## Quick Reference

**Package:** `svelte-reactor` v0.2.8
**Purpose:** Reactive state management for Svelte 5 with undo/redo, persistence, plugins

## Documentation Links

- [README.md](./README.md) - Overview
- [API.md](./API.md) - API reference
- [PLUGINS.md](./PLUGINS.md) - Plugins
- [EXAMPLES.md](./EXAMPLES.md) - Examples
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - Performance

## Imports

```typescript
// Core
import { createReactor, simpleStore, persistedStore, computedStore } from 'svelte-reactor';
import { arrayActions, asyncActions } from 'svelte-reactor';
import { derived, get, readonly, isEqual } from 'svelte-reactor';

// Plugins
import { undoRedo, persist, logger } from 'svelte-reactor/plugins';
```

## Core API

### createReactor
```typescript
const store = createReactor({ count: 0, user: null }, {
  name: 'myStore',
  plugins: [undoRedo(), persist({ key: 'app' })],
  devtools: true
});

// Methods
store.state              // Current state (reactive)
store.update(s => { s.count++; }, 'action-name')
store.set({ count: 5 })  // Merge partial
store.subscribe(state => {})
store.select(s => s.count, (val, prev) => {})
store.undo() / store.redo()
store.canUndo() / store.canRedo()
store.batch(() => { /* multiple updates */ })
store.destroy()          // IMPORTANT: cleanup
```

### simpleStore
```typescript
const count = simpleStore(0);
count.set(5);
count.update(n => n + 1);
console.log(count.get());  // ✅ Use .get() to read value
// count.value is DEPRECATED - shows warning
const unsubscribe = count.subscribe(value => {});
```

### persistedStore
```typescript
const settings = persistedStore('key', { theme: 'dark' }, {
  storage: 'localStorage',  // 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory'
  debounce: 300,
  omit: ['sensitiveField']
});
console.log(settings.get().theme);  // ✅ Use .get() to read value
```

### Reading Values (IMPORTANT)
| Store type | Read (non-reactive) | Read (reactive) |
|------------|---------------------|-----------------|
| `simpleStore` | `.get()` | `$store` |
| `persistedStore` | `.get()` | `$store` |
| `createReactor` | `.state` | `.state` |

⚠️ `.value` is DEPRECATED - use `.get()` instead

### computedStore
```typescript
const filtered = computedStore(
  store,
  state => state.items.filter(i => !i.done),
  { keys: ['items'], equals: isEqual }
);
```

## Helpers

### arrayActions
```typescript
const actions = arrayActions(store, 'items', { idKey: 'id' });

actions.add({ id: '1', name: 'Item' });
actions.update('1', { name: 'Updated' });
actions.remove('1');
actions.toggle('1', 'done');
actions.bulkUpdate(['1', '2'], { done: true });
actions.sort((a, b) => a.priority - b.priority);
actions.find('1');
actions.has('1');
actions.count();
actions.clear();
```

### asyncActions
```typescript
const api = asyncActions(store, {
  fetchData: async (id: string) => {
    const res = await fetch(`/api/data/${id}`);
    return { data: await res.json() };
  }
}, {
  loadingKey: 'loading',
  errorKey: 'error',
  retry: { attempts: 3, delay: 1000, backoff: 'exponential' },
  debounce: 300,
  concurrency: 'replace'  // 'replace' | 'queue' | 'parallel'
});

await api.fetchData('123');
api.fetchData.cancel();
```

## Plugins

### undoRedo
```typescript
undoRedo({ maxHistory: 50 })
```

### persist
```typescript
persist({
  key: 'app-state',
  storage: 'localStorage',
  pick: ['settings'],        // OR
  omit: ['user.token'],      // Exclude sensitive
  debounce: 300,
  ttl: 5 * 60 * 1000,        // Auto-expire
  onExpire: (key) => {}
})
```

### logger
```typescript
logger({
  filter: action => action?.startsWith('user:'),
  trackPerformance: true,
  slowThreshold: 16
})
```

## Selective Subscriptions

```typescript
// Only fires when selected value changes
store.select(
  state => state.user.name,
  (name, prevName) => console.log('Changed:', name),
  { fireImmediately: false, equalityFn: isEqual }
);
```

## Svelte Component Pattern

```svelte
<script lang="ts">
import { createReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';
import { onDestroy } from 'svelte';

const store = createReactor({ count: 0 }, {
  plugins: [undoRedo()]
});

onDestroy(() => store.destroy());  // REQUIRED

function increment() {
  store.update(s => { s.count++; }, 'increment');
}
</script>

<button onclick={increment}>Count: {store.state.count}</button>
<button onclick={() => store.undo()} disabled={!store.canUndo()}>Undo</button>
```

## Anti-patterns

```typescript
// WRONG: Direct mutation
store.state.count++;

// WRONG: Missing cleanup
const store = createReactor({});  // Memory leak!

// WRONG: Persisting sensitive data
persist({ key: 'auth', pick: ['token'] });  // Use omit instead

// WRONG: Not using select for specific fields
store.subscribe(s => console.log(s.user.name));  // Use select()
```

## Error Messages

Format: `[Reactor:name] message`

- `Cannot operate on destroyed reactor`
- `Storage quota exceeded in localStorage`
- `initialState must be a non-null object`
- `update() requires a function`
