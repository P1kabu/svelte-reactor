# Upgrade Guide: v0.2.7 - "Performance & Polish"

**Target Release:** December 2025
**Status:** ✅ Released
**Type:** 🔥 Major Performance & Quality Release

---

## Overview

Version 0.2.7 is a **critical quality release** focused on fixing performance issues, eliminating dead code, improving API consistency, and adding missing test coverage. This release sets the foundation for v1.0.

### Goals

1. **Fix Critical Performance Issues** - DevTools polling, excessive cloning
2. **Remove Dead Code** - Unused diff utility, code duplication
3. **Improve API Consistency** - Unified helper patterns
4. **Add Missing Tests** - Memory leaks, race conditions, SSR
5. **Better Error Handling** - Professional error messages with context
6. **Bundle Size Reduction** - Target: < 10 KB gzipped

---

## Phase 1: Critical Bug Fixes 🚨

### 1.1 Fix DevTools Polling (CRITICAL)

**Problem:** DevTools `subscribe()` uses `setInterval` every 100ms, causing:
- Memory leak (continuous cloning)
- Performance degradation
- Battery drain on mobile

**Current Code (devtools.ts:154-156):**
```typescript
// BAD: Polling every 100ms regardless of changes
const interval = setInterval(() => {
  callback(reactor.inspect()); // Full clone every 100ms!
}, 100);
```

**Solution:** Use real subscription instead of polling:
```typescript
function subscribe(callback: (inspection: ReactorInspection<T>) => void): () => void {
  // Use reactor's native subscription - only fires on actual changes
  return reactor.subscribe((state) => {
    callback(reactor.inspect());
  });
}
```

**Impact:**
- Eliminates unnecessary CPU usage
- Fixes memory leak
- Only fires when state actually changes

---

### 1.2 Fix Excessive Cloning in Subscribers (CRITICAL)

**Problem:** `notifySubscribers()` creates new clones for each operation:

**Current Code (reactor.svelte.ts:97-117):**
```typescript
function notifySubscribers(nextState: T, prevState: T, action?: string): void {
  const stateClone = smartClone(nextState);

  subscribers.forEach((subscriber) => {
    subscriber(stateClone); // OK - shared clone
  });

  if (onChange) {
    onChange(stateClone, smartClone(prevState), action);
    //                    ^ EXTRA CLONE! Should reuse
  }
}
```

**Solution:** Create clones once and reuse:
```typescript
function notifySubscribers(nextState: T, prevState: T, action?: string): void {
  const nextClone = smartClone(nextState);
  const prevClone = smartClone(prevState); // Clone once

  subscribers.forEach((subscriber) => {
    subscriber(nextClone);
  });

  if (onChange) {
    onChange(nextClone, prevClone, action); // Reuse clones
  }
}
```

**Impact:** ~50% reduction in cloning operations

---

### 1.3 Fix Race Conditions in Async Actions

**Problem:** Concurrent async operations can cause state corruption.

**Solution:**
- Proper AbortController management
- Request ID tracking to ignore stale responses
- Option to queue or replace concurrent requests

```typescript
interface AsyncActionsOptions {
  // ... existing options

  /** How to handle concurrent requests */
  concurrency?: 'replace' | 'queue' | 'parallel';
}
```

---

## Phase 2: Dead Code Removal 🧹

### 2.1 Remove Unused diff.ts Utility

**Analysis:** `diff.ts` (211 lines) is exported but NEVER used internally:
- Not used in core reactor
- Not used in plugins
- Not used in helpers
- Only exported for "potential future DevTools features"

**Decision:** Remove from core, make available as optional import

**Action:**
1. Move `diff.ts` to `svelte-reactor/utils/diff` (optional)
2. Remove from main bundle
3. Document as advanced utility

**Impact:** -211 lines, ~500 bytes gzip savings

---

### 2.2 Eliminate Code Duplication in Helpers

**Problem:** `simpleStore` and `persistedStore` have identical logic:

```typescript
// Both have this exact same code:
subscribe: (subscriber: Subscriber<T>) => {
  return reactor.subscribe((state) => {
    subscriber(state.value);
  });
}
```

**Solution:** Create shared `createValueStore` factory:

```typescript
// New: src/helpers/value-store-factory.ts
export function createValueStoreFromReactor<T>(
  reactor: Reactor<{ value: T }>
): WritableStore<T> {
  return {
    subscribe: (subscriber) => reactor.subscribe(s => subscriber(s.value)),
    set: (value) => reactor.set({ value }),
    update: (updater) => reactor.update(s => { s.value = updater(s.value); }),
    get: () => reactor.state.value,
  };
}
```

**Impact:** -50 lines of duplication

---

## Phase 3: Performance Optimizations ⚡

### 3.1 Optimize Path Utilities

**Problem:** `omit()` uses `JSON.parse(JSON.stringify())` for cloning:

```typescript
// Current (slow):
export function omit(obj: any, paths: string[]): any {
  const result = JSON.parse(JSON.stringify(obj)); // Full serialization!
  for (const path of paths) {
    deletePath(result, path);
  }
  return result;
}
```

**Solution:** Use efficient selective cloning:

```typescript
export function omit(obj: any, paths: string[]): any {
  const pathSet = new Set(paths);
  return deepCloneExcept(obj, pathSet);
}

function deepCloneExcept(obj: any, excludePaths: Set<string>, currentPath = ''): any {
  // Clone only what's needed, skip excluded paths
}
```

**Impact:** 3-5x faster for large objects with few exclusions

---

### 3.2 Add Memoization to getHistory()

**Problem:** Every `getHistory()` call creates new arrays:

```typescript
function getHistory(): HistoryEntry<T>[] {
  const inspection = reactor.inspect(); // Full clone!
  return inspection.history.past;       // New array!
}
```

**Solution:** Cache history with invalidation on change:

```typescript
let cachedHistory: HistoryEntry<T>[] | null = null;
let historyVersion = 0;

function getHistory(): HistoryEntry<T>[] {
  if (cachedHistory && currentVersion === historyVersion) {
    return cachedHistory;
  }
  cachedHistory = reactor.inspect().history.past;
  historyVersion = currentVersion;
  return cachedHistory;
}
```

---

### 3.3 Lazy-Load DevTools

**Problem:** DevTools code included even when not used.

**Solution:** Make DevTools a separate entry point with lazy loading:

```typescript
// Main bundle - no DevTools
import { createReactor } from 'svelte-reactor';

// DevTools only when needed
import { createDevTools } from 'svelte-reactor/devtools';

// Or auto-detect in development
const reactor = createReactor(state, {
  devtools: import.meta.env.DEV, // Tree-shakes in production
});
```

---

## Phase 4: API Improvements 🎯

### 4.1 Unified Helper API Patterns

**Problem:** Helpers have inconsistent APIs:

| Helper | Returns | Pattern |
|--------|---------|---------|
| `simpleStore` | WritableStore | get/set/subscribe |
| `persistedStore` | WritableStore | get/set/subscribe |
| `arrayActions` | Object | mutation methods |
| `asyncActions` | Object | wrapped async functions |
| `computedStore` | Readable | subscribe only |

**Solution:** Document 3 clear patterns:

1. **Value Stores** - `get()`, `set()`, `update()`, `subscribe()`
2. **Action Objects** - Methods that mutate state
3. **Computed** - Read-only derived state

Add TypeScript helper types:
```typescript
type ValueStore<T> = {
  get(): T;
  set(value: T): void;
  update(updater: (value: T) => T): void;
  subscribe(subscriber: Subscriber<T>): Unsubscriber;
};

type ActionObject<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : never;
};
```

---

### 4.2 Improve Selective Subscribe API

**Problem:** Current overloaded subscribe is complex:

```typescript
// Two different signatures - confusing
reactor.subscribe((state) => {});
reactor.subscribe({ selector, onChanged });
```

**Solution:** Add explicit method:

```typescript
// Keep existing for compatibility
reactor.subscribe((state) => {});

// New: Explicit selective subscribe
reactor.select(
  state => state.user.name,
  (name, prevName) => console.log(`Changed: ${prevName} → ${name}`)
);

// Or with path string (type-safe)
reactor.select('user.name', (name, prevName) => {});
```

---

### 4.3 Add Fluent Batch API

**New Feature:** Chain multiple updates elegantly:

```typescript
// Current (verbose)
reactor.batch(() => {
  reactor.update(s => { s.count++; });
  reactor.update(s => { s.name = 'John'; });
  reactor.update(s => { s.active = true; });
});

// New (fluent)
reactor.batch()
  .set('count', s => s.count + 1)
  .set('name', 'John')
  .set('active', true)
  .commit();
```

---

## Phase 5: Professional Error Messages 💬

### 5.1 Create ReactorError Class

```typescript
export class ReactorError extends Error {
  constructor(
    message: string,
    public readonly context: {
      reactor?: string;
      action?: string;
      plugin?: string;
      state?: unknown;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'ReactorError';
  }

  toString(): string {
    const ctx = this.context;
    let msg = `[Reactor${ctx.reactor ? `:${ctx.reactor}` : ''}] ${this.message}`;

    if (ctx.action) msg += `\n  Action: ${ctx.action}`;
    if (ctx.plugin) msg += `\n  Plugin: ${ctx.plugin}`;
    if (ctx.cause) msg += `\n  Caused by: ${ctx.cause.message}`;

    return msg;
  }
}
```

### 5.2 Contextual Error Messages

**Before:**
```
TypeError: Cannot read property 'value' of undefined
```

**After:**
```
[Reactor:counter] Update failed

  Action: increment
  Error: Cannot read property 'value' of undefined

  Current State:
    { count: 0, user: null }

  Tip: Check if 'user' is initialized before accessing 'user.value'.

  Stack trace:
    at increment (src/stores/counter.ts:15:12)
```

---

## Phase 6: Test Coverage 🧪

### 6.1 Memory Leak Tests

```typescript
describe('Memory Management', () => {
  it('should cleanup all subscribers on destroy', () => {
    const reactor = createReactor({ value: 0 });
    const subscribers: Function[] = [];

    // Add 100 subscribers
    for (let i = 0; i < 100; i++) {
      reactor.subscribe(() => {});
    }

    reactor.destroy();

    // Verify cleanup
    expect(reactor.inspect().subscribers).toBe(0);
  });

  it('should not leak memory with persist plugin', async () => {
    const reactor = createReactor({ value: 0 }, {
      plugins: [persist({ key: 'test' })]
    });

    reactor.destroy();

    // Verify storage listener removed
    expect(window.listeners('storage')).toHaveLength(0);
  });
});
```

### 6.2 Race Condition Tests

```typescript
describe('Race Conditions', () => {
  it('should handle concurrent async operations', async () => {
    const reactor = createReactor({ result: null });
    const api = asyncActions(reactor, {
      fetch: async (id: number) => {
        await delay(100 - id * 10); // Earlier calls are slower
        return { result: id };
      }
    });

    // Start 3 concurrent requests
    const p1 = api.fetch(1);
    const p2 = api.fetch(2);
    const p3 = api.fetch(3);

    await Promise.all([p1, p2, p3]);

    // Last request should win
    expect(reactor.state.result).toBe(3);
  });
});
```

### 6.3 SSR Edge Cases

```typescript
describe('SSR Compatibility', () => {
  it('should work without window', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const reactor = createReactor({ value: 0 }, {
      plugins: [persist({ key: 'test', storage: 'memory' })]
    });

    expect(reactor.state.value).toBe(0);

    global.window = originalWindow;
  });
});
```

### 6.4 Performance Regression Tests

```typescript
describe('Performance', () => {
  it('should handle 10000 updates efficiently', () => {
    const reactor = createReactor({ count: 0 });

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      reactor.update(s => { s.count++; });
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // < 1 second
    expect(reactor.state.count).toBe(10000);
  });
});
```

---

## Phase 7: Bundle Optimization 📦

### 7.1 Target Bundle Sizes

| Entry Point | Current | Target | Savings |
|-------------|---------|--------|---------|
| Core | 10.66 KB | 9.5 KB | -11% |
| Plugins | 2.56 KB | 2.2 KB | -14% |
| Helpers | ~3 KB | 2.5 KB | -17% |
| **Total** | **~16 KB** | **~14 KB** | **-12%** |

### 7.2 Optimization Strategies

1. **Remove diff.ts** from main bundle (-500 bytes)
2. **Eliminate duplication** in helpers (-200 bytes)
3. **Lazy-load DevTools** (-400 bytes when unused)
4. **Optional compression** import (-300 bytes when unused)
5. **Tree-shake unused exports** (-200 bytes)

---

## Breaking Changes ⚠️

### Minimal Breaking Changes

This release aims for **backward compatibility** with deprecation warnings:

1. **DevTools subscribe()** - Now fires only on changes (better behavior)
2. **diff utility** - Moved to optional import (rarely used)

### Migration

```typescript
// If you import diff utilities directly:
// Before
import { diff, applyPatch } from 'svelte-reactor/utils';

// After
import { diff, applyPatch } from 'svelte-reactor/utils/diff';
```

---

## Phase 8: AI Instructions Optimization 🤖

### 8.1 Problem Analysis

**Issue:** All three AI instruction files (claude.md, cursor.md, copilot.md) were identical at 810 lines each, wasting tokens and not leveraging each AI's unique capabilities.

### 8.2 Solution: Separate Optimized Files

| File | Before | After | Reduction | Focus |
|------|--------|-------|-----------|-------|
| claude.md | 810 lines | 212 lines | -74% | XML tags, structured instructions |
| cursor.md | 810 lines | 192 lines | -76% | IDE context, code generation |
| copilot.md | 810 lines | 94 lines | -88% | Inline completions, concise patterns |
| **Total** | 2430 lines | 498 lines | **-79%** | Each AI's strengths |

### 8.3 Key Optimizations

1. **Removed version history notes** - AI doesn't need to know what changed between versions
2. **Eliminated redundant examples** - Kept only essential patterns
3. **AI-specific formatting**:
   - **Claude**: XML tags for structure (`<core-api>`, `<plugins>`, etc.)
   - **Cursor**: Quick reference format for IDE integration
   - **Copilot**: Ultra-concise code patterns for autocomplete
4. **Removed "when to use" explanations** - Keep only the "how to use"
5. **Consolidated similar examples** - One example per concept

---

## Implementation Checklist

### Phase 1: Critical Fixes
- [x] Fix DevTools polling → real subscription
- [x] Fix excessive cloning in notifySubscribers
- [x] Fix race conditions in asyncActions (added `concurrency` option)

### Phase 2: Dead Code Removal
- [x] Move diff.ts to optional import (`svelte-reactor/utils/diff`)
- [x] Create value store factory (eliminated ~50 lines of duplication)
- [x] Remove duplicate code

### Phase 3: Performance
- [x] Optimize path utilities (omit uses smartClone now)
- [x] Add memoization to getHistory()
- [ ] Lazy-load DevTools (deferred to future release)

### Phase 4: API Improvements
- [x] Add `reactor.select()` method
- [ ] Add fluent batch API (deferred to future release)
- [ ] Document helper patterns (deferred to future release)

### Phase 5: Error Messages
- [x] Create ReactorError class with rich context
- [x] Add context to all errors (reactor name, action, plugin, tip)
- [x] Add helpful tips via static methods

### Phase 6: Tests
- [x] Race condition tests for asyncActions
- [x] reactor.select() tests
- [x] ReactorError tests
- [ ] Memory leak tests (partial - existing tests cover cleanup)
- [ ] SSR edge case tests (existing tests cover basic SSR)

### Phase 7: Bundle
- [x] Core bundle optimized (removed diff from main bundle)
- [x] Verify tree-shaking works
- [ ] Achieve < 10 KB core bundle (current: ~11.5 KB gzip total)

### Phase 8: AI Instructions
- [x] Analyze AI instruction files (3 identical files × 810 lines)
- [x] Create optimized claude.md (212 lines, XML structure)
- [x] Create optimized cursor.md (192 lines, IDE focus)
- [x] Create optimized copilot.md (94 lines, inline completions)
- [x] Total reduction: 79% (2430 → 498 lines)

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Core bundle size | 10.66 KB | ~11.5 KB | < 10 KB |
| Test coverage | 475 tests | 486 tests | 550+ tests |
| Memory leaks | Unknown | Improved | 0 |
| DevTools CPU usage | High (polling) | Minimal (subscription) | ✅ |
| API consistency | Mixed | Improved (select() added) | Documented patterns |
| AI instructions | 2430 lines | 498 lines | ✅ -79% |

---

## Timeline

1. **Phase 1-2** (Critical Fixes + Dead Code): Week 1
2. **Phase 3-4** (Performance + API): Week 2
3. **Phase 5-6** (Errors + Tests): Week 3
4. **Phase 7** (Bundle + Polish): Week 4
5. **Release**: End of December 2025

---

## Future Roadmap (v0.3.0+)

After v0.2.7 stabilizes:

- 🎨 **Visual DevTools** - Browser extension for debugging
- 🔄 **Improved Multi-Tab Sync** - Conflict resolution
- 📱 **React Native Support** - Cross-platform state
- 🧩 **Plugin Ecosystem** - Community plugins
- 🌐 **Internationalization** - i18n helper

---

## Appendix: Full Analysis Results

See [ANALYSIS-0.2.7.md](./ANALYSIS-0.2.7.md) for the complete code analysis that informed this plan.
