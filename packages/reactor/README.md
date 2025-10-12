# @svelte-dev/reactor

> Powerful reactive state management for Svelte 5

[![npm version](https://img.shields.io/npm/v/@svelte-dev/reactor.svg?style=flat)](https://www.npmjs.com/package/@svelte-dev/reactor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@svelte-dev/reactor?style=flat)](https://bundlephobia.com/package/@svelte-dev/reactor)
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
- **Tiny** - < 5KB gzipped (core features)
- **Zero dependencies** - Except Svelte 5

## Installation

```bash
npm install @svelte-dev/reactor
```

```bash
pnpm add @svelte-dev/reactor
```

```bash
yarn add @svelte-dev/reactor
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
  update(updater: (state: T) => void): void;
  set(newState: T): void;

  // Undo/Redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

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
      limit: 50,           // History limit (default: 50)
      exclude: ['action'], // Actions to exclude from history
    }),
  ],
});
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

## Middleware

Create custom middleware for advanced use cases:

```typescript
import { createMiddleware } from '@svelte-dev/reactor';

const myMiddleware = createMiddleware({
  name: 'my-middleware',
  onBeforeUpdate(prevState, nextState, action) {
    console.log('Before update:', prevState, '->', nextState);
  },
  onAfterUpdate(prevState, nextState, action) {
    console.log('After update:', prevState, '->', nextState);
  },
  onError(error) {
    console.error('Error:', error);
  },
});
```

## Roadmap

### Phase 1: MVP (v0.1.0) - In Progress
- Core reactor with Svelte 5 Runes
- Basic undo/redo
- Plugin system
- TypeScript types

### Phase 2: Core Features (v0.5.0)
- Advanced undo/redo with batch operations
- Middleware system
- Persist integration
- Selectors and computed values

### Phase 3: Advanced (v1.0.0)
- DevTools API
- Multi-tab sync
- Time-travel debugging
- Performance optimizations

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Type check
pnpm typecheck
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Credits

Built with love for the Svelte community.
