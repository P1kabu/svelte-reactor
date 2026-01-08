# Future Ideas

**Статус:** Ідеї для майбутніх версій (після v0.3.0)

**Опис:** Це backlog ідей які можемо реалізувати в майбутньому. Пріоритети можуть змінюватись.

---

## Priority Matrix

| Feature | Priority | Complexity | Impact | Target |
|---------|----------|------------|--------|--------|
| Form Helper | P0 | Medium | High | v0.3.0 |
| Query Helper | P1 | Medium | High | v0.4.0 |
| DevTools Extension | P2 | High | Very High | v0.5.0 |
| Time Travel UI | P3 | Medium | Medium | v0.6.0+ |

---

## v0.4.0 - Query Helper

### Опис

TanStack Query альтернатива для Svelte 5. Декларативний data fetching з кешуванням.

### API Design

```typescript
import { createQuery, createMutation } from '@svelte-reactor/core/helpers';

// Basic query
const users = createQuery({
  key: 'users',
  fetcher: () => fetch('/api/users').then(r => r.json()),
  staleTime: 60_000,      // 1 хвилина
  cacheTime: 5 * 60_000,  // 5 хвилин
  retry: 3,
  retryDelay: 1000
});

// Query with parameters
const user = createQuery({
  key: ['user', userId],
  fetcher: (id) => fetch(`/api/users/${id}`).then(r => r.json()),
  enabled: () => !!userId  // Conditional fetching
});

// Dependent queries
const posts = createQuery({
  key: ['posts', userId],
  fetcher: () => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
  enabled: () => user.data !== null
});
```

### Usage in Svelte

```svelte
<script lang="ts">
  import { createQuery } from '@svelte-reactor/core/helpers';

  const users = createQuery({
    key: 'users',
    fetcher: () => fetch('/api/users').then(r => r.json())
  });
</script>

{#if users.loading}
  <p>Loading...</p>
{:else if users.error}
  <p>Error: {users.error.message}</p>
  <button onclick={() => users.refetch()}>Retry</button>
{:else}
  {#each users.data as user}
    <div>{user.name}</div>
  {/each}
{/if}

<button onclick={() => users.invalidate()}>Refresh</button>
```

### Mutations

```typescript
const addUser = createMutation({
  mutationFn: (user) => fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user)
  }),
  onSuccess: () => {
    users.invalidate();  // Refetch users list
  },
  onError: (error) => {
    console.error('Failed to add user:', error);
  },
  // Optimistic updates
  onMutate: (newUser) => {
    const previous = users.data;
    users.setData([...users.data, { ...newUser, id: 'temp' }]);
    return { previous };
  },
  onError: (error, variables, context) => {
    users.setData(context.previous);  // Rollback
  }
});

// Usage
await addUser.mutate({ name: 'John', email: 'john@example.com' });
```

### Query State

```typescript
interface QueryState<T> {
  // Data
  data: T | null;
  error: Error | null;

  // Status
  loading: boolean;
  fetching: boolean;      // Background refetch
  stale: boolean;

  // Timestamps
  dataUpdatedAt: number | null;
  errorUpdatedAt: number | null;

  // Methods
  refetch(): Promise<T>;
  invalidate(): void;
  setData(data: T | ((prev: T) => T)): void;
  reset(): void;
}
```

### Persistence (Optional)

```typescript
const users = createQuery({
  key: 'users',
  fetcher: fetchUsers,
  persist: {
    storage: 'indexedDB',  // or 'localStorage'
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
});

// Data survives page reload!
```

### Test Plan

| Category | Tests |
|----------|-------|
| Basic fetching | 15 |
| Caching | 15 |
| Mutations | 15 |
| Optimistic updates | 10 |
| Persistence | 10 |
| Error handling | 10 |
| **Total** | **75+** |

---

## v0.5.0 - DevTools Extension

### Опис

Браузерний extension для Chrome/Firefox з візуальним дебагом стейту.

### Features

| Feature | Description |
|---------|-------------|
| State Explorer | Visual tree of current state |
| Action History | Log of all updates with diffs |
| Time Travel | Jump to any point in history |
| Performance | Timing for each action |
| Export/Import | Save and load state snapshots |

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Svelte Reactor DevTools                           [⚙️]  │
├─────────────────────────────────────────────────────────┤
│ Stores: [main ▼] [user ▼] [cart ▼]                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  State                          │  Actions              │
│  ─────                          │  ───────              │
│  ▼ user                         │  12:45:01 updateUser  │
│    ├─ name: "John"              │  12:45:03 addToCart   │
│    ├─ email: "john@ex.com"      │  12:45:05 checkout    │
│    └─ role: "admin"             │  12:45:08 clearCart ◀ │
│  ▼ cart                         │                       │
│    ├─ items: [3 items]          │                       │
│    └─ total: 150.00             │                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Timeline [◀◀] [◀] [▶] [▶▶]  ════════●══════  4/8       │
└─────────────────────────────────────────────────────────┘
```

### Integration API

```typescript
import { createReactor } from '@svelte-reactor/core';

const store = createReactor(initialState, {
  name: 'main',           // Shows in DevTools
  devtools: true,         // Enable DevTools connection
  // or
  devtools: {
    name: 'My App Store',
    trace: true,          // Include stack traces
    maxAge: 50            // Keep last 50 actions
  }
});
```

### Extension Architecture

```
svelte-reactor-devtools/
├── extension/
│   ├── manifest.json       # Chrome/Firefox manifest
│   ├── background.js       # Service worker
│   ├── content-script.js   # Page injection
│   ├── devtools.html       # DevTools panel entry
│   └── panel/
│       ├── App.svelte      # Main panel (built with Svelte!)
│       ├── StateTree.svelte
│       ├── ActionList.svelte
│       ├── Timeline.svelte
│       └── DiffView.svelte
├── bridge/
│   └── protocol.ts         # Communication protocol
└── package.json
```

### Implementation Notes

1. Extension communicates with page via `window.postMessage`
2. Content script injects detection code
3. DevTools panel connects when opened
4. State snapshots are serialized (handle circular refs, functions)

---

## v0.6.0+ - Nice to Have Ideas

### Enhanced Time Travel

```typescript
import { timeTravel } from '@svelte-reactor/core/plugins';

const store = createReactor(state, {
  plugins: [
    timeTravel({
      maxHistory: 100,
      snapshots: true,
      recording: true
    })
  ]
});

// API
store.timeTravel.goto(index);     // Jump to action
store.timeTravel.back();          // Previous action
store.timeTravel.forward();       // Next action
store.timeTravel.getTimeline();   // Get all actions

// Recording sessions
store.timeTravel.startRecording();
// ... user actions ...
const session = store.timeTravel.stopRecording();

// Replay session
store.timeTravel.replay(session, { speed: 2 });

// Export/Import
const snapshot = store.timeTravel.export();
store.timeTravel.import(snapshot);
```

### Computed Store Improvements

```typescript
import { computedStore } from '@svelte-reactor/core/helpers';

// Async computed
const userWithPosts = computedStore(store, async (state) => {
  const posts = await fetchPosts(state.user.id);
  return { ...state.user, posts };
}, {
  async: true,
  staleTime: 60_000
});
```

### Schema Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().positive()
});

const store = createReactor({
  user: { name: '', email: '', age: 0 }
}, {
  schema: {
    user: userSchema
  },
  validateOn: 'update'  // Throws if invalid
});
```

### Middleware Improvements

```typescript
const analyticsMiddleware = {
  name: 'analytics',
  afterUpdate: (prev, next, action) => {
    if (action?.startsWith('user:')) {
      analytics.track(action, { prev, next });
    }
  }
};

const store = createReactor(state, {
  middleware: [analyticsMiddleware]
});
```

---

## Rejected Ideas

### Fine-Grained Reactivity / Signals

**Reason:** Svelte 5 вже має runes (`$state`, `$derived`, `$effect`). Дублювати цей функціонал немає сенсу. Краще інтегруватися з runes ніж конкурувати.

### State Machines (XState-like)

**Reason:** Занадто складно для вбудованого рішення. Рекомендуємо використовувати XState напряму - він зрілий і добре документований. Можливо в майбутньому зробимо легку інтеграцію.

### Окремі пакети (@svelte-reactor/sync, @svelte-reactor/persist)

**Reason:** Занадто рано для екосистеми пакетів. Краще тримати все в `@svelte-reactor/core` з хорошим tree-shaking. Розбиття має сенс тільки коли бібліотека стане популярною.

### RuneDB (Reactive IndexedDB)

**Reason:** Цікава концепція, але:
1. Cross-tab sync складний (конфлікти, race conditions)
2. Dexie.js вже існує і зрілий
3. Краще покращити існуючий persist plugin з IndexedDB

**Альтернатива:** Покращити `persist({ storage: 'indexedDB' })` з кращою підтримкою колекцій.

---

## How to Prioritize

Коли обираємо наступну фічу, питаємо:

1. **Чи багато людей це просять?** (GitHub issues, Discord)
2. **Чи є альтернативи?** (Якщо є хороша бібліотека - не дублюємо)
3. **Чи можемо зробити якісно?** (Краще нічого ніж погано)
4. **Чи це відповідає філософії?** (Простота, Svelte-native, tree-shakeable)

---

**Updated:** 2025-01-08
