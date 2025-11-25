# Upgrade Guide: v0.2.6 - "Emergency Fix"

**Release Date:** November 25, 2025
**Status:** ✅ Released
**Type:** 🚨 Critical Hotfix

---

## Overview

Version 0.2.6 is an **emergency hotfix** that fixes a critical publishing issue in v0.2.5.

### What Went Wrong in v0.2.5

The package `svelte-reactor@0.2.5` was published **without compiled files** in the `dist/` folder. This made the package completely unusable - all imports failed with:

```
Failed to resolve entry for package "svelte-reactor".
The package may have incorrect main/module/exports specified in its package.json.
```

### What's Fixed in v0.2.6

✅ **Complete build included** - The `dist/` folder is now properly included in the published package
✅ **All entry points work** - All exports (core, plugins, helpers, devtools, utils) now resolve correctly
✅ **No other changes** - This is purely a republish of v0.2.5 with the build artifacts

---

## Migration Guide

### From v0.2.3 or earlier → v0.2.6

No code changes needed! Simply update:

```bash
npm install svelte-reactor@0.2.6
# or
pnpm add svelte-reactor@0.2.6
```

### From v0.2.5 → v0.2.6

If you had issues with v0.2.5, just update:

```bash
npm install svelte-reactor@0.2.6
# or
pnpm add svelte-reactor@0.2.6
```

**No code changes needed!** This is a drop-in replacement.

---

## What's Included (from v0.2.5)

All v0.2.5 features are included:
- ✅ computedStore() helper for memoized computed state
- ✅ Selective subscriptions API
- ✅ All documentation updates
- ✅ Bundle size optimizations

See [v0.2.5 changelog](../packages/reactor/CHANGELOG.md) for full details.

---

## Apology

We sincerely apologize for the v0.2.5 publishing error. We've updated our release process to prevent this from happening again:

1. ✅ Added pre-publish verification script
2. ✅ Updated CI/CD to test the published package
3. ✅ Added manual verification checklist

---

## Next Release

The **real v0.2.6** with new features will be renamed to **v0.2.7** and will include:
- 🐛 Real compression implementation
- 💾 Memory storage implementation
- 💬 Professional error messages
- 📚 Enhanced documentation

See [UPGRADE-0.2.7.md](./UPGRADE-0.2.7.md) for details (coming soon).
