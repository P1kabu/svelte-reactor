# 🚀 @svelte-dev/reactor - Детальний План Реалізації

> **Назва:** `@svelte-dev/reactor`
> **Слоган:** "Powerful reactive state management for Svelte 5"

---

## 📋 Огляд проекту

**@svelte-dev/reactor** - це потужний state manager для Svelte 5, який поєднує:
- ✅ Простоту Svelte Runes
- ✅ Потужність Redux/Zustand
- ✅ Undo/Redo engine
- ✅ Middleware system
- ✅ Persistence через @svelte-dev/persist
- ✅ DevTools API
- ✅ TypeScript-first

---

## 🏗️ Архітектура проекту

### Структура файлів:

```
packages/reactor/
├── src/
│   ├── core/
│   │   ├── reactor.svelte.ts          # Головна функція createReactor
│   │   └── state.ts                   # State utilities
│   │
│   ├── history/
│   │   ├── undo-redo.ts               # Undo/Redo engine
│   │   ├── history-stack.ts           # History stack management
│   │   └── batch.ts                   # Batch operations
│   │
│   ├── middleware/
│   │   ├── middleware.ts              # Middleware system
│   │   ├── logger.ts                  # Logger middleware
│   │   └── types.ts                   # Middleware types
│   │
│   ├── devtools/
│   │   ├── devtools.ts                # DevTools API
│   │   ├── time-travel.ts             # Time travel debugging
│   │   └── inspector.ts               # State inspector
│   │
│   ├── plugins/
│   │   ├── index.ts                   # Plugin exports
│   │   ├── persist-plugin.ts          # Persist integration
│   │   ├── undo-plugin.ts             # Undo/Redo plugin
│   │   ├── logger-plugin.ts           # Logger plugin
│   │   └── sync-plugin.ts             # Multi-tab sync plugin
│   │
│   ├── utils/
│   │   ├── clone.ts                   # Deep clone utility
│   │   └── diff.ts                    # State diff utility
│   │
│   ├── types/
│   │   └── index.ts                   # TypeScript types
│   │
│   └── index.ts                       # Public API
│
├── tests/
│   ├── setup.ts                       # Test setup
│   ├── reactor.test.ts                # Core tests
│   ├── undo-redo.test.ts              # Undo/Redo tests
│   ├── middleware.test.ts             # Middleware tests
│   └── plugins.test.ts                # Plugin tests
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## 🎯 Core API Design

### 1. Головна функція `createReactor`

```typescript
import { createReactor } from '@svelte-dev/reactor';
import { persist, undoRedo, logger } from '@svelte-dev/reactor/plugins';

// Простий використання
const counter = createReactor({ value: 0 });

// З плагінами
const todos = createReactor(
  { items: [] },
  {
    plugins: [
      persist({ key: 'todos' }),
      undoRedo({ limit: 50 }),
      logger(),
    ],
    name: 'TodoStore',
    devtools: true,
  }
);

// API методи
counter.update(state => { state.value++; });
counter.set({ value: 10 });
counter.undo();
counter.redo();
counter.batch(() => {
  counter.update(state => { state.value++; });
  counter.update(state => { state.value++; });
});
```

### 2. TypeScript Types

```typescript
// Reactor instance
interface Reactor<T extends object> {
  // State (reactive)
  state: T;

  // Actions
  update(updater: (state: T) => void): void;
  set(newState: Partial<T>): void;

  // Undo/Redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Batch
  batch(fn: () => void): void;

  // DevTools
  inspect(): ReactorInspection;

  // Cleanup
  destroy(): void;
}

// Options
interface ReactorOptions<T> {
  plugins?: ReactorPlugin<T>[];
  name?: string;
  devtools?: boolean;
}

// Plugin interface
interface ReactorPlugin<T> {
  name: string;
  init(context: PluginContext<T>): void;
  destroy?(): void;
}

// Plugin context
interface PluginContext<T> {
  state: T;
  history?: UndoRedoHistory<T>;
  middlewares: Middleware<T>[];
}

// Middleware
interface Middleware<T> {
  name: string;
  onBeforeUpdate?(prevState: T, nextState: T, action?: string): void;
  onAfterUpdate?(prevState: T, nextState: T, action?: string): void;
  onError?(error: Error): void;
}
```

---

## 🔄 Undo/Redo Engine

### Архітектура:

```typescript
class UndoRedoHistory<T> {
  private past: HistoryEntry<T>[] = [];
  private future: HistoryEntry<T>[] = [];
  private current: T;
  private limit: number;
  private batchMode = false;

  push(prevState: T, nextState: T, action?: string): void;
  undo(): T | null;
  redo(): T | null;
  canUndo(): boolean;
  canRedo(): boolean;
  startBatch(): void;
  endBatch(): void;
  clear(): void;
  getStack(): HistoryStack<T>;
}

interface HistoryEntry<T> {
  state: T;
  timestamp: number;
  action?: string;
}
```

### Функціонал:
- ✅ Push/Undo/Redo operations
- ✅ History limit (за замовчуванням 50)
- ✅ Batch operations (групування змін)
- ✅ Action labels для кращого debugging
- ✅ Timestamp для кожної зміни
- ✅ Clear history

---

## ⚙️ Middleware System

### Приклад Logger Middleware:

```typescript
export function logger<T>(options?: {
  collapsed?: boolean;
}): Middleware<T> {
  return {
    name: 'logger',
    onBeforeUpdate(prevState, nextState, action) {
      const groupMethod = options?.collapsed ? 'groupCollapsed' : 'group';
      console[groupMethod](
        `%c Reactor ${action || 'update'}`,
        'color: #10b981; font-weight: bold'
      );
      console.log('%c prev state', 'color: #9CA3AF', prevState);
      console.log('%c next state', 'color: #3B82F6', nextState);
      console.groupEnd();
    },
  };
}
```

### Приклад Custom Middleware:

```typescript
const analyticsMiddleware: Middleware<TodoState> = {
  name: 'analytics',
  onAfterUpdate(prevState, nextState, action) {
    // Відправити analytics event
    analytics.track('state_changed', {
      action,
      itemCount: nextState.items.length,
    });
  },
};
```

---

## 🔌 Plugin System

### 1. Persist Plugin

```typescript
import { persisted } from '@svelte-dev/persist';

export function persist<T>(options: {
  key: string;
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  debounce?: number;
}): ReactorPlugin<T> {
  let persistedState: any;

  return {
    name: 'persist',

    init(context) {
      // Створюємо persisted state
      persistedState = persisted(options.key, context.state, {
        storage: options.storage,
        debounce: options.debounce,
      });

      // Завантажуємо збережений state
      Object.assign(context.state, persistedState);

      // Підписуємось на зміни
      $effect(() => {
        const currentState = context.state;
        Object.assign(persistedState, currentState);
      });
    },

    destroy() {
      // Cleanup
    },
  };
}
```

### 2. Undo/Redo Plugin

```typescript
export function undoRedo<T>(options?: {
  limit?: number;
  exclude?: string[];
}): ReactorPlugin<T> {
  const { limit = 50, exclude = [] } = options ?? {};

  return {
    name: 'undo-redo',

    init(context) {
      context.history = new UndoRedoHistory(context.state, limit);
    },

    destroy() {
      // Cleanup
    },
  };
}
```

### 3. Logger Plugin

```typescript
export function logger<T>(options?: {
  collapsed?: boolean;
}): ReactorPlugin<T> {
  return {
    name: 'logger',

    init(context) {
      const loggerMiddleware = createLoggerMiddleware<T>(options);
      context.middlewares.push(loggerMiddleware);
    },
  };
}
```

---

## 🛠 DevTools API

```typescript
interface ReactorDevTools<T> {
  name: string;
  history: HistoryEntry<T>[];

  // Time travel
  timeTravel(index: number): void;

  // Export/Import
  exportState(): string;
  importState(data: string): void;

  // Inspection
  inspect(): ReactorInspection<T>;
}

interface ReactorInspection<T> {
  name: string;
  state: T;
  history: {
    past: HistoryEntry<T>[];
    future: HistoryEntry<T>[];
    current: T;
  };
  middlewares: string[];
  plugins: string[];
}
```

---

## 📊 Implementation Roadmap

### ✅ Phase 1: MVP Foundation (Тиждень 1-2)

#### Sprint 1.1: Project Setup ✅ COMPLETED
- [x] Створити packages/reactor/ структуру
- [x] package.json з залежностями
- [x] tsconfig.json
- [x] vite.config.ts
- [x] vitest.config.ts
- [x] README.md
- [x] tests/setup.ts

#### Sprint 1.2: Core State Management ✅ COMPLETED
- [x] TypeScript types (src/types/index.ts)
- [x] Core reactor (src/core/reactor.svelte.ts)
- [x] Basic update/set methods
- [x] Reactive state з $state
- [x] Unit tests для core

#### Sprint 1.3: Basic Undo/Redo ✅ COMPLETED
- [x] UndoRedoHistory class
- [x] undo() та redo() методи
- [x] canUndo() та canRedo()
- [x] History limit
- [x] Unit tests для undo/redo

#### Sprint 1.4: Plugin System Foundation ✅ COMPLETED
- [x] ReactorPlugin interface
- [x] Plugin lifecycle (init, destroy)
- [x] Plugin context
- [x] Basic logger plugin
- [x] Tests для plugins

---

### 🔄 Phase 2: Advanced Features (Тиждень 3-4)

#### Sprint 2.1: Advanced Undo/Redo ✅ COMPLETED
- [x] Batch operations (startBatch/endBatch)
- [x] Action names/labels
- [x] History filtering (exclude actions)
- [x] History compression
- [x] Group by action name
- [x] Advanced tests (tests/advanced-undo.test.ts)

**New Features:**
- `exclude`: Skip certain actions from history
- `compress`: Merge identical consecutive states
- `groupByAction`: Group consecutive actions with same name
- Enhanced constructor with options

#### Sprint 2.2: Middleware System ✅ COMPLETED
- [x] Middleware interface
- [x] Middleware chain
- [x] onBeforeUpdate/onAfterUpdate hooks
- [x] Logger middleware з devtools
- [x] Error handling middleware
- [x] Tests

#### Sprint 2.3: Persist Integration
- [ ] Persist plugin
- [ ] Auto-save on state change
- [ ] Debounce для persistence
- [ ] Support всі storage types
- [ ] Tests

#### Sprint 2.4: Utilities
- [ ] Deep clone utility
- [ ] State diff utility
- [ ] Selectors API (можливо v2)
- [ ] Tests

---

### 🚀 Phase 3: DevTools & Polish (Тиждень 5-6)

#### Sprint 3.1: DevTools API
- [ ] ReactorDevTools class
- [ ] State inspector
- [ ] Time travel
- [ ] Export/Import state
- [ ] Tests

#### Sprint 3.2: Multi-tab Sync (Optional v1.0)
- [ ] Sync plugin з BroadcastChannel
- [ ] Fallback на StorageEvent
- [ ] Sync state між tabs
- [ ] Tests

#### Sprint 3.3: Performance
- [ ] Shallow comparison для updates
- [ ] History serialization optimization
- [ ] Bundle size optimization
- [ ] Benchmarks

#### Sprint 3.4: Documentation
- [ ] API reference
- [ ] Examples (counter, todo, forms)
- [ ] Migration guide
- [ ] TypeScript examples
- [ ] Playground demos

---

## 🎨 Приклади використання

### 1. Simple Counter

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo } from '@svelte-dev/reactor/plugins';

  const counter = createReactor(
    { value: 0 },
    { plugins: [undoRedo()] }
  );
</script>

<button onclick={() => counter.update(s => { s.value++; })}>
  {counter.state.value}
</button>
<button onclick={() => counter.undo()} disabled={!counter.canUndo()}>
  Undo
</button>
```

### 2. Todo App

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo, logger } from '@svelte-dev/reactor/plugins';

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
        logger({ collapsed: true }),
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

  function toggleTodo(id: string) {
    todos.update(state => {
      const todo = state.items.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    });
  }

  function clearCompleted() {
    todos.batch(() => {
      todos.update(state => {
        state.items = state.items.filter(t => !t.done);
      });
    });
  }
</script>

<input bind:value={input} onkeydown={e => e.key === 'Enter' && addTodo(input)} />

{#each todos.state.items as todo}
  <div>
    <input
      type="checkbox"
      checked={todo.done}
      onchange={() => toggleTodo(todo.id)}
    />
    {todo.text}
  </div>
{/each}

<button onclick={clearCompleted}>Clear Completed</button>
<button onclick={() => todos.undo()} disabled={!todos.canUndo()}>Undo</button>
<button onclick={() => todos.redo()} disabled={!todos.canRedo()}>Redo</button>
```

### 3. Form with Auto-save

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo } from '@svelte-dev/reactor/plugins';

  interface FormData {
    name: string;
    email: string;
    message: string;
  }

  const form = createReactor<{ data: FormData }>(
    {
      data: { name: '', email: '', message: '' },
    },
    {
      plugins: [
        persist({ key: 'contact-form', debounce: 1000 }),
        undoRedo({ limit: 20 }),
      ],
    }
  );

  function submitForm() {
    console.log('Submitting:', form.state.data);
    form.set({ data: { name: '', email: '', message: '' } });
  }
</script>

<form onsubmit|preventDefault={submitForm}>
  <input bind:value={form.state.data.name} placeholder="Name" />
  <input bind:value={form.state.data.email} type="email" placeholder="Email" />
  <textarea bind:value={form.state.data.message} placeholder="Message" />
  <button type="submit">Send</button>
</form>

<p class="autosave">✓ Auto-saved</p>
```

---

## 🧪 Testing Strategy

### Unit Tests:
- ✅ Core reactor functionality
- ✅ Undo/Redo operations
- ✅ Plugin system
- ✅ Middleware chain
- ✅ DevTools API

### Integration Tests:
- ✅ Persist integration
- ✅ Multi-tab sync
- ✅ Batch operations

### E2E Tests:
- ✅ Todo app example
- ✅ Form with auto-save
- ✅ Multi-tab synchronization

### Target Coverage: > 90%

---

## 📦 Bundle Size Goals

- **Core:** < 3KB gzipped
- **Core + Undo/Redo:** < 4KB gzipped
- **Core + All Plugins:** < 5KB gzipped
- **Tree-shakeable:** Так

---

## 🎯 Success Metrics

### Technical KPIs:
- Bundle size: < 5KB gzipped ✅
- Test coverage: > 90% ✅
- Performance: < 1ms для updates ✅
- TypeScript: 100% typed ✅

### Community KPIs (3 місяці):
- NPM downloads: > 5,000/month
- GitHub stars: > 300
- Contributors: > 3
- Issues resolved: > 90%

---

## 🔗 Integration з Ecosystem

### @svelte-dev/persist
- Seamless persistence через persist plugin
- Підтримка всіх storage types
- Debounce та compression

### Future integrations:
- Redux DevTools
- Zod validation
- React Query-like data fetching
- Form libraries (Superforms)

---

## 📝 Next Steps (Зараз)

### Поточний спринт: **Sprint 1.2 - Core State Management**

Створити:
1. **src/types/index.ts** - TypeScript types
2. **src/core/reactor.svelte.ts** - Core reactor implementation
3. **src/history/undo-redo.ts** - Undo/Redo engine
4. **src/plugins/index.ts** - Plugin system
5. **src/index.ts** - Public API
6. **tests/reactor.test.ts** - Core tests

---

## 🚀 Готовий до роботи!

Структура проекту створена ✅
План деталізований ✅
Готовий до імплементації ✅

**Продовжуємо з Phase 1.2: Core State Management!**
