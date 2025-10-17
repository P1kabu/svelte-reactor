# svelte-reactor

> Powerful reactive state management for Svelte 5

[![npm version](https://img.shields.io/npm/v/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![npm downloads](https://img.shields.io/npm/dm/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-reactor?style=flat&label=gzip)](https://bundlephobia.com/package/svelte-reactor)
[![Build Status](https://github.com/P1kabu/svelte-reactor/workflows/CI/badge.svg)](https://github.com/P1kabu/svelte-reactor/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

A comprehensive state management library for Svelte 5 applications with built-in undo/redo, middleware, persistence, and DevTools support.

## Features

- **Svelte 5 Runes** - Built specifically for `$state`, `$derived`, and `$effect`
- **Undo/Redo** - Full history management with batch operations
- **Array Actions** - Helper for common CRUD operations (add, update, remove, toggle)
- **Async Actions** - Automatic loading/error state management for async operations
- **Middleware** - Redux-style middleware for logging, effects, and more
- **Persistence** - Built-in persist plugin for localStorage/sessionStorage
- **DevTools** - Time-travel debugging and state inspection
- **AI-Ready** - CLI to teach AI assistants (Claude, Cursor, Copilot) best practices
- **Type-safe** - Full TypeScript support with excellent type inference
- **SSR-safe** - Works seamlessly with SvelteKit
- **Tiny** - **10.87 KB gzipped** (full package), **1.05 KB** (plugins only)
- **Tree-shakeable** - Import only what you need
- **Zero dependencies** - Only requires Svelte 5

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

## Live Demo

Try the interactive demo: [examples/reactor-demos](./examples/reactor-demos)

Run locally:
```bash
cd examples/reactor-demos
pnpm install
pnpm dev
```

## AI Assistant Setup

Teach your AI assistant (Claude Code, Cursor, or GitHub Copilot) the best practices for using Svelte Reactor:

```bash
npx svelte-reactor init-ai
```

This interactive CLI will generate AI instructions tailored to your preferred assistant:

- **Claude Code**: Creates `.claude/SVELTE_REACTOR_RULES.md`
- **Cursor AI**: Creates `.cursorrules`
- **GitHub Copilot**: Creates `.github/copilot-instructions.md`

After setup, your AI will automatically:
- Use `createReactor()` for state management
- Apply best practices for plugins and middleware
- Suggest proper patterns for undo/redo and persistence
- Avoid common anti-patterns

## Quick Start

### Basic Counter with Undo/Redo

```svelte
<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { undoRedo, logger } from 'svelte-reactor/plugins';

  const counter = createReactor(
    { value: 0 },
    {
      name: 'counter',
      devtools: true,  // Enable Redux DevTools
      plugins: [
        undoRedo({ limit: 50 }),
        logger({ collapsed: true }),
      ],
    }
  );

  function increment() {
    counter.update(state => {
      state.value++;
    }, 'increment');
  }
</script>

<button onclick={increment}>
  Count: {counter.state.value}
</button>

<button onclick={() => counter.undo()} disabled={!counter.canUndo()}>
  Undo
</button>

<button onclick={() => counter.redo()} disabled={!counter.canRedo()}>
  Redo
</button>
```

### Todo List with Persistence

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
    { items: [] as Todo[] },
    {
      name: 'todos',
      devtools: true,
      plugins: [
        persist({ key: 'todos', debounce: 300 }),
        undoRedo({ limit: 100 }),
      ],
    }
  );

  function addTodo(text: string) {
    todos.update(state => {
      state.items.push({
        id: crypto.randomUUID(),
        text,
        done: false,
      });
    }, 'add-todo');
  }
</script>
```

## API Reference

### `createReactor(initialState, options?)`

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

  // Actions
  update(updater: (state: T) => void, action?: string): void;
  set(newState: T): void;

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

Built-in state persistence to localStorage/sessionStorage with automatic cross-tab synchronization.

```typescript
import { persist } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    persist({
      key: 'my-state',
      storage: 'localStorage', // or 'sessionStorage'
      debounce: 300,
      compress: false, // Optional compression (v0.2.0+)
      migrations: {}, // Optional version migrations
    }),
  ],
});
```

**Features:**
- **Auto-sync**: Changes from other tabs (localStorage) are automatically synced
- **DevTools friendly**: Manual changes in DevTools are detected
- **Debouncing**: Configurable debounce to reduce write frequency
- **Migrations**: Schema versioning for backwards compatibility

#### `logger(options?)`

Log all state changes to console.

```typescript
import { logger } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    logger({
      collapsed: true, // Collapse console groups
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

## Utilities

Powerful utility functions for state management:

```typescript
import { diff, applyPatch, getChangeSummary, deepClone, isEqual } from 'svelte-reactor/utils';

// State diffing
const changes = diff(oldState, newState);
console.log(changes); // { changes: [...], hasChanges: true }

// Apply patches
const newState = applyPatch(state, changes);

// Get change summary
const summary = getChangeSummary(changes);
console.log(summary); // { added: 2, modified: 3, removed: 1 }

// Deep clone
const cloned = deepClone(state);

// Deep equality
const equal = isEqual(state1, state2);
```

## Array Actions Helper

Reduce boilerplate for common array operations with the `arrayActions` helper:

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
actions.remove('1');
actions.clear();

// Advanced operations
actions.toggle('1', 'done');                    // Toggle boolean field
actions.filter(item => !item.done);              // Filter items
actions.removeWhere(item => item.done);          // Remove by predicate

// Query operations (don't trigger updates)
const item = actions.find('1');                  // Find by id
const exists = actions.has('1');                 // Check existence
const count = actions.count();                   // Get count
```

**Features:**
- **Less boilerplate**: No need to write `update()` for every operation
- **Type-safe**: Full TypeScript inference for array items
- **Undo/Redo compatible**: Works seamlessly with undoRedo plugin
- **Action names**: Automatic action names for better debugging (`items:add`, `items:update`, etc.)

**Available Methods:**

```typescript
actions.add(item)                    // Add item to array
actions.update(id, updates)          // Update item by id
actions.updateBy(id, updater)        // Update using function
actions.remove(id)                   // Remove item by id
actions.removeWhere(predicate)       // Remove items matching predicate
actions.clear()                      // Clear all items
actions.toggle(id, field)            // Toggle boolean field
actions.set(items)                   // Replace entire array
actions.filter(predicate)            // Filter items
actions.find(id)                     // Find item by id
actions.has(id)                      // Check if item exists
actions.count()                      // Get array length
```

## Async Actions Helper

Automatic loading and error state management for async operations:

```typescript
import { createReactor, asyncActions } from 'svelte-reactor';

interface User {
  id: number;
  name: string;
}

const store = createReactor({
  users: [] as User[],
  loading: false,
  error: null as Error | null,
});

// Define async actions
const api = asyncActions(store, {
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    const users = await response.json();
    return { users };
  },
  createUser: async (name: string) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const newUser = await response.json();
    return { users: [...store.state.users, newUser] };
  },
});

// Usage - automatically handles loading & error states!
await api.fetchUsers();
// store.state.loading was true during fetch
// store.state.users is now populated
// store.state.error is null

try {
  await api.createUser('John');
} catch (error) {
  // store.state.loading is false
  // store.state.error contains the error
}
```

**Features:**
- **Automatic loading state**: Sets `loading: true` before, `false` after
- **Error handling**: Catches errors and sets `error` state
- **Type-safe**: Full TypeScript inference for parameters and return values
- **Customizable**: Configure loading/error field names
- **Works with undo/redo**: Integrates seamlessly with other features

**Options:**

```typescript
const api = asyncActions(store, actions, {
  loadingKey: 'isLoading',      // Custom loading field (default: 'loading')
  errorKey: 'lastError',         // Custom error field (default: 'error')
  actionPrefix: 'api',           // Custom action prefix (default: 'async')
  resetErrorOnStart: true,       // Reset error on new request (default: true)
});
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
- **Bundle size**: 10.87 KB gzipped (full package)

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
      name: 'todos',
      devtools: true,
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

### ✅ Phase 1: MVP (v0.1.0)
- ✅ Core reactor with Svelte 5 Runes
- ✅ Basic undo/redo
- ✅ Plugin system
- ✅ TypeScript types

### ✅ Phase 2: Core Features (v0.2.0)
- ✅ Advanced undo/redo with batch operations
- ✅ Middleware system
- ✅ Persist integration
- ✅ State utilities (diff, clone, equality)

### ✅ Phase 3: Developer Experience (v0.2.0)
- ✅ DevTools API with Redux DevTools integration
- ✅ Time-travel debugging
- ✅ Performance benchmarks
- ✅ Comprehensive documentation
- ✅ AI Assistant CLI (Claude Code, Cursor AI, GitHub Copilot)
- ✅ Interactive demo site

### ✅ Phase 4: Async & Helpers (v0.2.1)
- ✅ Array Actions Helper - `arrayActions()` for CRUD operations
- ✅ Async Actions Helper - `asyncActions()` for loading/error management
- ✅ Enhanced Migration Guide

### ✅ Phase 5: Stability & Bug Fixes (v0.2.2)
- ✅ Memory leak fixes (subscribers, middlewares cleanup)
- ✅ Performance optimization (skip unchanged updates)
- ✅ Enhanced error handling and validation
- ✅ Persist plugin improvements (quota handling)

### Phase 6: Future (v0.3.0+)
- ⏳ Multi-tab synchronization with BroadcastChannel
- ⏳ Plugin ecosystem
- ⏳ Visual DevTools UI
- ⏳ Advanced selectors and computed state

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

- **181 tests** covering all features
- Unit tests for core reactor, plugins, utilities, helpers, and DevTools
- Performance benchmarks for all operations
- TypeScript type checking

Run tests with `pnpm test` or `pnpm test:watch` for development.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Credits

Built with love for the Svelte community.
