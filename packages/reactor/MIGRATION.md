# 📦 Migration Guide

## From Svelte Writable Stores

### Before (Svelte stores)

```typescript
import { writable } from 'svelte/store';

export const counter = writable(0);

// Usage
counter.subscribe(value => console.log(value));
counter.update(n => n + 1);
counter.set(5);
```

### After (svelte-reactor - Simple)

```typescript
import { simpleStore } from 'svelte-reactor';

export const counter = simpleStore(0);

// Same API!
counter.subscribe(value => console.log(value));
counter.update(n => n + 1);
counter.set(5);
```

### After (svelte-reactor - Full)

```typescript
import { createReactor } from 'svelte-reactor';

export const counter = createReactor({ value: 0 });

// Enhanced API
counter.subscribe(state => console.log(state.value));
counter.update(state => { state.value++; });
counter.set({ value: 5 });

// Bonus: Undo/Redo available with plugin!
```

## From svelte-persist

### Before (svelte-persist)

```typescript
import persist from 'svelte-persist';

export const counter = persist('counter', 0);
```

### After (svelte-reactor)

```typescript
import { persistedStore } from 'svelte-reactor';

export const counter = persistedStore('counter', 0);

// Same API + more features!
```

### With Advanced Options

```typescript
import { persistedStore } from 'svelte-reactor';

export const settings = persistedStore('app-settings', {
  theme: 'dark',
  apiKey: 'secret'
}, {
  storage: 'localStorage',
  debounce: 300,
  omit: ['apiKey'], // Don't persist sensitive data!
  version: 1,
  migrations: {
    1: (old) => ({ ...old, newField: 'default' })
  }
});
```

## From Zustand

### Before (Zustand)

```typescript
import create from 'zustand';

export const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### After (svelte-reactor)

```typescript
import { createReactor } from 'svelte-reactor';

export const store = createReactor({
  count: 0,
});

// Methods can be separate functions
export function increment() {
  store.update(state => { state.count++; });
}

export function decrement() {
  store.update(state => { state.count--; });
}
```

## From Nanostores

### Before (Nanostores)

```typescript
import { atom } from 'nanostores';

export const counter = atom(0);

counter.subscribe(value => console.log(value));
counter.set(5);
```

### After (svelte-reactor)

```typescript
import { simpleStore } from 'svelte-reactor';

export const counter = simpleStore(0);

counter.subscribe(value => console.log(value));
counter.set(5);

// Bonus: Built-in persistence, undo/redo, and more!
```

## From Redux

### Before (Redux)

```typescript
import { createStore } from 'redux';

// Reducer
function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { value: state.value + 1 };
    case 'DECREMENT':
      return { value: state.value - 1 };
    default:
      return state;
  }
}

const store = createStore(counterReducer);

// Usage
store.subscribe(() => console.log(store.getState()));
store.dispatch({ type: 'INCREMENT' });
```

### After (svelte-reactor)

```typescript
import { createReactor } from 'svelte-reactor';

const store = createReactor({ value: 0 });

// Much simpler!
store.subscribe(state => console.log(state));
store.update(state => { state.value++; }, 'INCREMENT'); // Optional action name

// Bonus: Undo/redo built-in!
```

## Working with Arrays

### Before (writable - manual array operations)

```typescript
import { writable } from 'svelte/store';

const todos = writable([]);

// Adding item - verbose
function addTodo(text) {
  todos.update(items => [...items, { id: Date.now(), text, done: false }]);
}

// Toggling - complex
function toggleTodo(id) {
  todos.update(items =>
    items.map(t => t.id === id ? { ...t, done: !t.done } : t)
  );
}

// Removing - filtering
function removeTodo(id) {
  todos.update(items => items.filter(t => t.id !== id));
}
```

### After (reactor + arrayActions - clean & simple)

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

const todos = createReactor({ items: [] });
const actions = arrayActions(todos, 'items', { idKey: 'id' });

// Adding item - one line!
function addTodo(text) {
  actions.add({ id: Date.now(), text, done: false });
}

// Toggling - built-in!
function toggleTodo(id) {
  actions.toggle(id, 'done');
}

// Removing - simple!
function removeTodo(id) {
  actions.remove(id);
}

// Bonus: More methods available
actions.update(id, { text: 'New text' });
actions.removeWhere(t => t.done); // Remove all completed
actions.clear(); // Clear all
```

**Benefits:**
- ✅ 90% less boilerplate code
- ✅ TypeScript inference works perfectly
- ✅ Automatic action names for debugging
- ✅ Works with undo/redo plugin

---

## Async Operations & Loading States

### Before (manual loading/error management)

```typescript
import { writable } from 'svelte/store';

const users = writable([]);
const loading = writable(false);
const error = writable(null);

async function fetchUsers() {
  loading.set(true);
  error.set(null);

  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    users.set(data);
  } catch (e) {
    error.set(e);
  } finally {
    loading.set(false);
  }
}
```

### After (asyncActions - automatic!)

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
  }
});

// Usage - loading & error handled automatically!
await api.fetchUsers();
```

**Benefits:**
- ✅ No manual loading state management
- ✅ Automatic error handling
- ✅ Cleaner, more declarative code
- ✅ TypeScript inference for parameters

---

## Component Migration

### Before (Svelte 4 + writable)

```svelte
<script>
  import { writable } from 'svelte/store';

  const counter = writable(0);
</script>

<button on:click={() => $counter++}>
  Count: {$counter}
</button>
```

### After (Svelte 5 + reactor)

```svelte
<script>
  import { simpleStore } from 'svelte-reactor';

  const counter = simpleStore(0);
</script>

<button onclick={() => counter.update(n => n + 1)}>
  Count: {$counter}
</button>
```

### After (Svelte 5 Runes + reactor)

```svelte
<script>
  import { createReactor } from 'svelte-reactor';

  const store = createReactor({ count: 0 });
  let count = $derived(store.state.count);
</script>

<button onclick={() => store.update(s => { s.count++; })}>
  Count: {count}
</button>
```

## Feature Comparison

| Feature | writable | svelte-persist | zustand | nanostores | svelte-reactor |
|---------|----------|----------------|---------|------------|----------------|
| Svelte stores API | ✅ | ✅ | ❌ | ❌ | ✅ |
| Persistence | ❌ | ✅ | Via middleware | Via plugin | ✅ |
| Undo/Redo | ❌ | ❌ | Via middleware | ❌ | ✅ |
| Selective persistence | ❌ | ❌ | ✅ | ❌ | ✅ |
| DevTools | ❌ | ❌ | ✅ | ❌ | ✅ |
| SSR support | ✅ | ✅ | ✅ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bundle size | 0KB (built-in) | ~3KB | ~1KB | ~300B | ~15KB |

## Migration Checklist

### Step 1: Install svelte-reactor

```bash
npm install svelte-reactor
```

### Step 2: Update imports

```typescript
// Before
import { writable } from 'svelte/store';
import persist from 'svelte-persist';

// After
import { simpleStore, persistedStore } from 'svelte-reactor';
```

### Step 3: Update store creation

Choose the appropriate helper:
- `simpleStore()` - for basic writable stores
- `persistedStore()` - for persisted stores
- `createReactor()` - for advanced features

### Step 4: Update component usage

Most code should work as-is if using `simpleStore()` or `persistedStore()`, as they follow Svelte stores API.

### Step 5: Add features

Take advantage of new features:
- Selective persistence with `pick`/`omit`
- Undo/redo with `undoRedo()` plugin
- Logging with `logger()` plugin
- Custom serialization

### Step 6: Test

Run your tests to ensure everything works correctly.

## Common Issues

### Issue: "subscribe is not a function"

**Cause:** Using `createReactor()` but expecting Svelte stores behavior.

**Solution:** Use `simpleStore()` or `persistedStore()` instead, or manually implement the store contract.

### Issue: Persistence not working in SSR

**Cause:** Trying to access localStorage on server.

**Solution:** Use `persistedStore()` or `persistedReactor()` which automatically handle SSR.

### Issue: State not reactive in Svelte 5

**Cause:** Not using `subscribe()` or `$derived()`.

**Solution:**
```svelte
<script>
  // Option 1: Use subscribe
  let count;
  store.subscribe(s => count = s.value);

  // Option 2: Use $derived
  let count = $derived(store.state.value);
</script>
```

## Need Help?

- [Quick Start Guide](./QUICK_START.md)
- [API Reference](./API.md)
- [GitHub Issues](https://github.com/P1kabu/svelte-reactor/issues)
- [Discord Community](https://discord.gg/svelte)
