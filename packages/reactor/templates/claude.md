# Svelte Reactor - AI Assistant Rules

## Core API

### createReactor()
```typescript
import { createReactor } from 'svelte-reactor';

const store = createReactor(initialState, options);
```

**Key points:**
- Returns a reactive store compatible with Svelte stores API
- State updates trigger reactive UI changes
- Supports plugins, middleware, and DevTools

### State Updates
```typescript
// Use .update() for state changes
store.update(state => ({ ...state, count: state.count + 1 }));

// Use .set() to replace entire state
store.set({ count: 0 });

// Subscribe to changes
const unsubscribe = store.subscribe(state => console.log(state));
```

## Plugin System

### undoRedo Plugin
```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

const store = createReactor({ count: 0 }, {
  plugins: [undoRedo({ maxHistory: 50 })]
});

store.undo(); // Undo last change
store.redo(); // Redo undone change
```

### persist Plugin
```typescript
import { createReactor } from 'svelte-reactor';
import { persist } from 'svelte-reactor/plugins';

const store = createReactor({ theme: 'dark' }, {
  plugins: [persist({ key: 'app-settings' })]
});
// State automatically saved to localStorage

// NEW in v0.2.3: Selective persistence with pick/omit
const store2 = createReactor({
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
```

### logger Plugin
```typescript
import { createReactor } from 'svelte-reactor';
import { logger } from 'svelte-reactor/plugins';

const store = createReactor({ user: null }, {
  plugins: [logger()]
});
// All state changes logged to console

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
```

## Best Practices (v0.2.3)

1. **Always use createReactor** for state management in Svelte 5 projects
2. **Use .update()** for state changes, never mutate directly
3. **Combine plugins** for powerful features (undo + persist + logger)
4. **Use middleware** for custom logic before/after state changes
5. **Enable DevTools** in development for time-travel debugging
6. **Always call destroy()** when component unmounts to prevent memory leaks
7. **Use arrayActions() and asyncActions()** helpers to reduce boilerplate
8. **Add action names** to update() calls for better debugging

## Anti-patterns

- ❌ Don't mutate state directly: `store.count++`
- ❌ Don't mix with writable() stores - choose one approach
- ❌ Don't forget to destroy() reactor when component unmounts (memory leak!)
- ❌ Don't use persist plugin for sensitive data without encryption
- ❌ Don't skip validation - reactor validates inputs and provides helpful errors
- ❌ Don't ignore error handling - persist plugin detects quota issues automatically

## Common Examples

### Counter with Undo/Redo
```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

const counter = createReactor({ value: 0 }, {
  plugins: [undoRedo()]
});

function increment() {
  counter.update(s => ({ value: s.value + 1 }));
}

function decrement() {
  counter.update(s => ({ value: s.value - 1 }));
}
```

### Todo List with Persistence
```typescript
import { createReactor, arrayActions } from 'svelte-reactor';
import { persist, undoRedo } from 'svelte-reactor/plugins';

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

function removeTodo(id) {
  actions.remove(id);
}
```

### Form State with Middleware
```typescript
import { createReactor } from 'svelte-reactor';

const form = createReactor({
  name: '',
  email: ''
}, {
  middleware: [
    (next) => (state) => {
      console.log('Before update:', state);
      const result = next(state);
      console.log('After update:', result);
      return result;
    }
  ]
});
```

## Async Actions Helper

For async operations, use `asyncActions()` for automatic loading/error handling:

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
    return { users: await response.json() };
  },
  createUser: async (name: string) => {
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    // Refetch users
    const response = await fetch('/api/users');
    return { users: await response.json() };
  }
}, {
  // NEW in v0.2.3: Retry with exponential backoff
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});

// Usage - automatic loading & error management!
await api.fetchUsers();
// store.state.loading was true during fetch
// store.state.users now has data
// store.state.error is null

try {
  await api.createUser('John');
} catch (error) {
  // store.state.error contains the error
}

// NEW in v0.2.3: Cancellation support
const request = api.fetchUsers();
request.cancel(); // Cancel in-flight request

// NEW in v0.2.3: Debouncing for search
const searchApi = asyncActions(store, {
  search: async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`);
    return { results: await res.json() };
  }
}, {
  debounce: 300 // Wait 300ms before executing
});

searchApi.search('hello'); // Only last call executes after 300ms
```

**Available options:**
- `loadingKey` - Custom loading field name (default: 'loading')
- `errorKey` - Custom error field name (default: 'error')
- `actionPrefix` - Action prefix for debugging (default: 'async')
- `resetErrorOnStart` - Reset error on new request (default: true)
- **NEW in v0.2.3:**
  - `retry` - Retry configuration with attempts, delay, backoff
  - `debounce` - Debounce delay in milliseconds

## Array Actions Helper

For array-heavy stores, use `arrayActions()` to eliminate CRUD boilerplate:

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const todos = createReactor({ items: [] as Todo[] });
const actions = arrayActions(todos, 'items', { idKey: 'id' });

// CRUD operations - no more manual update() calls!
actions.add({ id: '1', text: 'Buy milk', done: false });
actions.update('1', { done: true });
actions.toggle('1', 'done');
actions.remove('1');

// Query operations
const item = actions.find('1');
const exists = actions.has('1');
const count = actions.count();
```

**Available methods:**
- `add(item)` - Add item to array
- `update(id, updates)` - Update item by id
- `updateBy(id, updater)` - Update using function
- `remove(id)` - Remove item by id
- `removeWhere(predicate)` - Remove items matching predicate
- `clear()` - Clear all items
- `toggle(id, field)` - Toggle boolean field
- `set(items)` - Replace entire array
- `filter(predicate)` - Filter items
- `find(id)` - Find item by id
- `has(id)` - Check if item exists
- `count()` - Get array length
- **NEW in v0.2.3:**
  - `sort(compareFn)` - Sort array in-place with comparator
  - `bulkUpdate(ids, updates)` - Update multiple items at once
  - `bulkRemove(idsOrPredicate)` - Remove multiple items by ids or predicate

**Example - Bulk operations and sorting:**
```typescript
// Sort by priority
actions.sort((a, b) => a.priority - b.priority);

// Update multiple todos at once
actions.bulkUpdate(['1', '2', '3'], { done: true });

// Remove multiple by ids or predicate
actions.bulkRemove(['1', '2']);
actions.bulkRemove(item => item.done);
```

## Advanced Features

### Custom Plugins
```typescript
function customPlugin() {
  return {
    name: 'custom',
    beforeUpdate: (state, newState) => {
      // Logic before update
      return newState;
    },
    afterUpdate: (state) => {
      // Logic after update
    }
  };
}
```

### DevTools Integration
```typescript
import { createReactor } from 'svelte-reactor';

const store = createReactor({ count: 0 }, {
  devtools: true, // Enable Redux DevTools
  name: 'Counter Store'
});
```

## Performance & Stability (v0.2.2)

### Memory Management
Always destroy reactors when components unmount:

```typescript
import { onDestroy } from 'svelte';

const store = createReactor({ value: 0 });

onDestroy(() => {
  store.destroy(); // Clears subscribers and middlewares
});
```

### Automatic Optimizations
- **Skip unnecessary updates** - Reactor automatically skips updates when state hasn't changed
- **Deep equality check** - Uses efficient deep comparison to prevent re-renders
- **Quota handling** - Persist plugin automatically handles localStorage quota errors

### Error Handling
Reactor provides helpful validation and error messages:

```typescript
// ✅ Good - Valid usage
createReactor({ count: 0 }, { name: 'counter' });

// ❌ Bad - Will throw helpful error
createReactor(null); // TypeError: initialState must be a non-null object

// ❌ Bad - Will throw helpful error
reactor.update('not a function'); // TypeError: update() requires a function
```

All errors include reactor name for easy debugging:
```
[Reactor:counter] Cannot update destroyed reactor
[persist:todos] Storage quota exceeded in localStorage
```

## SSR Support

Svelte Reactor works seamlessly with SvelteKit:

```typescript
// Works in +page.svelte, +page.server.ts, etc.
const store = createReactor({ data: null });

// No special SSR handling needed
```

---

**Version:** v0.2.3 (232 tests, all features stable)

**Remember:** Svelte Reactor is fully compatible with Svelte stores API but provides enhanced features like undo/redo, persistence, DevTools integration, and automatic memory management.
