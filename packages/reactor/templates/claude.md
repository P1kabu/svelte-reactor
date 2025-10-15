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
```

### logger Plugin
```typescript
import { createReactor } from 'svelte-reactor';
import { logger } from 'svelte-reactor/plugins';

const store = createReactor({ user: null }, {
  plugins: [logger()]
});
// All state changes logged to console
```

## Best Practices

1. **Always use createReactor** for state management in Svelte 5 projects
2. **Use .update()** for state changes, never mutate directly
3. **Combine plugins** for powerful features (undo + persist + logger)
4. **Use middleware** for custom logic before/after state changes
5. **Enable DevTools** in development for time-travel debugging

## Anti-patterns

- ❌ Don't mutate state directly: `store.count++`
- ❌ Don't mix with writable() stores - choose one approach
- ❌ Don't forget to unsubscribe when component unmounts
- ❌ Don't use persist plugin for sensitive data without encryption

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
import { createReactor } from 'svelte-reactor';
import { persist, undoRedo } from 'svelte-reactor/plugins';

const todos = createReactor({ items: [] }, {
  plugins: [
    persist({ key: 'todos' }),
    undoRedo()
  ]
});

function addTodo(text) {
  todos.update(s => ({
    items: [...s.items, { id: Date.now(), text, done: false }]
  }));
}

function toggleTodo(id) {
  todos.update(s => ({
    items: s.items.map(t => t.id === id ? { ...t, done: !t.done } : t)
  }));
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

## SSR Support

Svelte Reactor works seamlessly with SvelteKit:

```typescript
// Works in +page.svelte, +page.server.ts, etc.
const store = createReactor({ data: null });

// No special SSR handling needed
```

---

**Remember:** Svelte Reactor is fully compatible with Svelte stores API but provides enhanced features like undo/redo, persistence, and DevTools integration.
