# Svelte Reactor - Upgrade Guides

This directory contains detailed upgrade guides for migrating between versions of svelte-reactor.

## Available Guides

### Patch Releases

- **[v0.2.2](./UPGRADE-0.2.2.md)** - Bug fixes & stability improvements
  - Memory leak fixes (subscribers/middlewares cleanup)
  - Performance optimization (skip unchanged updates)
  - Enhanced error handling with context-aware messages
  - 181 tests passing

- **[v0.2.3](./UPGRADE-0.2.3.md)** - Feature enhancements
  - persist plugin: Selective persistence with `pick`/`omit`
  - arrayActions: Sorting and bulk operations
  - asyncActions: Retry logic and request cancellation
  - logger plugin: Advanced filtering options
  - 232 tests passing

- **[v0.2.4](./PLAN_v0.2.4.md)** - IndexedDB & DX improvements (Planned)
  - IndexedDB storage support (50+ MB)
  - TTL support for persist plugin
  - Pagination helper for arrayActions
  - ~280 tests planned
  - [Quick Summary](./PLAN_v0.2.4_SUMMARY.md)

## How to Use

1. Find your current version: `npm list svelte-reactor`
2. Open the upgrade guide for your target version
3. Follow the migration steps
4. Run tests to ensure everything works: `pnpm test`

## Version History

| Version | Release Date | Type | Key Changes |
|---------|--------------|------|-------------|
| v0.2.3 | 2025-11-10 | Patch | Feature enhancements |
| v0.2.2 | 2025-10-18 | Patch | Bug fixes & stability |
| v0.2.1 | 2025-10-17 | Patch | Async actions helper |
| v0.2.0 | 2025-10-16 | Minor | Array actions helper |
| v0.1.x | 2024-2025 | Initial | Initial releases |

## Migration Path

For multi-version upgrades, follow the guides sequentially:

```bash
# Example: Upgrading from v0.2.1 to v0.2.3
1. Read UPGRADE-0.2.2.md (v0.2.1 → v0.2.2)
2. Apply changes and test
3. Read UPGRADE-0.2.3.md (v0.2.2 → v0.2.3)
4. Apply changes and test
```

## Breaking Changes

We follow [Semantic Versioning](https://semver.org/):
- **Patch** (0.0.x): Bug fixes, no breaking changes
- **Minor** (0.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

All patch and minor releases are **backwards compatible** - existing code will continue to work.

## Need Help?

- Check the [full documentation](../packages/reactor/README.md)
- Review [API documentation](../packages/reactor/API.md)
- See [migration guide](../packages/reactor/MIGRATION.md) for general migration tips
- Report issues at [GitHub Issues](https://github.com/steporuk/svelte-reactor/issues)

---

**Last Updated:** 2025-10-18
