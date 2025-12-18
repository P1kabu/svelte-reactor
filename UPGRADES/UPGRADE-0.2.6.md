# v0.2.6 - Hotfix

**Release Date:** November 25, 2025
**Type:** Hotfix

---

## Problem

Version 0.2.5 was published to npm **without the `dist/` folder**, making the package unusable:

```
Failed to resolve entry for package "svelte-reactor".
The package may have incorrect main/module/exports specified in its package.json.
```

## Solution

Republished the package with compiled files included.

## Changes

- Added `dist/` folder to npm package
- No code changes from v0.2.5

## Upgrade

```bash
npm install svelte-reactor@0.2.6
```

No code changes needed.
