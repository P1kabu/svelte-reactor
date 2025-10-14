# svelte-reactor

> **Production-ready** reactive state management for Svelte 5 with full **Svelte stores API** compatibility

[![npm version](https://img.shields.io/npm/v/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![npm downloads](https://img.shields.io/npm/dm/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-reactor?style=flat&label=gzip)](https://bundlephobia.com/package/svelte-reactor)
[![Build Status](https://github.com/P1kabu/svelte-reactor/workflows/CI/badge.svg)](https://github.com/P1kabu/svelte-reactor/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

**The most powerful state management for Svelte 5** - Combines the simplicity of Svelte stores with advanced features like undo/redo, persistence, and time-travel debugging.

## ✨ What's New in v0.2.0

🎉 **Full Svelte stores API compatibility** - Drop-in replacement for `writable()` stores with `subscribe()` support
🛠️ **Helper functions** - `simpleStore()`, `persistedStore()`, `persistedReactor()` for common use cases
🔒 **Enhanced security** - Selective persistence with `pick`/`omit` to exclude sensitive data
🚀 **Production-ready** - SSR support, TypeScript improvements, comprehensive documentation

👉 **[Quick Start Guide](./QUICK_START.md)** | **[Migration Guide](./MIGRATION.md)**

## 🚀 Features

- **✅ Svelte Stores Compatible** - Full `subscribe()` API, works with `$store` auto-subscription
- **📦 Simple Helpers** - `simpleStore()` for basic stores, `persistedStore()` for localStorage
- **♻️ Undo/Redo** - Built-in history management with batch operations
- **💾 Smart Persistence** - Auto-save to localStorage with selective field persistence
- **🔒 Security First** - Exclude sensitive data with `pick`/`omit` options
- **🎮 DevTools** - Time-travel debugging and state inspection
- **⚡ SSR-Ready** - Works seamlessly with SvelteKit on server and client
- **🎯 Type-safe** - Full TypeScript support with excellent inference
- **🪶 Lightweight** - **11.47 KB gzipped** (full), tree-shakeable modules
- **0️⃣ Zero dependencies** - Only requires Svelte 5

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

## 📖 Quick Start

### 🎯 Simple Counter (3 lines!)

```typescript
import { simpleStore } from 'svelte-reactor';

export const counter = simpleStore(0);
```

```svelte
<script>
  import { counter } from './stores';
</script>

<!-- Works with $ auto-subscription! -->
<button onclick={() => counter.update(n => n + 1)}>
  Count: {$counter}
</button>
```

### 💾 Persisted Counter (Auto-saves to localStorage)

```typescript
import { persistedStore } from 'svelte-reactor';

// Automatically persists to localStorage
export const counter = persistedStore('counter', 0);
```

```svelte
<script>
  import { counter } from './stores';
</script>

<!-- State persists across page reloads! -->
<button onclick={() => counter.update(n => n + 1)}>
  Count: {$counter}
</button>
```

### 🔒 Secure User Store (Exclude sensitive data)

```typescript
import { persistedStore } from 'svelte-reactor';

export const user = persistedStore('user', {
  name: 'John',
  email: 'john@example.com',
  token: 'secret_token_123',
  sessionId: 'temp_session'
}, {
  // Only persist name and email, never save tokens!
  omit: ['token', 'sessionId']
});
```

### ♻️ Advanced Store with Undo/Redo

```typescript
import { persistedReactor } from 'svelte-reactor';
import { undoRedo, logger } from 'svelte-reactor/plugins';

export const editor = persistedReactor('editor', {
  content: '',
  history: []
}, {
  additionalPlugins: [
    undoRedo({ limit: 50 }),
    logger({ collapsed: true })
  ]
});
```

```svelte
<script>
  import { editor } from './stores';
</script>

<textarea bind:value={editor.state.content}></textarea>

<button onclick={() => editor.undo()} disabled={!editor.canUndo()}>
  Undo ↩
</button>
<button onclick={() => editor.redo()} disabled={!editor.canRedo()}>
  Redo ↪
</button>
```

## 📚 API Overview

### Helper Functions (Recommended)

#### `simpleStore(initialValue, options?)`
**→ [Full Svelte stores API](./QUICK_START.md#simple-counter-store)**

Simple writable store compatible with Svelte's `$store` syntax.

```typescript
import { simpleStore } from 'svelte-reactor';

const counter = simpleStore(0);
counter.subscribe(value => console.log(value));
counter.update(n => n + 1);
counter.set(5);
console.log(counter.get()); // 5
```

#### `persistedStore(key, initialValue, options?)`
**→ [Auto-save to localStorage](./QUICK_START.md#persisted-store)**

Create a store that automatically persists to localStorage/sessionStorage.

```typescript
import { persistedStore } from 'svelte-reactor';

const settings = persistedStore('app-settings', { theme: 'dark' }, {
  storage: 'localStorage', // or 'sessionStorage'
  debounce: 300,           // Save after 300ms of inactivity
  omit: ['user.token'],    // Don't persist sensitive data
  pick: ['theme', 'lang'], // Or only persist specific fields
});
```

#### `persistedReactor(key, initialState, options?)`
**→ [Full reactor with persistence](./QUICK_START.md#full-reactor-with-undoredo)**

Full reactor API with automatic persistence and plugin support.

```typescript
import { persistedReactor } from 'svelte-reactor';
import { undoRedo } from 'svelte-reactor/plugins';

const store = persistedReactor('my-state', { count: 0 }, {
  additionalPlugins: [undoRedo()],
  omit: ['temp'], // Exclude temporary fields
});

store.update(s => { s.count++; });
store.undo(); // Undo last change
```

---

### Core API

#### `createReactor(initialState, options?)`

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

  // Svelte stores API (v0.2.0+)
  subscribe(subscriber: (state: T) => void): () => void;

  // Actions
  update(updater: (state: T) => void, action?: string): void;
  set(newState: Partial<T>): void;

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

Built-in state persistence with security features.

```typescript
import { persist } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    persist({
      key: 'my-state',
      storage: 'localStorage',    // or 'sessionStorage'
      debounce: 300,               // Save after 300ms

      // NEW in v0.2.0: Security options
      omit: ['user.token'],        // Exclude sensitive fields
      pick: ['settings', 'theme'], // Or only persist specific fields

      // NEW in v0.2.0: Custom serialization
      serialize: (state) => ({      // Custom save logic
        ...state,
        savedAt: Date.now()
      }),
      deserialize: (stored) => {    // Custom load logic
        const { savedAt, ...state } = stored;
        return state;
      },

      // Optional features
      compress: false,
      version: 1,
      migrations: {
        1: (old) => ({ ...old, newField: 'value' })
      },
    }),
  ],
});
```

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
- **Bundle size**: 12.07 KB gzipped (full package)

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
