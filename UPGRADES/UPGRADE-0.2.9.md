# Upgrade Guide: v0.2.9 - "Cleanup & Simplification"

**Released:** January 4, 2025
**Status:** ✅ Completed
**Type:** Breaking Changes - Library Cleanup

---

## Overview

Version 0.2.9 is a **cleanup release** that removes unnecessary code, simplifies APIs, and reduces bundle size BEFORE the library gains more users. This is the right time for breaking changes.

### Philosophy

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

Before adding new features in v0.3.0, we need a clean foundation.

---

## Summary of Changes

| Change | Type | Impact |
|--------|------|--------|
| Remove `batch()`, `batchAll()` | Breaking | Use `reactor.batch()` directly |
| Remove `.value` getter | Breaking | Use `.get()` instead |
| Remove `diff()` utility | Breaking | Use external libs (microdiff, deep-diff) |
| Extract pagination from arrayActions | Breaking | Use `arrayPagination()` helper |
| Remove `subscribe(options)` overload | Breaking | Use `select()` instead |
| Remove localStorage fallback in sync | Minor | Modern browsers only (95%+) |
| Add `onReady` callback for IndexedDB | Feature | Async data load notification |

**Result:** Bundle reduced from 11.67 KB to 11.52 KB gzipped

---

## Phase 1: Remove Redundant Batch Utilities (P0)

### 1.1 Problem

**File:** `packages/reactor/src/utils/batch.ts`

Current batch.ts has 4 functions:
- `batch(reactor, fn)` - just calls `reactor.batch(fn)` - **USELESS WRAPPER**
- `batchAll(fn)` - literally just calls `fn()` - **DOES NOTHING**
- `batched(reactor, fn)` - HOF wrapper - useful
- `debouncedBatch(reactor, fn, delay)` - debounce - useful

```typescript
// batchAll literally does nothing:
export function batchAll<T>(fn: () => T): T {
  return fn(); // This is the entire implementation!
}
```

### 1.2 Solution

1. **Remove `batch()`** - users should call `reactor.batch()` directly
2. **Remove `batchAll()`** - it's a no-op
3. **Keep `batched()` and `debouncedBatch()`** - they provide real value

### 1.3 Migration

```typescript
// Before (v0.2.8)
import { batch, batchAll } from 'svelte-reactor/utils';
batch(store, () => { /* ... */ });
batchAll(() => { /* ... */ });

// After (v0.2.9)
store.batch(() => { /* ... */ });
// Just call your function directly, batchAll did nothing
```

### 1.4 Files to Modify

- `src/utils/batch.ts` - Remove batch(), batchAll()
- `src/utils/index.ts` - Update exports
- `tests/batch.test.ts` - Remove tests for removed functions

---

## Phase 2: Remove `.value` Getter (P0)

### 2.1 Problem

**File:** `packages/reactor/src/helpers/value-store-factory.ts`

The `.value` getter exists only to show deprecation warnings for users migrating from other libraries. This adds complexity:
- 15 lines of Object.defineProperty code
- Console spam with warnings
- Confusing API surface

### 2.2 Solution

**Remove entirely.** Users must use `.get()` from the start.

### 2.3 Migration

```typescript
// Before (v0.2.8) - showed deprecation warning
const count = counter.value;

// After (v0.2.9) - .value doesn't exist
const count = counter.get();

// In Svelte templates (unchanged)
{$counter}
```

### 2.4 Files to Modify

- `src/helpers/value-store-factory.ts` - Remove .value property
- `tests/value-deprecation.test.ts` - Delete entire file
- Update all documentation

---

## Phase 3: Remove `diff()` Utility (P0)

### 3.1 Problem

**File:** `packages/reactor/src/utils/diff.ts`

The `diff()` utility is 211 lines for a niche use case:
- Deep object comparison with path tracking
- Only used in 3 test files
- Better external alternatives exist:
  - `deep-diff` (battle-tested, 1.5KB)
  - `jsondiffpatch` (feature-rich)
  - `microdiff` (tiny, fast)

### 3.2 Solution

**Remove from core.** Users who need diff can use external libraries.

### 3.3 Migration

```typescript
// Before (v0.2.8)
import { diff } from 'svelte-reactor/utils';
const changes = diff(oldState, newState);

// After (v0.2.9) - use external library
import { diff } from 'deep-diff';
const changes = diff(oldState, newState);

// Or use microdiff (recommended, tiny)
import diff from 'microdiff';
const changes = diff(oldState, newState);
```

### 3.4 Files to Modify

- `src/utils/diff.ts` - Delete entire file
- `src/utils/index.ts` - Remove export
- `tests/diff.test.ts` - Delete entire file

---

## Phase 4: Extract Pagination from arrayActions (P1)

### 4.1 Problem

**File:** `packages/reactor/src/helpers/array-actions.ts`

Pagination adds 65+ lines to arrayActions:
- Conditional method spreading
- Extra state (currentPage, pageSize)
- Niche use case (most UIs use infinite scroll)
- Makes core arrayActions harder to understand

### 4.2 Solution

Create separate `arrayPagination()` helper:

```typescript
// New file: src/helpers/array-pagination.ts
import { arrayPagination } from 'svelte-reactor';

const store = createReactor({ items: [] });
const actions = arrayActions(store, 'items');

// Optional: add pagination if needed
const pagination = arrayPagination(store, 'items', { pageSize: 20 });

// Use pagination methods
pagination.setPage(2);
pagination.nextPage();
const page = pagination.getCurrentPage();
```

### 4.3 Migration

```typescript
// Before (v0.2.8)
const actions = arrayActions(store, 'items', { pagination: true, pageSize: 20 });
actions.nextPage();
actions.getPaginated();

// After (v0.2.9)
const actions = arrayActions(store, 'items');
const pagination = arrayPagination(store, 'items', { pageSize: 20 });
pagination.nextPage();
pagination.getPage();
```

### 4.4 Files to Modify

- `src/helpers/array-actions.ts` - Remove pagination code
- `src/helpers/array-pagination.ts` - New file
- `src/helpers/index.ts` - Add export
- `tests/array-pagination.test.ts` - New test file

---

## Phase 5: Remove `subscribe(options)` Overload (P1)

### 5.1 Problem

**File:** `packages/reactor/src/core/reactor.svelte.ts`

Two APIs do the same thing:

```typescript
// Option 1: subscribe with options
store.subscribe({
  selector: s => s.user.name,
  onChanged: (name) => console.log(name)
});

// Option 2: select() method
store.select(s => s.user.name, (name) => console.log(name));
```

Having both is confusing. `select()` is cleaner.

### 5.2 Solution

Remove `subscribe(options)` overload. Keep only:
- `subscribe(fn)` - full state subscription (Svelte store contract)
- `select(selector, callback?, options?)` - selective subscription

### 5.3 Migration

```typescript
// Before (v0.2.8)
store.subscribe({
  selector: s => s.user,
  onChanged: handleUserChange,
  immediate: true
});

// After (v0.2.9)
store.select(s => s.user, handleUserChange, { immediate: true });
```

### 5.4 Files to Modify

- `src/core/reactor.svelte.ts` - Remove subscribe overload
- `src/types/index.ts` - Simplify SubscribeOptions type
- `tests/subscribe.test.ts` - Update tests

---

## Phase 6: Simplify Multi-Tab Sync (P2)

### 6.1 Problem

**File:** `packages/reactor/src/plugins/sync-plugin.ts`

localStorage fallback adds ~40 lines for browsers that don't support BroadcastChannel. But:
- BroadcastChannel: 95%+ browser support
- Only IE11 and very old browsers lack it
- IE11 is dead (Microsoft ended support 2022)

### 6.2 Solution

Remove localStorage fallback. Target modern browsers only.

```typescript
// sync-plugin.ts - simplified
export function sync(options: SyncOptions): Plugin {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('svelte-reactor: sync plugin requires BroadcastChannel API');
    return { name: 'sync-disabled' };
  }
  // ... rest of implementation
}
```

### 6.3 Files to Modify

- `src/plugins/sync-plugin.ts` - Remove localStorage fallback
- `tests/sync.test.ts` - Update tests

---

## Phase 7: Simplify AsyncActions (P2) - COMPLETED

> **Status:** Completed on v0.2.9

### 7.1 Problem

**File:** `packages/reactor/src/helpers/async-actions.ts`

AsyncActions was 441 lines with many rarely-used options:
- `retry` with exponential backoff - belongs in API layer
- `debounce` - use lodash/debounce
- 3 concurrency modes (`parallel` rarely needed)
- `onRetry`, `onMaxRetries` callbacks

### 7.2 Solution (Implemented)

Simplified to core use case:

```typescript
// New simplified AsyncActionOptions
interface AsyncActionOptions {
  loadingKey?: string;
  errorKey?: string;
  actionPrefix?: string;
  resetErrorOnStart?: boolean;
  concurrency?: 'queue' | 'replace';  // Default: 'replace'
  onError?: (error: Error, actionName: string) => void;  // NEW
}

// Removed:
// - retry?: RetryOptions
// - debounce?: number
// - concurrency: 'parallel' (only 'queue' | 'replace' now)
```

**Result:** Reduced from 441 lines to 331 lines (~25% reduction)

### 7.3 Migration

```typescript
// Before (v0.2.8) - retry in asyncAction
const api = asyncActions(store, { fetchUsers }, {
  retry: { attempts: 3, delay: 1000 }
});

// After (v0.2.9) - retry at API layer
const fetchWithRetry = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetch('/api/users').then(r => r.json());
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
const api = asyncActions(store, { fetchUsers: fetchWithRetry });

// Before (v0.2.8) - debounce in asyncAction
const api = asyncActions(store, { search }, { debounce: 300 });

// After (v0.2.9) - use external debounce
import { debounce } from 'lodash-es';
const debouncedSearch = debounce((q: string) => api.search(q), 300);
```

### 7.4 Files Modified

- `src/helpers/async-actions.ts` - Removed retry, debounce, 'parallel' mode
- `tests/async-actions.test.ts` - Updated tests for new API
- `tests/v0.2.3-integration.test.ts` - Updated integration tests
- `tests/indexeddb-stress.test.ts` - Updated stress tests

---

## Phase 8: Documentation & Tests

### 8.1 Update Documentation

- [x] README.md - Update API, remove deprecated features
- [x] API.md - Remove batch(), batchAll(), diff(), subscribe(options)
- [x] ~~MIGRATION.md~~ - Not needed (info in UPGRADE-0.2.9.md + API.md)
- [x] CHANGELOG.md - Document all breaking changes

### 8.2 Update AI Templates

- [x] templates/claude.md - Updated for v0.2.9 (onReady, sync, limit)
- [x] templates/cursor.md - Updated for v0.2.9 (onReady, sync, limit)
- [x] templates/copilot.md - Updated for v0.2.9 (onReady, sync, limit)

### 8.3 Test Updates

- [ ] Delete tests for removed features
- [ ] Add tests for arrayPagination
- [ ] Update existing tests for new APIs

---

## Phase 9: Release

### 9.1 Pre-release Checklist

- [ ] All tests pass
- [ ] Bundle size reduced (target: < 11 KB gzipped)
- [ ] MIGRATION.md complete
- [ ] CHANGELOG.md updated
- [ ] All docs updated

### 9.2 Release Steps

```bash
cd packages/reactor
pnpm test
pnpm build
# Verify bundle size
pnpm publish --access public --no-git-checks
git tag v0.2.9
git push origin master --tags
```

---

## Breaking Changes Summary

| Removed | Replacement |
|---------|-------------|
| `batch(reactor, fn)` | `reactor.batch(fn)` |
| `batchAll(fn)` | Just call `fn()` directly |
| `store.value` | `store.get()` |
| `diff(a, b)` | Use `microdiff` or `deep-diff` package |
| `arrayActions(..., { pagination })` | Use separate `arrayPagination()` |
| `subscribe({ selector, ... })` | Use `select(selector, ...)` |
| `asyncAction(..., { retry })` | Handle retry at API layer |
| `asyncAction(..., { debounce })` | Use `lodash-es/debounce` |
| `asyncAction(..., { concurrency: 'parallel' })` | Use default `'replace'` or `'queue'` |
| Sync localStorage fallback | Use modern browsers (95%+) |

---

## Success Metrics

| Metric | v0.2.8 | v0.2.9 Actual |
|--------|--------|---------------|
| Bundle size | 11.67 KB | 11.11 KB ✅ |
| Tests | 501 | 500 ✅ |
| API surface | Large | Simplified ✅ |
| Breaking changes | 0 | 8 ✅ |
| AsyncActions | 441 lines | 331 lines ✅ |

---

## Why Breaking Changes Now?

1. **Low user count** - Easier to migrate few users than many
2. **Before v0.3.0** - v0.3.0 adds major features, need clean base
3. **Technical debt** - Remove it early, not later
4. **Better DX** - Simpler API = happier developers
5. **Smaller bundle** - Less code = faster load

---

## Bug Fixes (Included in v0.2.9)

### IndexedDB Persistence Fix

**Problem:** Data saved to IndexedDB was not being loaded on page reload.

**Root Cause:** The `IndexedDBStorageSync` class loads its cache asynchronously, but the persist plugin was reading from the cache synchronously during initialization - before the cache was populated.

**Fix:**
1. Exposed `ready` Promise from `IndexedDBStorageSync` (was private)
2. Updated persist plugin to wait for IndexedDB cache to be ready before loading state
3. Added `onReady` callback to `PersistOptions` for async notification

**Usage:**

```typescript
// Now works correctly!
const store = createReactor({ documents: [] }, {
  plugins: [
    persist({
      key: 'my-data',
      storage: 'indexedDB',
      onReady: (loadedState) => {
        // Called when IndexedDB data is loaded
        console.log('State loaded:', loadedState);
      }
    })
  ]
});
```

**Files Modified:**
- `src/storage/indexeddb.ts` - Made `ready` Promise public
- `src/plugins/persist-plugin.ts` - Wait for IndexedDB before loading
- `src/types/index.ts` - Added `onReady` callback type
- `tests/persist-indexeddb.test.ts` - Added persistence tests

---

## Known Limitations (Documented by Tests)

The comprehensive IndexedDB integration tests (`indexeddb-integration.test.ts`) documented these behaviors:

### 1. Pick/Omit with Nested Objects

When using `pick` or `omit` with nested paths (e.g., `user.name`), be aware:

```typescript
// pick: ['user.name', 'user.email']
// Stored: { user: { name: 'John', email: 'john@test.com' } }
// On load: user.password becomes undefined (not initial value)
```

**Reason:** `Object.assign()` replaces entire objects, so non-picked nested fields become `undefined`.

**Workaround:** Use top-level picking or store sensitive data in separate keys.

### 2. Undo/Redo + Persist Interaction

Undo history is NOT persisted across page reloads:

```typescript
// After 10 updates, undo 5 times, then reload
// Result: State is at value after undo (correct)
// But: canUndo() returns false (no history)
```

**Reason:** Undo history is kept in memory only. Only the current state is persisted.

### 3. Omit on Top-Level Fields

When using `omit` on top-level fields, the initial value is preserved:

```typescript
// omit: ['secret']
// Initial: { data: '', secret: 'default-secret' }
// Stored: { data: 'important' } // secret is omitted
// On load: { data: 'important', secret: 'default-secret' }
```

**This is expected:** Omit prevents saving, not loading. Initial values remain.

---

## New Tests Added

### `indexeddb-integration.test.ts` (21 tests)

Comprehensive integration tests covering:

| Feature Combination | Tests |
|---------------------|-------|
| IndexedDB + Compression | 2 |
| IndexedDB + TTL | 2 |
| IndexedDB + Migrations | 2 |
| IndexedDB + Custom Serialize | 1 |
| IndexedDB + Pick/Omit | 2 |
| IndexedDB + UndoRedo | 2 |
| IndexedDB + Debounce | 2 |
| IndexedDB + onReady | 2 |
| IndexedDB + Multiple Reactors | 1 |
| IndexedDB + Large State | 2 |
| IndexedDB Error Handling | 1 |
| All Features Combined | 2 |

**Total Tests:** 505 (was 501)

---

## What Stays (Not Touched)

These are valuable and well-implemented:

- **Core reactor** - Heart of the library
- **DevTools** - Essential for debugging
- **Persist plugin** - Essential for storage
- **UndoRedo plugin** - Commonly used
- **Logger plugin** - Simple, useful
- **IndexedDB storage** - Needed for large state (now fixed!)
- **simpleStore / persistedStore** - Clean APIs
- **computedStore** - Performance optimization

---

## Moved to v0.3.0

These features from old v0.2.9 plan move to v0.3.0:

- State Snapshots API
- Performance Monitoring Plugin
- Validation Plugin
- Form Helpers
- SSR Improvements

v0.3.0 will add features on a CLEAN foundation.
