# Upgrade Guide: v0.3.0

**Target Release:** Q1 2025
**Codename:** "Monorepo & RuneDB"
**Status:** Planning

---

## Overview

v0.3.0 is a major architectural change:

1. **Monorepo Migration** - Split into scoped packages `@svelte-reactor/*`
2. **RuneDB** - New reactive IndexedDB wrapper (`@svelte-reactor/db`)
3. **100% Backward Compatible** - Existing code continues to work

---

## Package Structure

```
@svelte-reactor/
├── core                 # State management (all-in-one, tree-shakeable)
├── db                   # RuneDB - Reactive IndexedDB
└── (shared)             # Internal utilities (not published separately)
```

### Final Decision: Варіант B

**Один пакет `@svelte-reactor/core` з хорошим tree-shaking.**

Користувач імпортує тільки те що потрібно - bundler видаляє решту:

```typescript
// Імпортуємо тільки persist
import { createReactor } from '@svelte-reactor/core';
import { persist } from '@svelte-reactor/core/plugins';

// Bundler автоматично видалить: undo, logger, arrayActions, asyncActions, etc.
// Фінальний bundle: ~6 KB замість 12 KB
```

### Package Details

| Package | Description | Size Target |
|---------|-------------|-------------|
| `@svelte-reactor/core` | State management, plugins, helpers (tree-shakeable) | < 12 KB full / ~4-6 KB typical |
| `@svelte-reactor/db` | Reactive IndexedDB collections | < 8 KB |
| `svelte-reactor` | Compatibility alias → @svelte-reactor/core | ~0 KB (re-export) |

---

## Phase 1: Monorepo Setup

### 1.1 Directory Structure

```
svelte-dev.reactor/
├── packages/
│   ├── core/                    # @svelte-reactor/core (rename from reactor)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── core/
│   │   │   │   └── reactor.svelte.ts
│   │   │   ├── helpers/
│   │   │   ├── plugins/
│   │   │   ├── storage/
│   │   │   ├── devtools/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── tests/               # 505+ existing tests
│   │   ├── templates/           # AI templates
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── API.md
│   │   └── CHANGELOG.md
│   │
│   ├── db/                      # @svelte-reactor/db (RuneDB) - NEW
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── core/
│   │   │   │   ├── database.ts
│   │   │   │   ├── collection.svelte.ts
│   │   │   │   └── record.svelte.ts
│   │   │   ├── idb/
│   │   │   │   ├── connection.ts
│   │   │   │   ├── operations.ts
│   │   │   │   └── migrations.ts
│   │   │   ├── sync/
│   │   │   │   └── broadcast.ts
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── tests/               # 110+ new tests
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── reactor/                 # svelte-reactor (compatibility alias)
│   │   ├── src/
│   │   │   └── index.ts         # Re-exports from @svelte-reactor/core
│   │   └── package.json
│   │
│   └── create-reactor/          # CLI (existing)
│       └── ...
│
├── examples/
│   ├── reactor-demos/           # Existing demos
│   └── db-demo/                 # RuneDB demo - NEW
│
├── UPGRADES/                    # Upgrade guides
├── .claude/                     # AI context
├── pnpm-workspace.yaml
├── package.json                 # Root workspace config
└── tsconfig.base.json           # Shared TS config
```

### 1.2 Root Configuration Files

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

**Root package.json:**
```json
{
  "name": "svelte-reactor-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "publish:all": "pnpm -r publish --access public"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^3.0.0"
  }
}
```

### 1.3 Migration Tasks

- [ ] Register `@svelte-reactor` npm organization
- [ ] Create `pnpm-workspace.yaml`
- [ ] Update root `package.json` for workspaces
- [ ] Rename `packages/reactor` → `packages/core`
- [ ] Update package.json name to `@svelte-reactor/core`
- [ ] Create `packages/reactor` as compatibility wrapper
- [ ] Create `packages/db` scaffold
- [ ] Update all internal imports
- [ ] Update CI/CD workflows (GitHub Actions)
- [ ] Run all 505 tests - must pass
- [ ] Test publish to npm (dry-run)

---

## Phase 2: @svelte-reactor/core

### 2.1 Package Rename

**Old (v0.2.x):**
```typescript
import { createReactor } from 'svelte-reactor';
import { undoRedo, persist } from 'svelte-reactor/plugins';
```

**New (v0.3.0):**
```typescript
import { createReactor } from '@svelte-reactor/core';
import { undoRedo, persist } from '@svelte-reactor/core/plugins';
```

### 2.2 Backward Compatibility

Publish `svelte-reactor` as a wrapper that re-exports from `@svelte-reactor/core`:

**packages/reactor-compat/package.json:**
```json
{
  "name": "svelte-reactor",
  "version": "0.3.0",
  "description": "Alias for @svelte-reactor/core",
  "dependencies": {
    "@svelte-reactor/core": "^0.3.0"
  }
}
```

**packages/reactor-compat/src/index.ts:**
```typescript
// Re-export everything from @svelte-reactor/core
export * from '@svelte-reactor/core';
```

### 2.3 Package.json (@svelte-reactor/core)

```json
{
  "name": "@svelte-reactor/core",
  "version": "0.3.0",
  "description": "Reactive state management for Svelte 5 with plugins",
  "type": "module",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./plugins": {
      "types": "./dist/plugins/index.d.ts",
      "svelte": "./dist/plugins/index.js",
      "default": "./dist/plugins/index.js"
    },
    "./helpers": {
      "types": "./dist/helpers/index.d.ts",
      "svelte": "./dist/helpers/index.js",
      "default": "./dist/helpers/index.js"
    },
    "./devtools": {
      "types": "./dist/devtools/index.d.ts",
      "svelte": "./dist/devtools/index.js",
      "default": "./dist/devtools/index.js"
    },
    "./utils/*": {
      "types": "./dist/utils/*.d.ts",
      "default": "./dist/utils/*.js"
    }
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  },
  "keywords": [
    "svelte",
    "svelte5",
    "state-management",
    "reactive",
    "runes",
    "undo-redo",
    "persistence"
  ]
}
```

### 2.4 Core Changes (Minimal)

v0.3.0 core has **minimal changes** - focus is on monorepo + RuneDB:

- [ ] Rename package to `@svelte-reactor/core`
- [ ] Update internal imports
- [ ] Export shared utilities for `@svelte-reactor/db`
- [ ] Add integration hooks for RuneDB (optional)
- [ ] All 505+ tests must pass

---

## Phase 3: @svelte-reactor/db (RuneDB)

### 3.1 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Zero Config** | Works out of box, schema optional |
| **Svelte 5 Native** | Uses $state, $derived, feels like Svelte |
| **Plain Objects** | No ORM classes, just TypeScript interfaces |
| **Proxy Magic** | `record.title = 'New'` auto-saves |
| **Optimistic UI** | Changes reflect immediately |

### 3.2 Core API

```typescript
// ============================================
// @svelte-reactor/db - Public API
// ============================================

// 1. Create Database
function createDB(name: string, options?: DBOptions): Database;

interface DBOptions {
  version?: number;
  onUpgrade?: (db: IDBDatabase, oldVersion: number) => void;
}

// 2. Database Instance
interface Database {
  name: string;
  ready: boolean;              // $state - true when IDB connected
  error: Error | null;         // $state - connection error if any

  // Get or create collection
  collection<T>(name: string, options?: CollectionOptions): Collection<T>;

  // Database operations
  close(): void;
  delete(): Promise<void>;
  export(): Promise<Record<string, any[]>>;
  import(data: Record<string, any[]>): Promise<void>;
}

interface CollectionOptions {
  keyPath?: string;            // Default: 'id'
  autoIncrement?: boolean;     // Default: true
  indexes?: string[];          // Fields to index
}

// 3. Collection
interface Collection<T> {
  name: string;

  // Create
  add(item: Omit<T, 'id'>): Promise<Record<T>>;
  addMany(items: Omit<T, 'id'>[]): Promise<Record<T>[]>;

  // Read (reactive)
  get(id: number | string): Record<T>;           // Returns reactive record
  all(): RecordCollection<T>;                    // Returns reactive collection
  where(field: keyof T, value: any): RecordCollection<T>;

  // Update
  update(id: number | string, changes: Partial<T>): Promise<void>;

  // Delete
  delete(id: number | string): Promise<void>;
  deleteMany(ids: (number | string)[]): Promise<void>;
  clear(): Promise<void>;

  // Utilities
  count(): number;             // $derived
}

// 4. Reactive Record (single item)
interface Record<T> {
  // Data fields accessible directly via Proxy
  [K in keyof T]: T[K];        // e.g., record.title, record.done

  // Meta state
  $id: number | string;        // Record ID
  $loading: boolean;           // $state - loading from IDB
  $saving: boolean;            // $state - saving to IDB
  $error: Error | null;        // $state - last error
  $dirty: boolean;             // $state - has unsaved changes
  $exists: boolean;            // $derived - record exists in DB

  // Methods
  $save(): Promise<void>;      // Force immediate save
  $reload(): Promise<void>;    // Reload from IDB
  $delete(): Promise<void>;    // Delete record
  $toJSON(): T;                // Get plain object
}

// 5. Reactive Collection (multiple items)
interface RecordCollection<T> {
  items: Record<T>[];          // $state - array of reactive records

  // Meta state
  loading: boolean;            // $state
  error: Error | null;         // $state

  // Computed
  count: number;               // $derived
  isEmpty: boolean;            // $derived
  first: Record<T> | null;     // $derived
  last: Record<T> | null;      // $derived

  // Query modifiers (chainable, return new collection)
  orderBy(field: keyof T, dir?: 'asc' | 'desc'): RecordCollection<T>;
  limit(n: number): RecordCollection<T>;
  offset(n: number): RecordCollection<T>;

  // Methods
  reload(): Promise<void>;
  toArray(): T[];              // Get plain objects array
}
```

### 3.3 Usage Examples

**Basic CRUD:**
```typescript
import { createDB } from '@svelte-reactor/db';

interface Todo {
  id?: number;
  text: string;
  done: boolean;
  createdAt: Date;
}

// Create database
const db = createDB('my-app');

// Get collection (auto-created if doesn't exist)
const todos = db.collection<Todo>('todos');

// Create
const newTodo = await todos.add({
  text: 'Buy milk',
  done: false,
  createdAt: new Date()
});
console.log(newTodo.$id); // 1

// Read (reactive)
const todo = todos.get(1);
console.log(todo.text); // 'Buy milk'

// Update (auto-saves!)
todo.text = 'Buy oat milk';
todo.done = true;
// Changes debounced and saved to IndexedDB automatically

// Delete
await todo.$delete();
```

**In Svelte Component:**
```svelte
<script lang="ts">
  import { createDB } from '@svelte-reactor/db';

  interface Todo {
    id?: number;
    text: string;
    done: boolean;
  }

  const db = createDB('todo-app');
  const todos = db.collection<Todo>('todos');

  // Reactive collection - auto-updates when data changes
  const allTodos = todos.all();

  let newText = $state('');

  async function addTodo() {
    if (!newText.trim()) return;
    await todos.add({ text: newText, done: false });
    newText = '';
  }
</script>

<input bind:value={newText} onkeydown={e => e.key === 'Enter' && addTodo()} />
<button onclick={addTodo}>Add</button>

{#if allTodos.loading}
  <p>Loading...</p>
{:else if allTodos.isEmpty}
  <p>No todos yet!</p>
{:else}
  {#each allTodos.items as todo}
    <div class="todo" class:done={todo.done}>
      <input type="checkbox" bind:checked={todo.done} />
      <input bind:value={todo.text} />
      {#if todo.$saving}
        <span class="saving">Saving...</span>
      {/if}
      <button onclick={() => todo.$delete()}>Delete</button>
    </div>
  {/each}
{/if}

<style>
  .done { opacity: 0.5; text-decoration: line-through; }
  .saving { color: orange; font-size: 0.8em; }
</style>
```

**With Indexes and Queries:**
```typescript
const db = createDB('app');

// Define indexes for faster queries
const todos = db.collection<Todo>('todos', {
  indexes: ['done', 'createdAt']
});

// Query by index
const activeTodos = todos.where('done', false);
const completedTodos = todos.where('done', true);

// Chain modifiers
const recentActive = todos
  .where('done', false)
  .orderBy('createdAt', 'desc')
  .limit(10);
```

**Cross-Tab Sync (Built-in):**
```typescript
const db = createDB('app');
const todos = db.collection<Todo>('todos');

// Changes automatically sync across browser tabs!
// Tab 1: todos.add({ text: 'New', done: false });
// Tab 2: allTodos.items automatically updates
```

### 3.4 Internal Architecture

```
@svelte-reactor/db/src/
├── index.ts                 # Public exports
│
├── core/
│   ├── database.ts          # createDB, Database class
│   ├── collection.svelte.ts # Collection class with $state
│   └── record.svelte.ts     # Record proxy with auto-save
│
├── idb/
│   ├── connection.ts        # IndexedDB connection pool
│   ├── operations.ts        # CRUD operations (add, get, put, delete)
│   ├── cursor.ts            # Cursor iteration for queries
│   └── migrations.ts        # Schema versioning
│
├── sync/
│   └── broadcast.ts         # BroadcastChannel for cross-tab sync
│
├── utils/
│   ├── debounce.ts          # Debounced auto-save
│   ├── proxy.ts             # Reactive proxy creation
│   └── cache.ts             # In-memory cache management
│
└── types/
    └── index.ts             # All TypeScript types
```

### 3.5 Record Proxy Implementation

```typescript
// Simplified concept of how Record proxy works

function createRecordProxy<T>(
  data: T,
  collection: Collection<T>,
  id: number | string
): Record<T> {
  // Internal reactive state
  let _data = $state(data);
  let _saving = $state(false);
  let _dirty = $state(false);
  let _error = $state<Error | null>(null);

  // Debounced save
  const debouncedSave = debounce(async () => {
    _saving = true;
    try {
      await collection._update(id, _data);
      _dirty = false;
      _error = null;
    } catch (e) {
      _error = e;
    } finally {
      _saving = false;
    }
  }, 300);

  // Create proxy for data access
  return new Proxy({} as Record<T>, {
    get(_, prop: string) {
      // Meta properties
      if (prop === '$id') return id;
      if (prop === '$saving') return _saving;
      if (prop === '$dirty') return _dirty;
      if (prop === '$error') return _error;
      if (prop === '$exists') return true;
      if (prop === '$loading') return false;

      // Methods
      if (prop === '$save') return () => debouncedSave.flush();
      if (prop === '$reload') return () => collection._reload(id);
      if (prop === '$delete') return () => collection.delete(id);
      if (prop === '$toJSON') return () => ({ ..._data });

      // Data fields
      return _data[prop as keyof T];
    },

    set(_, prop: string, value) {
      if (prop.startsWith('$')) return false; // Can't set meta

      _data[prop as keyof T] = value;
      _dirty = true;
      debouncedSave();
      return true;
    }
  });
}
```

### 3.6 Package.json (@svelte-reactor/db)

```json
{
  "name": "@svelte-reactor/db",
  "version": "0.1.0",
  "description": "Reactive IndexedDB for Svelte 5 - bind:value that auto-saves",
  "type": "module",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  },
  "keywords": [
    "svelte",
    "svelte5",
    "indexeddb",
    "database",
    "reactive",
    "runes",
    "offline",
    "persistence"
  ]
}
```

### 3.7 Test Plan

| Category | Tests | Description |
|----------|-------|-------------|
| Database | 15 | createDB, close, delete, export/import |
| Collection CRUD | 25 | add, get, update, delete, clear |
| Reactive Record | 20 | proxy, auto-save, meta states |
| Reactive Collection | 20 | all, where, orderBy, limit |
| Cross-Tab Sync | 15 | BroadcastChannel, conflict resolution |
| Edge Cases | 15 | errors, large data, concurrent ops |
| **Total** | **110+** | |

---

## Phase 4: Integration (Optional)

### 4.1 Using @svelte-reactor/core with @svelte-reactor/db

```typescript
import { createReactor } from '@svelte-reactor/core';
import { createDB } from '@svelte-reactor/db';

// UI state in reactor
const ui = createReactor({
  selectedTodoId: null as number | null,
  filter: 'all' as 'all' | 'active' | 'done'
});

// Persistent data in RuneDB
const db = createDB('app');
const todos = db.collection<Todo>('todos');

// Combined usage
const selectedTodo = $derived(
  ui.state.selectedTodoId
    ? todos.get(ui.state.selectedTodoId)
    : null
);
```

### 4.2 Future: Deep Integration

```typescript
// FUTURE: Reactor + RuneDB integration plugin
import { createReactor } from '@svelte-reactor/core';
import { withDB } from '@svelte-reactor/db/integration';

const store = createReactor({
  user: null,
  settings: { theme: 'dark' }
}, {
  plugins: [
    withDB({
      db: 'my-app',
      collections: {
        user: 'users',      // Sync user to users collection
        settings: 'config'  // Sync settings to config collection
      }
    })
  ]
});
```

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Monorepo** | 1 week | Setup, migrate, CI/CD |
| **Phase 2: Core** | 1 week | Rename, test, publish |
| **Phase 3: RuneDB** | 3-4 weeks | Implement, test, document |
| **Phase 4: Integration** | 1 week | Optional features, polish |
| **Total** | **6-7 weeks** | |

---

## Migration Guide for Users

### From svelte-reactor v0.2.x

**Option 1: No changes needed**
```typescript
// This still works! svelte-reactor re-exports @svelte-reactor/core
import { createReactor } from 'svelte-reactor';
```

**Option 2: Update to scoped package**
```typescript
// Recommended for new projects
import { createReactor } from '@svelte-reactor/core';
```

### Adding RuneDB

```bash
# Install
npm install @svelte-reactor/db
```

```typescript
import { createDB } from '@svelte-reactor/db';

const db = createDB('my-app');
const todos = db.collection('todos');
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| @svelte-reactor/core tests | 505+ (maintain) |
| @svelte-reactor/db tests | 110+ |
| Core bundle size | < 12 KB |
| DB bundle size | < 8 KB |
| Documentation | Complete API docs |
| Examples | 2+ demo apps |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| npm org `@svelte-reactor` taken | Check availability, register early |
| Breaking changes | Maintain `svelte-reactor` as alias |
| RuneDB complexity | Start minimal MVP, iterate |
| IndexedDB edge cases | Extensive testing, fake-indexeddb |

---

## Checklist

### Phase 1: Monorepo Setup
- [ ] Register `@svelte-reactor` npm organization
- [ ] Create directory structure
- [ ] Setup pnpm workspaces
- [ ] Migrate `packages/reactor` → `packages/core`
- [ ] Create `packages/shared`
- [ ] Update CI/CD (GitHub Actions)
- [ ] Test all existing functionality

### Phase 2: @svelte-reactor/core
- [ ] Rename package
- [ ] Update exports
- [ ] Create compatibility package (`svelte-reactor`)
- [ ] Update all documentation
- [ ] Publish to npm

### Phase 3: @svelte-reactor/db
- [ ] Create package scaffold
- [ ] Implement `createDB`
- [ ] Implement `Collection`
- [ ] Implement `Record` proxy
- [ ] Implement `RecordCollection`
- [ ] Add IndexedDB operations
- [ ] Add cross-tab sync
- [ ] Write 110+ tests
- [ ] Write documentation
- [ ] Create demo app
- [ ] Publish to npm

### Phase 4: Polish
- [ ] Integration examples
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Final documentation review

---

**Created:** 2025-01-07
**Status:** Planning
