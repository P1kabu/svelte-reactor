# Upgrade Guide: v0.2.8 - "Developer Experience"

**Release Date:** December 27, 2025
**Status:** ✅ Complete
**Type:** DX & Documentation Release

---

## Overview

Version 0.2.8 focuses on **Developer Experience** improvements, fixing the critical `.value` vs `.get()` confusion issue and completing documentation.

### Highlights

- **⚠️ `.value` deprecation warning** - Helps users migrating from other libraries
- **📚 Complete API documentation** - Full `.get()` examples for simpleStore/persistedStore
- **📦 Lazy lz-string loading** - Better tree-shaking when compression not used
- **✅ 501 tests** - All features thoroughly tested

---

## Completed

### Phase 1: `.value` Deprecation ✅

#### 1.1 Add `.value` deprecation warning ✅

**File:** `packages/reactor/src/helpers/value-store-factory.ts`

Added `Object.defineProperty(store, 'value', {...})` with:
- `console.warn()` deprecation message
- `enumerable: false` to hide from autocomplete
- Returns `.get()` value for backward compatibility

#### 1.2 Tests for deprecation ✅

**File:** `packages/reactor/tests/value-deprecation.test.ts`

Created 15 tests covering:
- `.value` returns correct value
- Deprecation warning logged
- `.value` hidden from Object.keys()
- Works with simpleStore and persistedStore
- TypeScript compatibility

---

### Phase 2: Documentation ✅

#### 2.1 Update API.md ✅

Added sections for simpleStore and persistedStore with explicit `.get()` examples.

#### 2.2 Add comparison table to README.md ✅

| Store type | Write | Update | Read (non-reactive) | Read (reactive) |
|------------|-------|--------|---------------------|-----------------|
| `simpleStore` | `.set(val)` | `.update(fn)` | `.get()` | `$store` |
| `persistedStore` | `.set(val)` | `.update(fn)` | `.get()` | `$store` |
| `createReactor` | `.set(obj)` | `.update(fn)` | `.state` | `.state` |

#### 2.3 Update QUICK_START.md ✅

Added `.get()` examples in usage section.

#### 2.4 Update AI templates ✅

Updated all AI templates with `.get()` examples and `.value` deprecation warning:
- `templates/claude.md`
- `templates/cursor.md`
- `templates/copilot.md`

---

### Phase 3: Bundle Size Optimization ✅

#### 3.1 Lazy import lz-string ✅

**File:** `packages/reactor/src/plugins/persist-plugin.ts`

lz-string is now loaded dynamically only when `compress: true` is used:
- Separate chunk for lz-string (2.16 KB gzipped)
- Pre-loaded when persist() is called with compress: true
- Fallback to uncompressed if lz-string not loaded yet

#### Bundle Size Results

| Component | Size (gzipped) |
|-----------|----------------|
| Main bundle | 11.67 KB |
| lz-string chunk | 2.16 KB |
| persist-plugin | 4.05 KB |

---

### Phase 4: Release ✅

#### 4.1 Updated CHANGELOG.md ✅

Added v0.2.8 changelog entry.

#### 4.2 Bumped version ✅

Changed version in package.json to 0.2.8

#### 4.3 All tests pass ✅

```
Test Files: 30 passed
Tests: 501 passed
```

---

## Files Modified

| File | Description |
|------|-------------|
| `src/helpers/value-store-factory.ts` | Added `.value` deprecation |
| `tests/value-deprecation.test.ts` | 15 tests for deprecation |
| `API.md` | Added simpleStore/persistedStore docs |
| `README.md` | Added comparison table |
| `QUICK_START.md` | Added `.get()` examples |
| `templates/claude.md` | Updated AI instructions |
| `templates/cursor.md` | Updated AI instructions |
| `templates/copilot.md` | Updated AI instructions |
| `src/plugins/persist-plugin.ts` | Lazy lz-string loading |
| `tests/compression.test.ts` | Updated for async lz-string |
| `CHANGELOG.md` | Added v0.2.8 entry |
| `package.json` | Bumped to 0.2.8 |

---

## Breaking Changes

**None.** v0.2.8 is fully backward compatible.

### Deprecation Notices

| Deprecated | Alternative | Will be removed |
|------------|-------------|-----------------|
| `.value` property | `.get()` method | v0.4.0 |

---

## Migration Guide

### From v0.2.7

No migration needed. v0.2.8 is a drop-in replacement.

### `.value` users

If you're using `.value` to read store values, you'll see a deprecation warning in console:

```typescript
// Before (deprecated, shows warning)
const count = counter.value;

// After (recommended)
const count = counter.get();

// In Svelte components (also correct)
{$counter}
```

---

## Quick Reference

```bash
# Install
npm install svelte-reactor@0.2.8

# Run tests
cd packages/reactor && pnpm test

# Build
pnpm build
```
