# svelte-reactor

> **Production-ready** reactive state management for Svelte 5 with full **Svelte stores API** compatibility

[![npm version](https://img.shields.io/npm/v/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![npm downloads](https://img.shields.io/npm/dm/svelte-reactor.svg?style=flat)](https://www.npmjs.com/package/svelte-reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-reactor?style=flat&label=gzip)](https://bundlephobia.com/package/svelte-reactor)
[![Build Status](https://github.com/P1kabu/svelte-reactor/workflows/CI/badge.svg)](https://github.com/P1kabu/svelte-reactor/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)

**The most powerful state management for Svelte 5** - Combines the simplicity of Svelte stores with advanced features like undo/redo, persistence, and time-travel debugging.

## ✨ What's New in v0.2.3

🔒 **Selective Persistence** - `pick`/`omit` options for security and performance
📊 **Array Enhancements** - `sort()`, `bulkUpdate()`, `bulkRemove()` methods
🔄 **Async Retry & Cancellation** - Retry logic, debouncing, and cancellation
🎯 **Advanced Logger Filtering** - Filter by action/state, performance tracking
🐛 **Critical Bug Fixes** - Unhandled rejection fixes, better error handling
✅ **232 tests** (+58 new) - All features thoroughly tested

Previous updates:
- **v0.2.2**: Memory leak fixes, performance optimization, enhanced validation
- **v0.2.1**: Async Actions Helper, Array Actions Helper
- **v0.2.0**: Full Svelte stores API compatibility

👉 **[Quick Start Guide](./QUICK_START.md)** | **[Migration Guide](./MIGRATION.md)** | **[Upgrade Guide v0.2.3](../../UPGRADES/UPGRADE-0.2.3.md)**

## 🚀 Features

- **✅ Svelte Stores Compatible** - Full `subscribe()` API, works with `$store` auto-subscription
- **📦 Simple Helpers** - `simpleStore()`, `persistedStore()`, `arrayActions()`, `asyncActions()`
- **🤖 AI-Powered Development** - Built-in AI assistant integration (Claude, Cursor, Copilot)
- **♻️ Undo/Redo** - Built-in history management with batch operations
- **💾 Smart Persistence** - localStorage, sessionStorage (IndexedDB planned for v0.3.0)
- **🔒 Security First** - Exclude sensitive data (tokens, passwords) from persistence
- **🔄 Network Resilience** - Retry logic with exponential backoff, request cancellation
- **📊 Bulk Operations** - Sort, bulk update/remove for arrays
- **🎯 Advanced Logging** - Filter by action/state, performance tracking
- **🎮 DevTools** - Time-travel debugging and state inspection
- **⚡ SSR-Ready** - Works seamlessly with SvelteKit on server and client
- **🎯 Type-safe** - Full TypeScript support with excellent inference
- **🪶 Lightweight** - **13.5 KB gzipped** (full), tree-shakeable modules
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

## Upgrading

📖 **[View All Upgrade Guides](../../UPGRADES/)**

- [v0.2.3](../../UPGRADES/UPGRADE-0.2.3.md) - Feature enhancements (selective persistence, retry, bulk ops)
- [v0.2.2](../../UPGRADES/UPGRADE-0.2.2.md) - Bug fixes & stability improvements

For general migration tips, see [MIGRATION.md](./MIGRATION.md).

### 🤖 AI Assistant Setup (Optional)

Supercharge your development with AI-powered code suggestions! Run this once to configure your AI assistant:

```bash
npx svelte-reactor init-ai
```

This will generate AI instructions for:
- **Claude Code** - `.claude/SVELTE_REACTOR_RULES.md`
- **Cursor AI** - `.cursorrules`
- **GitHub Copilot** - `.github/copilot-instructions.md`

Your AI assistant will then understand svelte-reactor patterns and suggest optimal code!

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

### 🔒 Secure User Store (Exclude sensitive data) - NEW in v0.2.3

```typescript
import { persistedStore } from 'svelte-reactor';

export const user = persistedStore('user', {
  name: 'John',
  email: 'john@example.com',
  token: 'secret_token_123',
  sessionId: 'temp_session',
  preferences: { theme: 'dark' }
}, {
  // Option 1: Only persist specific fields
  pick: ['name', 'email', 'preferences'],

  // Option 2: Exclude sensitive fields (can't use both)
  // omit: ['token', 'sessionId']
});

// Tokens never saved to localStorage - secure by default!
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

Simple writable store compatible with Svelte's `$store` syntax.

**→ [See full example in Quick Start](./QUICK_START.md#simple-counter-store)**

```typescript
import { simpleStore } from 'svelte-reactor';

const counter = simpleStore(0);
counter.subscribe(value => console.log(value));
counter.update(n => n + 1);
counter.set(5);
console.log(counter.get()); // 5
```

#### `persistedStore(key, initialValue, options?)`

Create a store that automatically persists to localStorage/sessionStorage (IndexedDB coming in v0.3.0).

**→ [See full example in Quick Start](./QUICK_START.md#persisted-store-auto-save-to-localstorage)**

```typescript
import { persistedStore } from 'svelte-reactor';

const settings = persistedStore('app-settings', { theme: 'dark' }, {
  storage: 'localStorage', // or 'sessionStorage' (indexedDB planned for v0.3.0)
  debounce: 300,           // Save after 300ms of inactivity

  // NEW in v0.2.3: Security options
  omit: ['user.token', 'temp'], // Exclude sensitive/temporary data
  // OR
  pick: ['theme', 'lang'],      // Only persist specific fields (can't use both)
});
```

#### `persistedReactor(key, initialState, options?)`

Full reactor API with automatic persistence and plugin support.

**→ [See full example in Quick Start](./QUICK_START.md#full-reactor-with-undoredo)**

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

#### `arrayActions(reactor, field, options?)`

Simplify array management with built-in CRUD operations.

**→ [See Migration Guide](./MIGRATION.md#working-with-arrays)**

```typescript
import { createReactor, arrayActions } from 'svelte-reactor';

const todos = createReactor({ items: [] });
const actions = arrayActions(todos, 'items', { idKey: 'id' });

// Simple CRUD - no manual update() needed!
actions.add({ id: '1', text: 'Buy milk', done: false, priority: 1 });
actions.update('1', { done: true });
actions.toggle('1', 'done');
actions.remove('1');

// NEW in v0.2.3: Sorting and bulk operations
actions.sort((a, b) => a.priority - b.priority); // Sort by priority
actions.bulkUpdate(['1', '2', '3'], { done: true }); // Update multiple
actions.bulkRemove(['1', '2']); // Remove multiple
actions.bulkRemove(item => item.done); // Remove by predicate

// Query operations
const item = actions.find('1');
const count = actions.count();
```

#### `asyncActions(reactor, actions, options?)`

Manage async operations with automatic loading and error states.

**→ [See Migration Guide](./MIGRATION.md#async-operations--loading-states)**

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
    if (!response.ok) throw new Error('Failed to fetch');
    return { users: await response.json() };
  },
  searchUsers: async (query: string) => {
    const response = await fetch(`/api/users?q=${query}`);
    return { users: await response.json() };
  }
}, {
  // NEW in v0.2.3: Retry with exponential backoff
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential' // 1s, 2s, 4s, 8s...
  },
  // NEW in v0.2.3: Debounce for search
  debounce: 300 // Wait 300ms before executing
});

// Automatic loading & error management!
await api.fetchUsers();
// Automatically retries 3 times on failure!

// Debounced search - only last call executes
api.searchUsers('j');
api.searchUsers('jo');
api.searchUsers('john'); // Only this one runs after 300ms

// Manual cancellation
const controller = api.fetchUsers();
controller.cancel(); // Cancel in-flight request
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

Log all state changes to console with advanced filtering.

```typescript
import { logger } from 'svelte-reactor/plugins';

const reactor = createReactor(initialState, {
  plugins: [
    logger({
      collapsed: true, // Collapse console groups

      // NEW in v0.2.3: Advanced filtering
      filter: (action, state, prevState) => {
        // Only log user actions
        return action?.startsWith('user:');
        // Or only log when count changes
        // return state.count !== prevState.count;
      },

      // NEW in v0.2.3: Performance tracking
      trackPerformance: true,  // Show execution time
      slowThreshold: 100,      // Warn if action takes > 100ms
      includeTimestamp: true,  // Add timestamp to logs
      maxDepth: 3,             // Limit object depth in console
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

### ✅ v0.1.0 - MVP (Released)
- ✅ Core reactor with Svelte 5 Runes
- ✅ Basic undo/redo functionality
- ✅ Plugin system (undoRedo, persist, logger)
- ✅ DevTools API with time-travel debugging
- ✅ State utilities (diff, clone, equality)
- ✅ TypeScript types
- ✅ 93 tests

### ✅ v0.2.0 - Production Ready (Released)
- ✅ **Full Svelte stores API** - `subscribe()` support, `$store` auto-subscription
- ✅ **Helper functions** - `simpleStore()`, `persistedStore()`, `persistedReactor()`
- ✅ **Array Actions Helper** - `arrayActions()` for CRUD operations
- ✅ **Enhanced persistence** - `pick`/`omit`, custom serialization, cross-tab sync
- ✅ **Security features** - Exclude sensitive data from persistence
- ✅ 149 tests (+56)

### ✅ v0.2.1 - Async & Helpers (Released)
- ✅ **Async Actions Helper** - `asyncActions()` for automatic loading/error states
- ✅ **Enhanced Migration Guide** - Array and async operation examples
- ✅ **Advanced testing** - 3 complexity tests for concurrent operations
- ✅ 172 tests (+23)

### ✅ v0.2.3 - Feature Enhancements (Current)
- ✅ **Selective Persistence** - `pick`/`omit` options for security
- ✅ **Array Enhancements** - `sort()`, `bulkUpdate()`, `bulkRemove()`
- ✅ **Async Retry & Cancellation** - Retry logic, debouncing, cancellation
- ✅ **Advanced Logger** - Filter by action/state, performance tracking
- ✅ **Critical Bug Fixes** - Unhandled rejection fixes
- ✅ 232 tests (+58)

### ✅ v0.2.2 - Bug Fixes & Stability (Released)
- ✅ **Memory Leak Fixes** - Proper cleanup of subscribers and middlewares
- ✅ **Performance Optimization** - Skip unnecessary updates
- ✅ **Enhanced Error Handling** - Better validation and error messages
- ✅ 181 tests (+9)

### 🔜 v0.3.0 - Advanced Features (Planned)
- 🔄 Computed/Derived State API
- 🔄 Selectors API with memoization
- 🔄 Multi-tab sync with BroadcastChannel
- 🔄 Image compression for persist plugin

### 🚀 v1.0.0 - Stable Release (Future)
- React/Vue adapters
- Redux DevTools extension
- Advanced performance optimizations
- Comprehensive ecosystem

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

- **232 tests** covering all features (+51 new in v0.2.3)
- Unit tests for core reactor, plugins, helpers, utilities, and DevTools
- Advanced complexity tests for edge cases and concurrent operations
- Integration tests for v0.2.3 features
- Performance benchmarks for all operations
- TypeScript type checking

Run tests with `pnpm test` or `pnpm test:watch` for development.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/P1kabu/svelte-reactor/blob/master/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details

## Credits

Built with love for the Svelte community.
