# @svelte-dev/persist

> Effortless state persistence for Svelte 5 Runes

[![npm version](https://img.shields.io/npm/v/@svelte-dev/persist.svg?style=flat)](https://www.npmjs.com/package/@svelte-dev/persist)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@svelte-dev/persist?style=flat)](https://bundlephobia.com/package/@svelte-dev/persist)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/svelte-dev/persist/workflows/CI/badge.svg)](https://github.com/svelte-dev/persist/actions)

A lightweight, type-safe library for persisting reactive state in Svelte 5 applications using the new Runes API.

## Features

- **Svelte 5 Runes** - Built specifically for `$state`, `$derived`, and `$effect`
- **Multi-storage** - localStorage, sessionStorage, IndexedDB, or custom adapters
- **Type-safe** - Full TypeScript support with excellent type inference
- **SSR-safe** - Works seamlessly with SvelteKit
- **Tiny** - < 4KB gzipped (including all features)
- **Tab sync** - Synchronize state across browser tabs
- **Compression** - Built-in compression for large data using Compression Streams API
- **Migrations** - Version and migrate your persisted data
- **Debouncing** - Control write frequency for performance
- **Zero dependencies** - No external runtime dependencies

## Installation

```bash
npm install @svelte-dev/persist
```

```bash
pnpm add @svelte-dev/persist
```

```bash
yarn add @svelte-dev/persist
```

## Quick Start

### Basic Counter

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  let count = persisted('counter', $state(0));
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

The counter value will automatically persist to localStorage and survive page refreshes.

### Todo List

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  let todos = persisted('todos', $state<Todo[]>([]));
  let input = $state('');

  function addTodo() {
    if (!input.trim()) return;
    todos = [
      ...todos,
      {
        id: crypto.randomUUID(),
        text: input,
        done: false,
      },
    ];
    input = '';
  }
</script>

<input bind:value={input} onkeydown={(e) => e.key === 'Enter' && addTodo()} />
<button onclick={addTodo}>Add</button>

<ul>
  {#each todos as todo}
    <li>
      <input
        type="checkbox"
        bind:checked={todo.done}
      />
      {todo.text}
    </li>
  {/each}
</ul>
```

## API Reference

### `persisted(key, initialValue, options?)`

Create a persisted reactive state.

**Parameters:**

- `key: string` - Unique storage key
- `initialValue: T` - Initial value (must use `$state()`)
- `options?: PersistedOptions<T>` - Optional configuration

**Options:**

```typescript
interface PersistedOptions<T> {
  // Storage backend (default: 'localStorage')
  storage?: 'localStorage' | 'sessionStorage' | 'memory' | 'indexedDB' | StorageAdapter;

  // Custom serializer (default: JSON)
  serializer?: {
    stringify: (value: T) => string;
    parse: (str: string) => T;
  };

  // Debounce writes in milliseconds (default: 0)
  debounce?: number;

  // Enable compression for large data (default: false)
  compress?: boolean;

  // Enable tab synchronization (default: false)
  sync?: boolean;

  // Handle SSR gracefully (default: true)
  ssr?: boolean;

  // Callback when storage quota is exceeded
  onQuotaExceeded?: (error: QuotaExceededError) => void;

  // Schema version for migrations
  version?: number;

  // Migration functions
  migrations?: Record<number, (data: any) => any>;
}
```

## Advanced Usage

### Custom Storage

```svelte
<script lang="ts">
  import { persisted, sessionStorageAdapter } from '@svelte-dev/persist';

  // Use sessionStorage instead of localStorage
  let sessionData = persisted('session-key', $state({}), {
    storage: 'sessionStorage',
  });
</script>
```

### Debounced Writes

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Only save after 500ms of no changes (great for forms)
  let formData = persisted('form', $state({ name: '', email: '' }), {
    debounce: 500,
  });
</script>
```

### Tab Synchronization

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Sync across tabs
  let sharedCounter = persisted('shared-counter', $state(0), {
    sync: true,
  });
</script>

<button onclick={() => sharedCounter++}>
  {sharedCounter}
</button>

<p>Open this page in multiple tabs - the counter syncs automatically!</p>
```

### Data Migrations

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  interface User {
    fullName: string; // v2: renamed from firstName
    age: number;      // v2: added
  }

  let user = persisted('user', $state<User>({ fullName: '', age: 0 }), {
    version: 2,
    migrations: {
      2: (oldData) => ({
        fullName: oldData.firstName || '',
        age: oldData.age || 0,
      }),
    },
  });
</script>
```

## Storage Adapters

### Built-in Adapters

- `localStorageAdapter` - Browser localStorage (default)
- `sessionStorageAdapter` - Browser sessionStorage
- `indexedDBAdapter` - IndexedDB for large data (async)
- `memoryStorageAdapter` - In-memory storage (SSR fallback)

### IndexedDB for Large Data

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Store large data in IndexedDB
  let photos = persisted('photos', $state([]), {
    storage: 'indexedDB',
  });

  // Or create a custom IndexedDB adapter
  import { createIndexedDBAdapter } from '@svelte-dev/persist';

  const myDB = createIndexedDBAdapter('myApp', 'photos');
  let images = persisted('images', $state([]), {
    storage: myDB,
  });
</script>
```

### Compression

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Automatically compress large data
  let largeDataset = persisted('dataset', $state([]), {
    compress: true,
  });
</script>
```

### Encryption

```svelte
<script lang="ts">
  import { persisted, createEncryptedAdapter, localStorageAdapter } from '@svelte-dev/persist';

  // Create encrypted storage adapter
  const encryptedStorage = createEncryptedAdapter(
    localStorageAdapter,
    'your-secret-password'
  );

  // Store sensitive data encrypted
  let sensitiveData = persisted('sensitive', $state({ token: '', apiKey: '' }), {
    storage: encryptedStorage,
  });
</script>
```

**Note:** Encryption uses the Web Crypto API with AES-GCM-256. Keep your password secure!

### Custom Adapter

```typescript
import { persisted, type StorageAdapter } from '@svelte-dev/persist';

const customAdapter: StorageAdapter = {
  name: 'custom',
  get: (key) => {
    // Your implementation
  },
  set: (key, value) => {
    // Your implementation
  },
  remove: (key) => {
    // Your implementation
  },
  clear: () => {
    // Your implementation
  },
};

let data = persisted('key', $state({}), {
  storage: customAdapter,
});
```

## SSR Support

The library automatically detects SSR environments (like SvelteKit) and falls back to memory storage. No configuration needed!

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Works perfectly in SvelteKit!
  let count = persisted('counter', $state(0));
</script>
```

## TypeScript

Full TypeScript support with excellent type inference:

```typescript
import { persisted } from '@svelte-dev/persist';

interface User {
  id: string;
  name: string;
  email: string;
}

// Type is automatically inferred as User | null
let user = persisted('user', $state<User | null>(null));
```

## Roadmap

### Phase 1: MVP (v0.1.0) ✅
- Basic `persisted` function with localStorage
- TypeScript types
- Svelte 5 Runes support
- Serialization (JSON)
- SSR detection
- Unit tests

### Phase 2: Core Features (v0.5.0) ✅
- IndexedDB adapter
- Compression support (Compression Streams API)
- Advanced tab synchronization
- Playground
- E2E tests (in progress)

### Phase 3: Production Ready (v1.0.0) ✅
- Encryption plugin (AES-GCM-256)
- Performance benchmarks
- CI/CD pipeline (GitHub Actions)
- Changesets for version management
- Full documentation site (in progress)
- Multiple examples

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

# Run playground
cd playground
pnpm install
pnpm dev

# Run benchmarks
cd benchmarks
pnpm install
pnpm bench
pnpm size
```

## Publishing

This library uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Creating a release

1. Create a changeset:
```bash
pnpm changeset
```

2. Version packages:
```bash
pnpm version
```

3. Publish to NPM:
```bash
pnpm release
```

Publishing is also automated via GitHub Actions when changesets are merged to main.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details

## Credits

Built with love for the Svelte community.
