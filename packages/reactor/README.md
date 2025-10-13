# svelte-reactor

> Powerful reactive state management for Svelte 5

[![npm version](https://img.shields.io/npm/v/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![npm downloads](https://img.shields.io/npm/dm/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-reactor?style=flat&label=gzip)](https://bundlephobia.com/package/svelte-reactor)
[![Build Status](https://github.com/p1kabu/svelte-reactor/workflows/CI/badge.svg)](https://github.com/p1kabu/svelte-reactor/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

A comprehensive state management library for Svelte 5 applications with built-in undo/redo, middleware, persistence, and DevTools support.

## Features

- **Svelte 5 Runes** - Built specifically for `$state`, `$derived`, and `$effect`
- **Undo/Redo** - Full history management with batch operations
- **Middleware** - Redux-style middleware for logging, effects, and more
- **Persistence** - Seamless integration with @svelte-dev/persist
- **DevTools** - Time-travel debugging and state inspection
- **Type-safe** - Full TypeScript support with excellent type inference
- **SSR-safe** - Works seamlessly with SvelteKit
- **Tiny** - **12.07 KB gzipped** (full package), **1.03 KB** (plugins only)
- **Tree-shakeable** - Import only what you need
- **Zero dependencies** - Except Svelte 5 and @svelte-dev/persist

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

## Quick Start

### Basic Counter with Undo/Redo

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo, logger } from '@svelte-dev/reactor/plugins';

  const counter = createReactor(
    { value: 0 },
    {
      plugins: [
        undoRedo({ limit: 50 }),
        logger(),
      ],
    }
  );

  function increment() {
    counter.update(state => {
      state.value++;
    });
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
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo } from '@svelte-dev/reactor/plugins';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  const todos = createReactor(
    { items: [] as Todo[] },
    {
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
    });
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
import { undoRedo } from '@svelte-dev/reactor/plugins';

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

Integrate with @svelte-dev/persist for automatic state persistence.

```typescript
import { persist } from '@svelte-dev/reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    persist({
      key: 'my-state',
      storage: 'localStorage', // or 'sessionStorage', 'indexedDB'
      debounce: 300,
    }),
  ],
});
```

#### `logger(options?)`

Log all state changes to console.

```typescript
import { logger } from '@svelte-dev/reactor/plugins';

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
import { createReactor } from '@svelte-dev/reactor';
import { createDevTools } from '@svelte-dev/reactor/devtools';

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
import { diff, applyPatch, getChangeSummary, deepClone, isEqual } from '@svelte-dev/reactor/utils';

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

## Middleware

Create custom middleware for advanced use cases:

```typescript
import { createReactor } from '@svelte-dev/reactor';

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
- **Bundle size**: 12.07 KB gzipped (full package)

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks.

## Examples

### Complete Todo App

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo } from '@svelte-dev/reactor/plugins';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  const todos = createReactor(
    { items: [] as Todo[], filter: 'all' as 'all' | 'active' | 'done' },
    {
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

### ✅ Phase 3: Advanced (v0.3.0)
- ✅ DevTools API
- ✅ Time-travel debugging
- ✅ Performance benchmarks
- ✅ Comprehensive documentation
- ⏳ Multi-tab sync (optional)

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

- **93 tests** covering all features
- Unit tests for core reactor, plugins, utilities, and DevTools
- Performance benchmarks for all operations
- TypeScript type checking

Run tests with `pnpm test` or `pnpm test:watch` for development.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Credits

Built with love for the Svelte community.
