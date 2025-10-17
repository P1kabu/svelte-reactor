# Upgrade to v0.2.2

## Overview

Version 0.2.2 includes **critical bug fixes**, performance optimizations, improved error handling, and documentation improvements. This release focuses on fixing memory leaks, optimizing state updates, and providing better developer experience through enhanced error messages.

## What's New in 0.2.2

### 🔧 Critical Bug Fixes

#### 1. Memory Leaks in Core Reactor (CRITICAL)

**Problem:** Subscribers and middlewares were not properly cleared when reactor was destroyed, leading to memory leaks in applications that create and destroy reactors dynamically.

**Solution:** Added proper cleanup in `destroy()` method.

**Impact:**
- ✅ Subscribers Set is now properly cleared on destroy()
- ✅ Middlewares array is now properly cleared on destroy()
- ✅ Prevents memory leaks when reactors are destroyed and recreated
- ✅ +2 new tests for memory leak detection

**Files changed:**
- `packages/reactor/src/core/reactor.svelte.ts:315-318` - Added subscribers.clear() and middlewares cleanup
- `packages/reactor/tests/reactor.test.ts:183-218` - Added memory leak tests

**Before:**
```typescript
function destroy(): void {
  // Plugins cleanup
  for (const plugin of plugins) {
    plugin.destroy?.();
  }

  // history?.clear(); // Only history was cleared
}
```

**After:**
```typescript
function destroy(): void {
  // Plugins cleanup
  for (const plugin of plugins) {
    plugin.destroy?.();
  }

  // Clear subscribers to prevent memory leaks
  subscribers.clear();

  // Clear middlewares
  middlewares.length = 0;

  // Clear history
  history?.clear();
}
```

---

#### 2. Performance: Unnecessary Re-renders

**Problem:** State updates that didn't actually change anything still triggered middlewares, history updates, and subscriber notifications, causing unnecessary re-renders.

**Solution:** Added deep equality check before processing state changes.

**Impact:**
- ✅ Skip update if state hasn't actually changed
- ✅ Improves performance by avoiding unnecessary re-renders
- ✅ Uses existing `isEqual()` utility for reliable deep comparison
- ✅ +3 new tests for shallow comparison optimization

**Files changed:**
- `packages/reactor/src/core/reactor.svelte.ts:15` - Import isEqual
- `packages/reactor/src/core/reactor.svelte.ts:148-151` - Added equality check
- `packages/reactor/tests/reactor.test.ts:220-276` - Added optimization tests

**Example:**
```typescript
const counter = createReactor({ value: 5 });

// Before v0.2.2: This would trigger subscribers even though nothing changed
counter.update(state => {
  state.value = 5; // Same value!
});

// After v0.2.2: No subscribers called, no re-render
```

---

#### 3. Error Handling & Validation

**Problem:** Invalid inputs could cause confusing errors or silent failures. Error messages lacked context.

**Solution:** Added comprehensive input validation and improved error messages.

**Impact:**
- ✅ Validation for createReactor initialState (must be non-null object)
- ✅ Validation for reactor name (must be non-empty string)
- ✅ Validation for subscribe() parameter (must be function)
- ✅ Validation for update() parameter (must be function)
- ✅ Validation for persist plugin options (key required, debounce >= 0)
- ✅ Error messages now include reactor name for easier debugging
- ✅ Persist plugin detects quota exceeded errors with helpful messages
- ✅ Persist plugin auto-cleans corrupted data
- ✅ +4 new tests for error handling

**Files changed:**
- `packages/reactor/src/core/reactor.svelte.ts:34-44` - Validation for initialState and name
- `packages/reactor/src/core/reactor.svelte.ts:118-124` - Validation for subscribe()
- `packages/reactor/src/core/reactor.svelte.ts:147-153` - Validation for update() and better error messages
- `packages/reactor/src/plugins/persist-plugin.ts:22-47` - Validation for persist options
- `packages/reactor/src/plugins/persist-plugin.ts:105-113` - Auto-cleanup corrupted data
- `packages/reactor/src/plugins/persist-plugin.ts:152-165` - Quota exceeded detection
- `packages/reactor/tests/reactor.test.ts:278-339` - Error handling tests

**Examples:**

```typescript
// Invalid initialState
createReactor(null); // TypeError: initialState must be a non-null object

// Invalid name
createReactor({ count: 0 }, { name: '' }); // TypeError: name must be a non-empty string

// Invalid subscriber
reactor.subscribe('not a function'); // TypeError: subscribe() requires a function

// Invalid updater
reactor.update(null); // TypeError: update() requires a function

// Invalid persist options
persist({ debounce: -10 }); // TypeError: options.debounce must be a non-negative number
persist({}); // TypeError: options.key is required
```

**Better error messages:**
```typescript
// Before
// Error: Cannot update destroyed reactor

// After
// Warning: [Reactor:counter] Cannot update destroyed reactor. Reactor was destroyed at 2025-10-18T...

// Before
// Error: Update failed

// After
// Error: [Reactor:todos] Update failed (action: "add-todo"): ...
```

---

#### 4. persist plugin - Cross-Tab/Window Synchronization

**Problem:** Changes to state in one browser tab/window were not automatically reflected in other tabs/windows when using `localStorage`. Manual changes in DevTools were also not detected.

**Solution:** Added `storage` event listener to detect external storage changes.

**Impact:**
- ✅ Changes from other tabs are now automatically synced (localStorage)
- ✅ Manual changes in DevTools are now detected (both localStorage and sessionStorage)
- ✅ Proper cleanup of event listeners on destroy()
- ✅ Added 2 new tests for storage synchronization

**Example:**
```typescript
// Tab 1
const store = createReactor(
  { count: 0 },
  { plugins: [persist({ key: 'counter', storage: 'localStorage' })] }
);
store.update(s => { s.count = 5; });

// Tab 2 - automatically syncs!
// store.state.count === 5
```

**Files changed:**
- `packages/reactor/src/plugins/persist-plugin.ts:164-184` - Added storage event listener
- `packages/reactor/src/plugins/persist-plugin.ts:196-199` - Added cleanup in destroy()
- `packages/reactor/tests/persist.test.ts:101-167` - Added tests

---

### 📚 Documentation Improvements

#### 1. Fixed Broken Links in README

**Problem:** Links to API.md, EXAMPLES.md, and PERFORMANCE.md were broken in the published NPM package.

**Solution:** Added these files to the `files` array in package.json.

**Files changed:**
- `packages/reactor/package.json:45-47` - Added API.md, EXAMPLES.md, PERFORMANCE.md
- `packages/reactor/README.md:664-670` - Fixed CONTRIBUTING and LICENSE links

#### 2. Fixed Package README Links

**Problem:** Documentation links had confusing format with arrows.

**Solution:** Reformatted links for better readability.

**Before:**
```markdown
**→ [Full Svelte stores API](./QUICK_START.md#simple-counter-store)**
```

**After:**
```markdown
**→ [See full example in Quick Start](./QUICK_START.md#simple-counter-store)**
```

**Files changed:**
- `packages/reactor/README.md:165-245` - Updated all helper function links

---

### 🎨 Demo Examples Updates

#### 1. Added Redux DevTools Support

All demo examples now include:
```typescript
{
  name: 'counter',        // Identifies the store in DevTools
  devtools: true,         // Enables Redux DevTools integration
  plugins: [...]
}
```

#### 2. Fixed Svelte 5 Runes Usage

**Problem:** Incorrect usage of `$derived()` - should be `$derived.by()` for functions.

**Before:**
```svelte
let isFormValid = $derived(() => {
  return form.state.data.name.trim().length > 0;
});

<!-- Usage -->
<button disabled={!isFormValid()}>Submit</button>
```

**After:**
```svelte
let isFormValid = $derived.by(() => {
  return form.state.data.name.trim().length > 0;
});

<!-- Usage -->
<button disabled={!isFormValid}>Submit</button>
```

#### 3. Updated All Demos

**Counter.svelte:**
- Added `devtools: true`
- Fixed reset() to use update() with action name
- Updated code example in UI

**TodoApp.svelte:**
- Added `devtools: true`
- Fixed `$derived()` → `$derived.by()`
- Removed function calls from derived values in template
- Updated code example

**ContactForm.svelte:**
- Added `devtools: true`
- Fixed `$derived()` → `$derived.by()`
- Removed function calls from template
- Updated code example

**CanvasEditor.svelte:**
- Added `devtools: true`
- Updated code example

**App.svelte:**
- Fixed GitHub links (svelte-dev/reactor → P1kabu/svelte-reactor)

**Files changed:**
- `examples/reactor-demos/package.json:3` - Version 0.1.0 → 0.2.0
- `examples/reactor-demos/src/App.svelte:73,77` - Fixed GitHub links
- `examples/reactor-demos/src/demos/Counter.svelte:17,37-39,136-137` - Added devtools, fixed reset
- `examples/reactor-demos/src/demos/TodoApp.svelte:24,77-85,116-179,201-202` - Added devtools, fixed $derived
- `examples/reactor-demos/src/demos/ContactForm.svelte:31,92-108,184-218,236-237` - Added devtools, fixed $derived
- `examples/reactor-demos/src/demos/CanvasEditor.svelte:31,256-257` - Added devtools

---

### 🛠️ CLI Updates

**Files changed:**
- `packages/reactor/cli/index.js:12` - Updated version 0.2.1 → 0.2.2

---

### 📦 Package Updates

**Files changed:**
- `packages/reactor/package.json:3` - Updated version 0.2.1 → 0.2.2
- `packages/reactor/package.json:45-47` - Added docs to published files
- `packages/reactor/CHANGELOG.md:8-16` - Added 0.2.2 entry

---

## Migration Guide

### No Breaking Changes

Version 0.2.2 is fully backward compatible with v0.2.1. All existing code will continue to work without modifications.

### Recommended Updates

#### 1. Update to Latest Version

```bash
npm install svelte-reactor@latest
# or
pnpm add svelte-reactor@latest
# or
yarn add svelte-reactor@latest
```

#### 2. Enable Redux DevTools (Optional)

Add `devtools: true` to your reactor configuration for better debugging:

```typescript
const store = createReactor(
  initialState,
  {
    name: 'my-store',     // Identifies store in DevTools
    devtools: true,       // Enable Redux DevTools
    plugins: [...]
  }
);
```

#### 3. Add Action Names (Optional)

For better debugging in DevTools and logs:

```typescript
// Before
store.update(state => {
  state.count++;
});

// After
store.update(state => {
  state.count++;
}, 'increment');  // Shows as "increment" in DevTools
```

#### 4. Fix Svelte 5 Runes (If Applicable)

If you're using `$derived()` with functions, update to `$derived.by()`:

```svelte
<!-- Before -->
<script>
let isValid = $derived(() => validateForm());
</script>
<button disabled={!isValid()}>Submit</button>

<!-- After -->
<script>
let isValid = $derived.by(() => validateForm());
</script>
<button disabled={!isValid}>Submit</button>
```

---

## Testing

All changes are covered by tests:
- ✅ +2 tests for memory leak detection
- ✅ +3 tests for shallow comparison optimization
- ✅ +4 tests for error handling & validation
- ✅ +2 tests for storage synchronization
- ✅ All existing tests pass
- ✅ Total: 181 tests (was 172)

Run tests:
```bash
cd packages/reactor
pnpm test
```

---

## Files Changed Summary

### Core Package - Bug Fixes
- `packages/reactor/src/core/reactor.svelte.ts:15` - Import isEqual for comparison
- `packages/reactor/src/core/reactor.svelte.ts:34-44` - Validation for initialState and name
- `packages/reactor/src/core/reactor.svelte.ts:118-124` - Validation for subscribe()
- `packages/reactor/src/core/reactor.svelte.ts:147-153` - Validation for update() + equality check
- `packages/reactor/src/core/reactor.svelte.ts:186-189` - Better error messages for update
- `packages/reactor/src/core/reactor.svelte.ts:315-318` - Clear subscribers and middlewares on destroy
- `packages/reactor/src/plugins/persist-plugin.ts:22-47` - Validation for persist options
- `packages/reactor/src/plugins/persist-plugin.ts:105-113` - Auto-cleanup corrupted data
- `packages/reactor/src/plugins/persist-plugin.ts:152-165` - Quota exceeded detection
- `packages/reactor/src/plugins/persist-plugin.ts:170-186` - Storage event listener
- `packages/reactor/src/plugins/persist-plugin.ts:196-199` - Cleanup in destroy()
- `packages/reactor/tests/reactor.test.ts:182-340` - Added 9 new tests for bug fixes
- `packages/reactor/tests/persist.test.ts:101-167` - Added 2 tests for storage sync

### Core Package - Other Changes
- `packages/reactor/package.json:3` - Version bump 0.2.1 → 0.2.2
- `packages/reactor/package.json:45-47` - Added docs to published files
- `packages/reactor/CHANGELOG.md:10-40` - Added 0.2.2 entry with all fixes
- `packages/reactor/README.md:664-670` - Fixed links
- `packages/reactor/cli/index.js:12` - Version bump

### Documentation
- `README.md` - Major additions (Array Actions, Async Actions, Live Demo)

### Examples
- `examples/reactor-demos/package.json` - Version bump
- `examples/reactor-demos/src/App.svelte` - Fixed links
- `examples/reactor-demos/src/demos/Counter.svelte` - Added devtools, fixed reset
- `examples/reactor-demos/src/demos/TodoApp.svelte` - Added devtools, fixed $derived
- `examples/reactor-demos/src/demos/ContactForm.svelte` - Added devtools, fixed $derived
- `examples/reactor-demos/src/demos/CanvasEditor.svelte` - Added devtools

---

## What's Next?

### Already Available (Not Yet Released)
All the changes listed above are already in the codebase but not yet published to NPM.

### Planned for v0.2.3
- Additional helper improvements
- Performance optimizations
- More examples

### Planned for v0.3.0
- Multi-tab synchronization (BroadcastChannel API)
- Selectors API for computed state
- Additional storage adapters (IndexedDB)
- Visual DevTools UI

---

## Support

- **Documentation:** [GitHub README](https://github.com/P1kabu/svelte-reactor)
- **Issues:** [GitHub Issues](https://github.com/P1kabu/svelte-reactor/issues)
- **NPM:** [svelte-reactor](https://www.npmjs.com/package/svelte-reactor)

---

## Contributors

Thank you to everyone who contributed to this release!

---

**Full Changelog:** [CHANGELOG.md](./packages/reactor/CHANGELOG.md)
