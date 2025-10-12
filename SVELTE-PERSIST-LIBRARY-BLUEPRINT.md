# 🚀 Svelte Persist Library - Повна карта проекту

## 📋 Огляд проекту

**Назва:** `@svelte-dev/persist` (або `svelte-persist`)
**Слоган:** "Effortless state persistence for Svelte 5 Runes"
**Ціль:** Найпростіша та найпотужніша бібліотека для збереження стану в Svelte 5

---

## 🎯 Проблема яку вирішуємо

### Поточний стан екосистеми:
- ❌ `svelte-persisted-store` - не працює з Svelte 5 Runes
- ❌ `svelte-local-storage-store` - застарілий, без TypeScript
- ❌ Розробники пишуть однаковий код знову і знову
- ❌ Немає стандартного рішення для IndexedDB
- ❌ Відсутня обробка quota errors, compression, migrations

### Що потрібно спільноті:
- ✅ TypeScript-first бібліотека з повною типізацією
- ✅ Нативна підтримка Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- ✅ Multi-storage (localStorage, sessionStorage, IndexedDB, custom)
- ✅ Compression для великих даних
- ✅ Tab synchronization
- ✅ Schema migrations
- ✅ SSR-safe для SvelteKit
- ✅ Tiny bundle size (<2KB gzipped для core)

---

## 🏗️ Архітектура бібліотеки

### Структура проекту:

```
svelte-persist/
├── packages/
│   ├── core/                      # Основний пакет
│   │   ├── src/
│   │   │   ├── index.ts           # Public API
│   │   │   ├── persisted.svelte.ts # Головна функція з runes
│   │   │   ├── storages/
│   │   │   │   ├── localStorage.ts
│   │   │   │   ├── sessionStorage.ts
│   │   │   │   ├── indexedDB.ts
│   │   │   │   ├── memory.ts      # Fallback для SSR
│   │   │   │   └── types.ts
│   │   │   ├── adapters/
│   │   │   │   ├── compression.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   └── sync.ts        # Tab sync
│   │   │   ├── utils/
│   │   │   │   ├── quota.ts       # Quota error handling
│   │   │   │   ├── migrations.ts
│   │   │   │   ├── serializer.ts
│   │   │   │   └── debounce.ts
│   │   │   └── types/
│   │   │       └── index.ts       # TypeScript types
│   │   ├── tests/
│   │   │   ├── persisted.test.ts
│   │   │   ├── storages.test.ts
│   │   │   ├── compression.test.ts
│   │   │   └── migrations.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── plugins/                    # Опціональні плагіни
│   │   ├── compression/
│   │   ├── encryption/
│   │   └── sync/
│   │
│   └── presets/                    # Готові пресети
│       ├── form-data/
│       ├── auth/
│       └── cart/
│
├── docs/                           # Документація
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── api-reference.md
│   │   ├── recipes.md
│   │   └── migration-guide.md
│   ├── examples/
│   │   ├── basic-counter/
│   │   ├── todo-app/
│   │   ├── shopping-cart/
│   │   └── multi-tab-sync/
│   └── .vitepress/
│       └── config.ts
│
├── playground/                     # Інтерактивна playground
│   ├── src/
│   │   ├── routes/
│   │   │   ├── basic/
│   │   │   ├── compression/
│   │   │   ├── indexeddb/
│   │   │   └── migrations/
│   │   └── app.html
│   └── package.json
│
├── benchmarks/                     # Performance benchmarks
│   └── src/
│       ├── bundle-size.ts
│       └── performance.ts
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── publish.yml
│   │   └── benchmark.yml
│   └── ISSUE_TEMPLATE/
│
├── package.json                    # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 💻 API Design

### 1. Базове використання

```typescript
import { persisted } from '@svelte-dev/persist';

// Простий counter
let count = persisted('counter', $state(0));

// В компоненті
<script lang="ts">
  let count = persisted('counter', $state(0));
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

### 2. З опціями

```typescript
import { persisted } from '@svelte-dev/persist';

interface User {
  id: string;
  name: string;
  email: string;
}

let user = persisted('user', $state<User | null>(null), {
  // Storage backend
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'indexeddb' | custom

  // Serialization
  serializer: {
    stringify: JSON.stringify,
    parse: JSON.parse,
  },

  // Debounce writes
  debounce: 300, // ms

  // Compression (для великих даних)
  compress: true,

  // Encryption (опціонально)
  encrypt: {
    key: 'secret-key',
    algorithm: 'AES-GCM',
  },

  // Tab synchronization
  sync: true,

  // Quota handling
  onQuotaExceeded: (error) => {
    console.error('Storage quota exceeded!', error);
    // Custom logic: compress, delete old data, notify user
  },

  // Migrations
  version: 2,
  migrations: {
    1: (oldData) => ({ ...oldData, newField: true }),
    2: (oldData) => ({ ...oldData, renamedField: oldData.oldField }),
  },

  // SSR handling
  ssr: true, // Auto-detect SSR and use memory storage
});
```

### 3. IndexedDB для великих даних

```typescript
import { persisted } from '@svelte-dev/persist';

// Фото клієнтів, історія замовлень
let photos = persisted('client-photos', $state([]), {
  storage: 'indexeddb',
  dbName: 'myApp',
  storeName: 'photos',
  compress: true,
});
```

### 4. Derived states

```typescript
import { persisted } from '@svelte-dev/persist';

let cart = persisted('cart', $state([
  { id: 1, name: 'Product 1', price: 100 },
  { id: 2, name: 'Product 2', price: 200 },
]));

// Derived буде автоматично реактивним, але НЕ буде персиститись
let total = $derived(
  cart.reduce((sum, item) => sum + item.price, 0)
);
```

### 5. Custom storage adapter

```typescript
import { persisted, createStorageAdapter } from '@svelte-dev/persist';

// Приклад: Capacitor Storage для мобільних додатків
const capacitorStorage = createStorageAdapter({
  name: 'capacitor',

  async get(key: string) {
    const { value } = await Preferences.get({ key });
    return value;
  },

  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  },

  async remove(key: string) {
    await Preferences.remove({ key });
  },

  async clear() {
    await Preferences.clear();
  },
});

let settings = persisted('app-settings', $state({}), {
  storage: capacitorStorage,
});
```

### 6. Утиліти

```typescript
import {
  persisted,
  clearAll,        // Очистити всі persisted stores
  getStorageInfo,  // Інформація про використання storage
  migrateAll,      // Запустити всі міграції
} from '@svelte-dev/persist';

// Отримати інформацію про storage
const info = await getStorageInfo();
console.log(info);
// {
//   used: 1234567,        // bytes
//   quota: 10485760,      // bytes
//   percentage: 11.77,    // %
//   items: 42,            // кількість збережених ключів
// }

// Очистити все
await clearAll({ confirm: true });
```

---

## 🔧 Технічна реалізація

### Core функція `persisted`

```typescript
// packages/core/src/persisted.svelte.ts

import { $state, $effect } from 'svelte';
import type { PersistedOptions, StorageAdapter } from './types';

export function persisted<T>(
  key: string,
  initialState: T,
  options?: PersistedOptions<T>
): T {
  const {
    storage = 'localStorage',
    serializer = JSON,
    debounce = 0,
    compress = false,
    sync = false,
    version = 1,
    migrations = {},
    onQuotaExceeded,
    ssr = true,
  } = options ?? {};

  // Отримуємо storage adapter
  const storageAdapter = getStorageAdapter(storage);

  // SSR detection
  const isSSR = typeof window === 'undefined';
  if (isSSR && ssr) {
    // Використовуємо memory storage для SSR
    return initialState;
  }

  // Завантажуємо збережене значення
  const stored = loadFromStorage(key, storageAdapter, {
    serializer,
    compress,
    version,
    migrations,
  });

  // Створюємо reactive state
  let state = $state(stored ?? initialState);

  // Зберігаємо при зміні
  $effect(() => {
    const value = state; // Track reactivity

    saveToStorage(key, value, storageAdapter, {
      serializer,
      compress,
      debounce,
      onQuotaExceeded,
    });
  });

  // Tab sync
  if (sync && !isSSR) {
    setupTabSync(key, state, storageAdapter);
  }

  return state;
}
```

### Storage Adapters

```typescript
// packages/core/src/storages/localStorage.ts

import type { StorageAdapter } from '../types';

export const localStorageAdapter: StorageAdapter = {
  name: 'localStorage',

  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError(key, value.length);
      }
      throw error;
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },
};
```

### Compression

```typescript
// packages/core/src/adapters/compression.ts

import pako from 'pako';

export async function compress(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const compressed = pako.deflate(bytes);
  return btoa(String.fromCharCode(...compressed));
}

export async function decompress(data: string): Promise<string> {
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const decompressed = pako.inflate(bytes);
  return new TextDecoder().decode(decompressed);
}
```

### Migrations

```typescript
// packages/core/src/utils/migrations.ts

export function runMigrations<T>(
  data: any,
  currentVersion: number,
  targetVersion: number,
  migrations: Record<number, (data: any) => any>
): T {
  let migrated = data;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    const migrate = migrations[v];
    if (migrate) {
      migrated = migrate(migrated);
    }
  }

  return migrated;
}
```

---

## 📦 Пакети та розподіл

### Основний пакет `@svelte-dev/persist`

```json
// packages/core/package.json
{
  "name": "@svelte-dev/persist",
  "version": "1.0.0",
  "description": "Effortless state persistence for Svelte 5 Runes",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "svelte": "^5.0.0"
  },
  "keywords": [
    "svelte",
    "svelte5",
    "runes",
    "persistence",
    "localStorage",
    "indexeddb",
    "state-management"
  ]
}
```

### Опціональні плагіни

```
@svelte-dev/persist-compression   # Compression plugin
@svelte-dev/persist-encryption    # Encryption plugin
@svelte-dev/persist-sync          # Advanced tab sync
```

---

## 🎨 Приклади використання

### 1. Todo App

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
    todos = [...todos, {
      id: crypto.randomUUID(),
      text: input,
      done: false,
    }];
    input = '';
  }

  function toggleTodo(id: string) {
    todos = todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
  }
</script>

<input bind:value={input} onkeydown={e => e.key === 'Enter' && addTodo()}>
<button onclick={addTodo}>Add</button>

<ul>
  {#each todos as todo}
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        onchange={() => toggleTodo(todo.id)}
      >
      {todo.text}
    </li>
  {/each}
</ul>
```

### 2. Shopping Cart з IndexedDB

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string; // base64
  }

  let cart = persisted('cart', $state<CartItem[]>([]), {
    storage: 'indexeddb',
    compress: true,
    debounce: 500,
  });

  let total = $derived(
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  function addToCart(item: Omit<CartItem, 'quantity'>) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      cart = cart.map(i =>
        i.id === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      cart = [...cart, { ...item, quantity: 1 }];
    }
  }
</script>

<div>Total: ${total}</div>
```

### 3. Multi-tab sync

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Синхронізується між всіма відкритими вкладками
  let counter = persisted('shared-counter', $state(0), {
    sync: true,
  });
</script>

<button onclick={() => counter++}>
  {counter}
</button>

<p>Відкрийте в другій вкладці - counter синхронізується!</p>
```

### 4. Form з auto-save

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  interface FormData {
    name: string;
    email: string;
    message: string;
  }

  let formData = persisted('contact-form', $state<FormData>({
    name: '',
    email: '',
    message: '',
  }), {
    debounce: 1000, // Зберігаємо через 1 секунду після останньої зміни
  });

  function submitForm() {
    // Send form data
    console.log(formData);
    // Clear after submit
    formData = { name: '', email: '', message: '' };
  }
</script>

<form onsubmit|preventDefault={submitForm}>
  <input bind:value={formData.name} placeholder="Name">
  <input bind:value={formData.email} placeholder="Email" type="email">
  <textarea bind:value={formData.message} placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>

<p class="autosave">✓ Auto-saved</p>
```

---

## 🧪 Тестування

### Unit tests

```typescript
// packages/core/tests/persisted.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { persisted } from '../src';

describe('persisted', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist state to localStorage', () => {
    let count = persisted('test-counter', $state(0));
    count = 5;

    // Reload
    let count2 = persisted('test-counter', $state(0));
    expect(count2).toBe(5);
  });

  it('should handle compression', async () => {
    const largeData = 'x'.repeat(10000);
    let data = persisted('large-data', $state(largeData), {
      compress: true,
    });

    const stored = localStorage.getItem('large-data');
    expect(stored!.length).toBeLessThan(largeData.length);
  });

  it('should run migrations', () => {
    localStorage.setItem('user', JSON.stringify({
      __version: 1,
      firstName: 'John'
    }));

    let user = persisted('user', $state({}), {
      version: 2,
      migrations: {
        2: (old) => ({ ...old, fullName: old.firstName }),
      },
    });

    expect(user.fullName).toBe('John');
  });
});
```

### E2E tests з Playwright

```typescript
// packages/core/tests/e2e/tab-sync.test.ts

import { test, expect } from '@playwright/test';

test('should sync between tabs', async ({ context }) => {
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto('/counter');
  await page2.goto('/counter');

  // Increment in page1
  await page1.click('button');

  // Should update in page2
  await expect(page2.locator('button')).toHaveText('1');
});
```

---

## 📊 Performance бенчмарки

```typescript
// benchmarks/src/performance.ts

import { bench, describe } from 'vitest';
import { persisted } from '@svelte-dev/persist';

describe('Performance', () => {
  bench('write 1000 items', () => {
    let items = persisted('items', $state([]));
    for (let i = 0; i < 1000; i++) {
      items = [...items, { id: i, name: `Item ${i}` }];
    }
  });

  bench('read 1000 items', () => {
    let items = persisted('items', $state([]));
    items.forEach(item => item.name);
  });
});
```

---

## 📚 Документація

### Структура docs

```
docs/
├── guide/
│   ├── introduction.md
│   ├── getting-started.md
│   ├── core-concepts.md
│   ├── api-reference.md
│   ├── storages.md
│   ├── compression.md
│   ├── encryption.md
│   ├── migrations.md
│   ├── tab-sync.md
│   ├── ssr.md
│   └── troubleshooting.md
│
├── examples/
│   ├── basic-usage.md
│   ├── todo-app.md
│   ├── shopping-cart.md
│   ├── form-autosave.md
│   ├── user-preferences.md
│   └── multi-tab-sync.md
│
└── advanced/
    ├── custom-storage.md
    ├── performance-tips.md
    ├── testing.md
    └── contributing.md
```

### README.md приклад

````markdown
# @svelte-dev/persist

> Effortless state persistence for Svelte 5 Runes

[![npm version](https://img.shields.io/npm/v/@svelte-dev/persist.svg)](https://www.npmjs.com/package/@svelte-dev/persist)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@svelte-dev/persist)](https://bundlephobia.com/package/@svelte-dev/persist)
[![License](https://img.shields.io/npm/l/@svelte-dev/persist.svg)](https://github.com/svelte-dev/persist/blob/main/LICENSE)

## Features

✨ **Svelte 5 Runes** - Built for `$state`, `$derived`, `$effect`
🗄️ **Multi-storage** - localStorage, sessionStorage, IndexedDB, or custom
🔐 **Type-safe** - Full TypeScript support
🗜️ **Compression** - Automatic compression for large data
🔄 **Tab sync** - Synchronize state across browser tabs
📦 **Migrations** - Version and migrate your persisted data
⚡ **Tiny** - < 2KB gzipped
🔒 **SSR-safe** - Works with SvelteKit
🧪 **Well-tested** - Comprehensive test coverage

## Installation

```bash
npm install @svelte-dev/persist
```

## Quick Start

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  let count = persisted('counter', $state(0));
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

[Full Documentation](https://svelte-persist.dev) | [Examples](https://svelte-persist.dev/examples) | [API Reference](https://svelte-persist.dev/api)

## License

MIT © [Your Name]
````

---

## 🚀 Roadmap

### Phase 1: MVP (v0.1.0) - Тиждень 1-2
- ✅ Базова функція `persisted` з localStorage
- ✅ TypeScript типізація
- ✅ Svelte 5 Runes підтримка
- ✅ Serialization (JSON)
- ✅ SSR detection
- ✅ Unit tests
- ✅ README та базова документація

### Phase 2: Core Features (v0.5.0) - Тиждень 3-4
- ✅ sessionStorage adapter
- ✅ IndexedDB adapter
- ✅ Compression
- ✅ Debounce/throttle
- ✅ Quota error handling
- ✅ Tab synchronization
- ✅ E2E tests
- ✅ Playground

### Phase 3: Advanced (v1.0.0) - Тиждень 5-6
- ✅ Migrations system
- ✅ Encryption plugin
- ✅ Custom storage adapters API
- ✅ Performance benchmarks
- ✅ Full documentation site (VitePress)
- ✅ Multiple examples
- ✅ CI/CD pipeline

### Phase 4: Ecosystem (v1.x.x) - Після релізу
- 🔄 React Native adapter (AsyncStorage)
- 🔄 Capacitor adapter
- 🔄 Tauri adapter
- 🔄 Chrome Extension storage adapter
- 🔄 WebSQL fallback
- 🔄 Presets (auth, cart, forms)
- 🔄 DevTools extension
- 🔄 Integrations (Zod, Yup validation)

---

## 🎯 Success Metrics

### Технічні метрики:
- **Bundle size:** < 2KB gzipped (core)
- **Performance:** < 1ms для read/write в localStorage
- **Test coverage:** > 90%
- **TypeScript:** 100% typed
- **Tree-shakeable:** Так

### Метрики популярності (перші 3 місяці):
- **NPM downloads:** > 10,000/month
- **GitHub stars:** > 500
- **GitHub issues:** < 5 open bugs
- **Documentation:** > 95% complete

### Спільнота:
- **Contributors:** > 5
- **Discord/Community:** > 100 members
- **Showcase apps:** > 20

---

## 🛠️ Tech Stack

### Бібліотека:
- **Language:** TypeScript 5.x
- **Build:** Vite + Rollup
- **Testing:** Vitest + Playwright
- **Linting:** ESLint + Prettier

### Документація:
- **Framework:** VitePress
- **Hosting:** Netlify або Vercel
- **Analytics:** Plausible

### Playground:
- **Framework:** SvelteKit
- **Styling:** Tailwind CSS

### CI/CD:
- **GitHub Actions**
- **Changesets** для versioning
- **NPM** для публікації

---

## 📝 Marketing & Promotion

### Launch план:

**Week 1-2: Soft launch**
- Пост на Reddit (r/sveltejs)
- Tweet thread
- Dev.to article
- Discussions на GitHub Svelte

**Week 3-4: Official launch**
- Product Hunt launch
- Hacker News post
- YouTube tutorial (швидкий demo)
- Blog post на особистому блозі

**Ongoing:**
- Weekly Twitter updates
- Monthly blog posts
- Community engagement
- Conference talks (Svelte Summit)

### Content план:

1. **Blog posts:**
   - "Introducing @svelte-dev/persist"
   - "How to persist Svelte 5 Runes state"
   - "Building a persisted shopping cart"
   - "IndexedDB vs localStorage: When to use what"

2. **Videos:**
   - Quick start (5 min)
   - Advanced features (15 min)
   - Building a real app (30 min)

3. **Tutorials:**
   - Todo app
   - Shopping cart
   - User settings
   - Multi-step form

---

## 🤝 Contribution Guide

```markdown
# Contributing to @svelte-dev/persist

## Development setup

1. Clone repo:
   ```bash
   git clone https://github.com/svelte-dev/persist.git
   cd persist
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

4. Run playground:
   ```bash
   pnpm dev
   ```

## Project structure

- `packages/core` - Main library
- `packages/plugins` - Optional plugins
- `docs` - Documentation
- `playground` - Interactive examples

## Testing

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Type check: `pnpm typecheck`

## Pull Request process

1. Fork the repo
2. Create feature branch
3. Make changes
4. Add tests
5. Run `pnpm test`
6. Submit PR
```

---

## 📄 License

MIT License - дозволяє комерційне використання

---

## 🎉 Наступні кроки

### Для початку роботи потрібно:

1. **Створити новий проект:**
   ```bash
   mkdir svelte-persist
   cd svelte-persist
   pnpm init
   ```

2. **Налаштувати monorepo:**
   - pnpm workspace
   - TypeScript
   - Vitest
   - Vite

3. **Почати з MVP:**
   - Базова функція `persisted`
   - localStorage adapter
   - Тести

4. **Документація:**
   - README.md
   - Basic examples

### Я готовий допомогти з:
- ✅ Налаштування проекту
- ✅ Написання коду
- ✅ Тестування
- ✅ Документація
- ✅ CI/CD setup
- ✅ Publishing на NPM

---

**Готовий створити цю бібліотеку?** 🚀

Запускай мене в новому проекті і почнемо з Phase 1!
