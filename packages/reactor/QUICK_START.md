# 🚀 Quick Start Guide

## Installation

```bash
npm install @svelte-dev/reactor
```

## Basic Usage

### Simple Counter Store

```typescript
import { simpleStore } from '@svelte-dev/reactor';

// Create a simple writable store
export const counter = simpleStore(0);

// Use in component
counter.subscribe(value => console.log(value)); // 0
counter.update(n => n + 1);
console.log(counter.get()); // 1
```

### Persisted Store (Auto-save to localStorage)

```typescript
import { persistedStore } from '@svelte-dev/reactor';

// Simple persisted counter
export const counter = persistedStore('counter', 0);

// With options
export const settings = persistedStore('app-settings', { theme: 'dark' }, {
  storage: 'localStorage',
  debounce: 300, // Save after 300ms of inactivity
  omit: ['user.token'], // Don't persist sensitive data
});
```

### Full Reactor with Undo/Redo

```typescript
import { createReactor } from '@svelte-dev/reactor';
import { undoRedo, logger } from '@svelte-dev/reactor/plugins';

const store = createReactor(
  { count: 0, name: 'John' },
  {
    plugins: [
      undoRedo({ limit: 50 }),
      logger({ collapsed: true })
    ]
  }
);

// Subscribe to changes (Svelte stores compatible!)
store.subscribe(state => console.log(state));

// Update state
store.update(state => { state.count++; });

// Undo/Redo
store.undo();
store.redo();
```

## Svelte Component Usage

### With $state Auto-subscription

```svelte
<script>
  import { counter } from './stores';

  // Auto-subscribe with $
  $: count = $counter;
</script>

<button onclick={() => counter.update(n => n + 1)}>
  Count: {count}
</button>
```

### With Manual Subscription

```svelte
<script>
  import { onMount } from 'svelte';
  import { counter } from './stores';

  let count = 0;

  onMount(() => {
    const unsubscribe = counter.subscribe(value => {
      count = value;
    });

    return unsubscribe;
  });
</script>

<button onclick={() => counter.update(n => n + 1)}>
  Count: {count}
</button>
```

### With Runes (Svelte 5)

```svelte
<script>
  import { createReactor } from '@svelte-dev/reactor';

  const store = createReactor({ count: 0 });

  // Use reactive state directly
  let count = $derived(store.state.count);
</script>

<button onclick={() => store.update(s => { s.count++; })}>
  Count: {count}
</button>
```

## Advanced Features

### Selective Persistence (Security)

```typescript
import { persistedStore } from '@svelte-dev/reactor';

const userStore = persistedStore('user', {
  name: 'John',
  email: 'john@example.com',
  token: 'secret123',
  sessionId: 'temp456'
}, {
  // Only persist name and email, exclude sensitive data
  omit: ['token', 'sessionId']
});
```

### Custom Serialization

```typescript
const store = persistedStore('data', initialValue, {
  serialize: (state) => {
    // Custom serialization logic
    return {
      ...state,
      timestamp: Date.now()
    };
  },
  deserialize: (stored) => {
    // Custom deserialization logic
    const { timestamp, ...rest } = stored;
    console.log('Loaded from:', new Date(timestamp));
    return rest;
  }
});
```

### Non-Svelte Context (onChange callback)

```typescript
import { createReactor } from '@svelte-dev/reactor';

// Use in plain JavaScript/TypeScript (no Svelte needed)
const store = createReactor(
  { count: 0 },
  {
    onChange: (state, prevState, action) => {
      console.log('Changed:', prevState.count, '→', state.count);
    }
  }
);

store.update(s => { s.count++; });
```

### SSR-Safe (Server-Side Rendering)

```typescript
import { persistedStore } from '@svelte-dev/reactor';

// Automatically handles SSR - persistence disabled on server
export const settings = persistedStore('settings', { theme: 'dark' });

// Works on both server and client!
```

## Examples

### Todo List

```typescript
import { persistedReactor } from '@svelte-dev/reactor';
import { undoRedo } from '@svelte-dev/reactor/plugins';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export const todos = persistedReactor(
  'todos',
  { items: [] as Todo[], nextId: 1 },
  {
    additionalPlugins: [undoRedo({ limit: 20 })],
  }
);

// Add todo
export function addTodo(text: string) {
  todos.update(state => {
    state.items.push({
      id: state.nextId++,
      text,
      done: false
    });
  });
}

// Toggle todo
export function toggleTodo(id: number) {
  todos.update(state => {
    const todo = state.items.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
  });
}
```

### Form Management

```typescript
import { createReactor } from '@svelte-dev/reactor';

export const formStore = createReactor({
  values: { email: '', password: '' },
  errors: {} as Record<string, string>,
  touched: {} as Record<string, boolean>,
  isSubmitting: false,
});

export function setFieldValue(field: string, value: string) {
  formStore.update(state => {
    state.values[field] = value;
    state.touched[field] = true;
  });
}

export function validate() {
  formStore.update(state => {
    state.errors = {};
    if (!state.values.email) {
      state.errors.email = 'Required';
    }
    if (state.values.password.length < 6) {
      state.errors.password = 'Min 6 characters';
    }
  });

  return Object.keys(formStore.state.errors).length === 0;
}
```

## API Comparison

| Feature | simpleStore | persistedStore | createReactor |
|---------|-------------|----------------|---------------|
| Svelte stores API | ✅ | ✅ | ✅ |
| subscribe() | ✅ | ✅ | ✅ |
| Persistence | ❌ | ✅ | Via plugin |
| Undo/Redo | ❌ | ❌ | Via plugin |
| Middleware | ❌ | ❌ | ✅ |
| History tracking | ❌ | ❌ | ✅ |
| DevTools | ❌ | ❌ | ✅ |

## Next Steps

- [Full API Reference](./API.md)
- [Migration Guide](./MIGRATION.md)
- [Plugin Development](./PLUGINS.md)
- [Examples](../../examples)
