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

// ❌ BAD: Manual console.log everywhere
console.log('before', user);
user = newUser;
console.log('after', user);
```

## Real-World Examples

### Todo List

```typescript
import { createReactor } from 'svelte-reactor';
import { persist, undoRedo } from 'svelte-reactor/plugins';

// ✅ GOOD: Full-featured todos
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
    items: s.items.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
  }));
}

function deleteTodo(id) {
  todos.update(s => ({
    items: s.items.filter(t => t.id !== id)
  }));
}

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

## Common Mistakes

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

// ❌ BAD: Not unsubscribing
const unsub = store.subscribe(console.log);
// Memory leak if not cleaned up!

// ✅ GOOD: Cleanup
onDestroy(() => unsub());
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

**Key Takeaway:** Use `createReactor()` for all state, never mutate directly, leverage plugins for common features.
