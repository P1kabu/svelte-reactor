# Upgrade Guide: v0.2.5 - "Polish & Power"

**Release Date:** January 24, 2025
**Status:** ✅ Released

---

## Overview

Version 0.2.5 focuses on performance, new features, and developer experience improvements. This release includes selective subscriptions, computed stores, critical path optimizations, and comprehensive documentation updates.

### Key Highlights

- 🎯 **Selective Subscriptions** - Subscribe to specific state parts (callback only fires when selected value changes)
- 📊 **Computed Stores** - Memoized computed state with dependency tracking (2-10x faster)
- ⚡ **Performance Optimizations** - Critical path optimizations for 2-10x faster operations
- 📦 **25% Smaller Bundle** - Reduced from 14.68 KB to 11.04 KB gzipped
- ✅ **475 tests** (+149 new) - All features thoroughly tested

---

## What's New

### 1. Selective Subscriptions (Phase 3.1)

Subscribe to specific parts of state for better performance. The callback only fires when the selected value changes.

```typescript
import { createReactor, isEqual } from 'svelte-reactor';

const store = createReactor({
  user: { name: 'John', age: 30 },
  count: 0
});

// Subscribe only to user.name
store.subscribe({
  selector: state => state.user.name,
  onChanged: (name, prevName) => {
    console.log(`Name: ${prevName} → ${name}`);
  }
});

store.update(s => { s.count++; });        // ❌ Callback NOT called
store.update(s => { s.user.age = 31; });  // ❌ Callback NOT called
store.update(s => { s.user.name = 'Jane'; }); // ✅ Callback called!
```

**Options:**
- `selector` - Function to extract specific part of state
- `onChanged` - Callback with (newValue, prevValue) when selected value changes
- `fireImmediately` - Call callback immediately with initial value (default: `true`)
- `equalityFn` - Custom equality comparison (default: `===`)

**Use Cases:**
- Form field validation (only validate the field that changed)
- Component optimization (component only needs specific state slice)
- Expensive computations (only recompute when dependencies change)

### 2. Computed Stores (Phase 3.2)

Memoized computed state with dependency tracking. Only recomputes when specified dependencies change.

```typescript
import { createReactor, computedStore, isEqual } from 'svelte-reactor';

const store = createReactor({
  items: [
    { id: 1, name: 'Apple', done: false },
    { id: 2, name: 'Banana', done: true }
  ],
  filter: 'all',
  metadata: { lastUpdated: Date.now() }
});

// Computed store - only recalculates when items or filter change
const filteredItems = computedStore(
  store,
  state => {
    if (state.filter === 'completed') return state.items.filter(item => item.done);
    if (state.filter === 'active') return state.items.filter(item => !item.done);
    return state.items;
  },
  {
    keys: ['items', 'filter']  // Only recompute when these change
  }
);

// Use like any Svelte store
filteredItems.subscribe(items => console.log(items));
$: items = $filteredItems;  // Works in Svelte components

// Updating metadata doesn't trigger recomputation! 🚀
store.update(s => { s.metadata.lastUpdated = Date.now(); });
```

**Options:**
- `keys` - Dependency tracking (only recompute when specified fields change)
- `equals` - Custom result equality (prevents updates if result is deeply equal)

**Features:**
- ⚡ 2-10x faster for expensive computations
- 🎯 Fine-grained dependency tracking
- 📦 Stable references (prevents re-renders)
- 🔗 Works with `derived()`, `get()`, and all Svelte APIs

### 3. Performance Optimizations (Phase 4.3)

Critical path optimizations for faster state updates:

- Optimized `smartClone()` for hot path (2x faster for simple objects)
- Inlined critical type checks (removes function call overhead)
- Pre-allocated arrays in batch operations (10x faster for large batches)
- Specialized clone paths for common patterns
- Zero overhead for simple updates (primitives, flat objects)

**Result:** 2-10x faster for critical operations

### 4. Batch Utilities

New batch helper functions for optimized state updates:

```typescript
import { batch, batchAll, batched, debouncedBatch } from 'svelte-reactor';

// Batch updates for a single reactor
batch(store, () => {
  store.update(s => { s.count++; });
  store.update(s => { s.name = 'John'; });
  store.update(s => { s.age = 30; });
}); // Only 1 notification to subscribers!

// Batch updates across multiple reactors
batchAll([store1, store2, store3], () => {
  store1.update(s => { s.value++; });
  store2.update(s => { s.data = 'new'; });
  store3.update(s => { s.items.push(item); });
}); // All 3 update atomically!

// Create a batched version of any function
const batchedUpdate = batched((data) => {
  store.update(s => { s.data = data; });
});
batchedUpdate('a');
batchedUpdate('b'); // These happen in a batch

// Debounced batch updates
debouncedBatch(store, 100, () => {
  store.update(s => { s.value++; });
});
```

### 5. Bundle Size Reduction

Bundle size reduced by 24.8% through:

- Core optimizations: -2.5 KB
- Tree-shaking improvements: -1.14 KB
- Minification enabled
- **Result:** 14.68 KB → **11.04 KB gzipped**

---

## Breaking Changes

**None!** This release is fully backward compatible.

---

## Migration Guide

### If you're using standard subscriptions

No changes required. All existing code continues to work.

### If you want to optimize subscriptions

Replace standard subscriptions with selective subscriptions:

**Before:**
```typescript
store.subscribe(state => {
  if (state.user.name !== prevName) {
    console.log(state.user.name);
    prevName = state.user.name;
  }
});
```

**After:**
```typescript
store.subscribe({
  selector: state => state.user.name,
  onChanged: (name) => console.log(name)
});
```

### If you're using derived() for expensive computations

Replace with `computedStore()` for better performance:

**Before:**
```typescript
const filtered = derived(store, $store => {
  // This runs on EVERY state change
  return expensiveFilter($store.items);
});
```

**After:**
```typescript
const filtered = computedStore(
  store,
  state => expensiveFilter(state.items),
  { keys: ['items'] }  // Only recomputes when items change
);
```

---

## New Exports

```typescript
// Selective subscriptions (built-in)
import { createReactor } from 'svelte-reactor';

// Computed stores
import { computedStore } from 'svelte-reactor';

// Batch utilities
import { batch, batchAll, batched, debouncedBatch } from 'svelte-reactor';

// Utility for deep equality
import { isEqual } from 'svelte-reactor';
```

---

## Documentation Updates

All documentation has been comprehensively updated:

- **README.md** - Added selective subscriptions and computed stores sections
- **API.md** - Complete API documentation for new features
- **EXAMPLES.md** - 5 computed store patterns + 5 selective subscription patterns
- **AI Templates** - claude.md, cursor.md, copilot.md updated with v0.2.5 features

---

## Test Coverage

Test count increased from 326 to **475 tests** (+149 tests):

- +12 tests for selective subscriptions
- +14 tests for computed stores
- +8 tests for batch utilities
- +115 tests for performance optimizations and edge cases

All tests passing ✅

---

## Performance Benchmarks

### Bundle Size
- **v0.2.4:** 14.68 KB gzipped
- **v0.2.5:** 11.04 KB gzipped
- **Reduction:** -24.8%

### Computed Stores Performance
- **Without computedStore():** Recalculates on every state change
- **With computedStore():** Only recalculates when dependencies change
- **Performance gain:** 2-10x faster for expensive computations

### Batch Operations
- **Without batching:** N notifications for N updates
- **With batching:** 1 notification for N updates
- **Performance gain:** 10x faster for large batches

---

## FAQ

### Q: Is this release backward compatible?

**A:** Yes! All existing code continues to work without changes. New features are opt-in.

### Q: Should I migrate to computedStore()?

**A:** Only if you have expensive computations. For simple derivations, `derived()` is fine.

### Q: When should I use selective subscriptions?

**A:** When you want to optimize performance by only reacting to specific state changes (form validation, component optimization, etc.).

### Q: Do I need to update my imports?

**A:** No, unless you want to use the new features (`computedStore`, `batch`, etc.).

---

## Next Steps

1. Update svelte-reactor: `pnpm add svelte-reactor@latest`
2. Run your tests to ensure everything works
3. Consider using `computedStore()` for expensive computations
4. Consider using selective subscriptions for performance-critical components
5. Check out the updated documentation for examples

---

## Credits

Thanks to all contributors and users who provided feedback and bug reports!

**Full Changelog:** [CHANGELOG.md](../packages/reactor/CHANGELOG.md)
