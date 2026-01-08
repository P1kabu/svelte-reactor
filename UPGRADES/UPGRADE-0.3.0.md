# Upgrade Guide: v0.3.0

**Target Release:** Q1 2025
**Codename:** "Monorepo, Forms & Cleanup"
**Status:** Planning

---

## Overview

v0.3.0 is a foundational release that sets the library on the right path:

1. **Monorepo Migration** - Split into scoped packages `@svelte-reactor/*`
2. **Form Helper** - New `createForm()` helper (killer feature)
3. **API Cleanup** - Deprecations, simplifications, better structure
4. **100% Backward Compatible** - Existing code continues to work (with warnings)

---

## What's Changing

### New
| Feature | Description |
|---------|-------------|
| `@svelte-reactor/core` | New scoped package name |
| `createForm()` | Form management helper |

### Deprecated (will show warnings, removed in v0.4.0)
| Feature | Replacement |
|---------|-------------|
| `asyncActions()` | Use `createQuery()` (v0.4.0) or plain async functions |

### Renamed
| Old | New |
|-----|-----|
| `multiTabSync` | `sync` |

### Simplified
| Feature | Change |
|---------|--------|
| `logger` plugin | Fewer options (removed rarely used) |
| Middleware system | Merged into Plugin interface |

### Demoted (less prominent in docs)
| Feature | Reason |
|---------|--------|
| `arrayActions` | Advanced use case, not core |
| `arrayPagination` | Advanced use case, not core |
| `computedStore` | Use `derived()` for simple cases |

---

## Package Structure

```
@svelte-reactor/
└── core                 # Main package (renamed from svelte-reactor)

svelte-reactor           # Compatibility wrapper -> @svelte-reactor/core
```

| Package | Description | Size Target |
|---------|-------------|-------------|
| `@svelte-reactor/core` | State management, plugins, helpers | < 12 KB |
| `svelte-reactor` | Compatibility alias | ~0 KB (re-export) |

---

## Phase 1: Monorepo Setup

### 1.1 Directory Structure

```
svelte-dev.reactor/
├── packages/
│   ├── core/                    # @svelte-reactor/core
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── core/
│   │   │   │   ├── reactor.svelte.ts
│   │   │   │   └── reactor-error.ts
│   │   │   ├── helpers/
│   │   │   │   ├── index.ts
│   │   │   │   ├── simple-store.ts
│   │   │   │   ├── persisted-store.ts
│   │   │   │   ├── array-actions.ts
│   │   │   │   ├── array-pagination.ts
│   │   │   │   ├── async-actions.ts     # DEPRECATED
│   │   │   │   ├── computed-store.ts
│   │   │   │   └── form.ts              # NEW
│   │   │   ├── plugins/
│   │   │   │   ├── index.ts
│   │   │   │   ├── undo-plugin.ts
│   │   │   │   ├── persist-plugin.ts
│   │   │   │   ├── logger-plugin.ts     # SIMPLIFIED
│   │   │   │   └── sync-plugin.ts       # RENAMED from multiTabSync
│   │   │   ├── storage/
│   │   │   ├── devtools/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── tests/
│   │   ├── templates/
│   │   └── package.json
│   │
│   ├── reactor/                 # svelte-reactor (compatibility wrapper)
│   │   ├── src/index.ts
│   │   └── package.json
│   │
│   └── create-reactor/          # CLI (existing)
│
├── examples/
├── UPGRADES/
├── pnpm-workspace.yaml
└── package.json
```

### 1.2 Migration Tasks

- [x] Register `@svelte-reactor` npm organization
- [ ] Create `pnpm-workspace.yaml`
- [ ] Update root `package.json` for workspaces
- [ ] Rename `packages/reactor` -> `packages/core`
- [ ] Update package.json name to `@svelte-reactor/core`
- [ ] Create `packages/reactor` as compatibility wrapper
- [ ] Update all internal imports
- [ ] Update CI/CD workflows
- [ ] Run all 500+ tests - must pass

### 1.3 Package.json (@svelte-reactor/core)

```json
{
  "name": "@svelte-reactor/core",
  "version": "0.3.0",
  "description": "Reactive state management for Svelte 5 with plugins",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./plugins": {
      "types": "./dist/plugins/index.d.ts",
      "default": "./dist/plugins/index.js"
    },
    "./helpers": {
      "types": "./dist/helpers/index.d.ts",
      "default": "./dist/helpers/index.js"
    },
    "./devtools": {
      "types": "./dist/devtools/index.d.ts",
      "default": "./dist/devtools/index.js"
    }
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  }
}
```

### 1.4 Compatibility Wrapper

**packages/reactor/src/index.ts:**
```typescript
// Re-export everything from @svelte-reactor/core
export * from '@svelte-reactor/core';

// Show deprecation notice (once)
if (typeof console !== 'undefined') {
  console.info(
    '[svelte-reactor] Consider migrating to @svelte-reactor/core for new projects.\n' +
    'See: https://github.com/user/svelte-reactor/blob/master/UPGRADES/UPGRADE-0.3.0.md'
  );
}
```

---

## Phase 2: API Cleanup

### 2.1 Deprecate asyncActions

**Why:** Query helper (v0.4.0) will be better. Users can use plain async functions.

```typescript
// helpers/async-actions.ts
/**
 * @deprecated Use createQuery() (coming in v0.4.0) or plain async functions.
 * Will be removed in v0.4.0.
 */
export function asyncActions<T extends object, A extends Record<string, AsyncActionFn<T>>>(
  reactor: Reactor<T>,
  actions: A,
  options?: AsyncActionOptions
): AsyncActions<T, A> {
  // Show warning once per session
  if (typeof console !== 'undefined' && !asyncActions._warned) {
    console.warn(
      '[svelte-reactor] asyncActions() is deprecated.\n' +
      'Use createQuery() (coming in v0.4.0) or plain async functions.\n' +
      'See: https://github.com/user/svelte-reactor/blob/master/UPGRADES/UPGRADE-0.3.0.md'
    );
    asyncActions._warned = true;
  }
  // ... existing implementation
}
```

**Migration:**
```typescript
// Before (asyncActions)
const api = asyncActions(store, {
  fetchUsers: async () => {
    const res = await fetch('/api/users');
    return { users: await res.json() };
  }
});
await api.fetchUsers();

// After (plain async function)
async function fetchUsers() {
  store.update(s => { s.loading = true; });
  try {
    const res = await fetch('/api/users');
    const users = await res.json();
    store.update(s => { s.users = users; s.loading = false; });
  } catch (error) {
    store.update(s => { s.error = error; s.loading = false; });
  }
}
```

### 2.2 Rename multiTabSync -> sync

**Why:** Shorter, cleaner name.

```typescript
// plugins/index.ts

// New name
export { sync } from './sync-plugin.js';

// Old name (deprecated alias)
export { sync as multiTabSync } from './sync-plugin.js';
```

```typescript
// sync-plugin.ts
export function sync(options?: SyncOptions): ReactorPlugin<any> {
  // ... implementation
}

/**
 * @deprecated Use sync() instead. Will be removed in v0.4.0.
 */
export const multiTabSync = sync;
```

**Migration:**
```typescript
// Before
import { multiTabSync } from 'svelte-reactor/plugins';
plugins: [multiTabSync({ key: 'app' })]

// After
import { sync } from '@svelte-reactor/core/plugins';
plugins: [sync({ key: 'app' })]
```

### 2.3 Simplify Logger Options

**Remove rarely used options:**

```typescript
// Before (too many options)
interface LoggerOptions {
  collapsed?: boolean;
  filter?: (action, state, prevState) => boolean;
  trackPerformance?: boolean;
  slowThreshold?: number;
  includeTimestamp?: boolean;
  maxDepth?: number;
}

// After (essential only)
interface LoggerOptions {
  collapsed?: boolean;
  filter?: (action, state, prevState) => boolean;
  performance?: boolean;  // renamed from trackPerformance
}
```

### 2.4 Merge Middleware into Plugins

**Current (confusing):**
```typescript
// Two similar concepts
interface ReactorPlugin<T> {
  name: string;
  init(context): void;
  destroy?(): void;
}

interface Middleware<T> {
  name: string;
  onBeforeUpdate?(prev, next, action): void;
  onAfterUpdate?(prev, next, action): void;
  onError?(error): void;
}
```

**After (unified):**
```typescript
interface ReactorPlugin<T> {
  name: string;
  init(context): void;
  destroy?(): void;

  // Lifecycle hooks (merged from Middleware)
  onBeforeUpdate?(prev: T, next: T, action?: string): void;
  onAfterUpdate?(prev: T, next: T, action?: string): void;
  onError?(error: Error): void;
}
```

**Migration:** Internal change only, no user action needed.

---

## Phase 3: Form Helper (Killer Feature)

### 3.1 Why Forms?

- Every project needs forms
- No good Svelte 5 runes-based solution exists
- React has Formik, React Hook Form - Svelte 5 has nothing comparable

### 3.2 API Design

```typescript
import { createForm } from '@svelte-reactor/core/helpers';

const form = createForm({
  initialValues: {
    email: '',
    password: '',
    rememberMe: false
  },

  validate: {
    email: [
      (v) => !!v || 'Email is required',
      (v) => v.includes('@') || 'Invalid email'
    ],
    password: (v) => v.length >= 8 || 'Min 8 characters'
  },

  onSubmit: async (values) => {
    await api.login(values);
  },

  validateOn: 'blur',
  persistDraft: 'login-form'
});
```

### 3.3 Form State

```typescript
interface FormState<T> {
  // Values
  values: T;
  initialValues: T;

  // Field state
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  errors: Record<keyof T, string>;

  // Form state
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
  submitError: string | null;

  // Methods
  setField(field, value): void;
  setError(field, error): void;
  setTouched(field): void;
  validate(): Promise<boolean>;
  submit(): Promise<void>;
  reset(): void;
}
```

### 3.4 Usage in Svelte

```svelte
<script lang="ts">
  import { createForm } from '@svelte-reactor/core/helpers';

  const form = createForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => v.includes('@') || 'Invalid email',
      password: (v) => v.length >= 8 || 'Min 8 characters'
    },
    onSubmit: async (values) => await login(values)
  });
</script>

<form onsubmit={(e) => { e.preventDefault(); form.submit(); }}>
  <input
    type="email"
    bind:value={form.values.email}
    onblur={() => form.setTouched('email')}
  />
  {#if form.touched.email && form.errors.email}
    <span class="error">{form.errors.email}</span>
  {/if}

  <input
    type="password"
    bind:value={form.values.password}
    onblur={() => form.setTouched('password')}
  />
  {#if form.touched.password && form.errors.password}
    <span class="error">{form.errors.password}</span>
  {/if}

  <button type="submit" disabled={!form.isValid || form.isSubmitting}>
    {form.isSubmitting ? 'Loading...' : 'Login'}
  </button>
</form>
```

### 3.5 Test Plan

| Category | Tests |
|----------|-------|
| Basic CRUD | 15 |
| Validation | 20 |
| Form State | 15 |
| Submission | 10 |
| Persistence | 10 |
| Edge Cases | 10 |
| **Total** | **80+** |

---

## Phase 4: Documentation & Polish

### 4.1 Core Documentation Updates

**Step 1: Package Documentation**
- [ ] `packages/core/README.md` - Update with @svelte-reactor/core branding
- [ ] `packages/core/CHANGELOG.md` - Add v0.3.0 entry
- [ ] `packages/core/API.md` - Add createForm(), update deprecations
- [ ] `packages/core/QUICK_START.md` - Update import paths
- [ ] `packages/core/MIGRATION.md` - Add v0.2.x → v0.3.0 guide

**Step 2: Root Repository Documentation**
- [ ] `/README.md` - Update with monorepo structure
- [ ] `/CLAUDE.md` - Update commands, architecture
- [ ] `/CONTRIBUTING.md` - Update for monorepo workflow

**Step 3: AI Templates**
- [ ] `templates/claude.md` - Add createForm() patterns
- [ ] `templates/cursor.md` - Add createForm() patterns
- [ ] `templates/copilot.md` - Add createForm() patterns

**Step 4: Form Helper Dedicated Docs**
- [ ] `packages/core/FORMS.md` - Complete form guide

### 4.2 Documentation Restructure

**Demote these sections (move to "Advanced" section):**
- arrayActions
- arrayPagination
- computedStore (clarify vs derived)

**Promote these sections (main docs):**
- createReactor
- simpleStore / persistedStore
- createForm (NEW)
- Plugins (undoRedo, persist, sync, logger)

### 4.3 Examples

**Form Examples:**
- [ ] Basic login form
- [ ] Registration with password confirmation
- [ ] Multi-step form wizard
- [ ] Dynamic form fields

### 4.4 Final Verification Checklist

- [ ] All code examples tested and working
- [ ] All import paths updated
- [ ] No broken links
- [ ] Deprecation warnings working
- [ ] Bundle size < 12 KB

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Monorepo** | 1-2 weeks | Setup, migrate, compatibility wrapper |
| **Phase 2: Cleanup** | 1 week | Deprecations, renames, simplifications |
| **Phase 3: Form Helper** | 2-3 weeks | Implement, test, document |
| **Phase 4: Polish** | 1 week | Docs, examples, release |
| **Total** | **5-7 weeks** | |

---

## Migration Guide for Users

### Import Path Changes

```typescript
// Old (still works with deprecation notice)
import { createReactor } from 'svelte-reactor';
import { persist, multiTabSync } from 'svelte-reactor/plugins';

// New (recommended)
import { createReactor } from '@svelte-reactor/core';
import { persist, sync } from '@svelte-reactor/core/plugins';
```

### Deprecated Features

```typescript
// asyncActions - DEPRECATED
// Before
const api = asyncActions(store, { fetchUsers: ... });

// After - use plain async functions or wait for createQuery() in v0.4.0
async function fetchUsers() {
  store.update(s => { s.loading = true; });
  // ...
}

// multiTabSync - RENAMED to sync
// Before
import { multiTabSync } from 'svelte-reactor/plugins';

// After
import { sync } from '@svelte-reactor/core/plugins';
```

### New Features

```typescript
// createForm() - NEW
import { createForm } from '@svelte-reactor/core/helpers';

const form = createForm({
  initialValues: { email: '', password: '' },
  validate: { email: v => v.includes('@') || 'Invalid' },
  onSubmit: async (values) => { /* ... */ }
});
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Existing tests | 500+ (maintain) |
| New form tests | 80+ |
| Core bundle size | < 12 KB |
| Form helper size | < 3 KB (tree-shakeable) |
| Documentation | Complete |
| Deprecation warnings | All working |

---

## Breaking Changes

### v0.3.0 - No Breaking Changes
All changes are backward compatible with deprecation warnings.

### v0.4.0 - Planned Removals
- `asyncActions()` - use `createQuery()` or plain async
- `multiTabSync` alias - use `sync`
- Old logger options - use simplified options

---

## Checklist

### Phase 1: Monorepo Setup
- [x] Register `@svelte-reactor` npm organization
- [ ] Create pnpm-workspace.yaml
- [ ] Update root package.json
- [ ] Rename packages/reactor -> packages/core
- [ ] Create compatibility wrapper
- [ ] Update imports
- [ ] Update CI/CD
- [ ] Test all 500+ tests
- [ ] Publish @svelte-reactor/core
- [ ] Publish svelte-reactor (wrapper)

### Phase 2: API Cleanup
- [ ] Add deprecation warning to asyncActions
- [ ] Rename multiTabSync -> sync (keep alias)
- [ ] Simplify logger options
- [ ] Merge middleware into plugin interface
- [ ] Update types

### Phase 3: Form Helper
- [ ] Design API (done above)
- [ ] Implement createForm()
- [ ] Add validation (sync + async)
- [ ] Add form state management
- [ ] Add draft persistence
- [ ] Write 80+ tests
- [ ] Document API

### Phase 4: Polish
- [ ] Update all documentation
- [ ] Restructure docs (demote advanced helpers)
- [ ] Create form examples
- [ ] Update AI templates
- [ ] Final testing
- [ ] Release

---

**Created:** 2025-01-04
**Updated:** 2025-01-08
**Status:** Planning
