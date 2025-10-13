# Changelog

All notable changes to @svelte-dev/reactor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-XX

### Added

#### Core Features
- `createReactor()` - Main function for creating reactive state management
- Reactive state with Svelte 5 `$state` runes
- `update()` method with optional action parameter for state updates
- `set()` method for direct state replacement
- `batch()` method for grouping multiple updates
- `destroy()` method for cleanup

#### Undo/Redo System
- Full undo/redo functionality with `undoRedo()` plugin
- History management with configurable limits (default: 50)
- `undo()` and `redo()` methods
- `canUndo()` and `canRedo()` state checks
- `clearHistory()` for resetting history
- `getHistory()` for accessing history stack
- Batch operations support
- Action exclusion with `exclude` option
- History compression with `compress` option
- Action grouping with `groupByAction` option

#### Plugin System
- Flexible plugin architecture with `ReactorPlugin` interface
- `persist()` plugin for automatic state persistence
  - Support for localStorage, sessionStorage
  - Configurable debounce
  - Schema versioning and migrations
  - Direct storage access (no $effect dependency)
- `logger()` plugin for development debugging
  - Collapsible console groups
  - Custom logger functions
- Plugin lifecycle methods (init, destroy)

#### Middleware System
- Middleware chain for intercepting state changes
- `onBeforeUpdate` and `onAfterUpdate` hooks
- Error handling with `onError`
- Custom middleware support

#### DevTools API
- `createDevTools()` for advanced debugging
- Time-travel debugging with `timeTravel()`
- State export/import as JSON
- `reset()` to initial state
- `getStateAt()` for historical state access
- `subscribe()` for external devtools integration
- Full state inspection with `inspect()`

#### Utilities
- `diff()` - Calculate state differences
- `applyPatch()` - Apply state patches
- `getChangeSummary()` - Get change statistics
- `deepClone()` - Deep object cloning with structuredClone
- `isEqual()` - Deep equality comparison

#### Performance
- Bundle size: 12.07 KB gzipped (full package)
- Plugins only: 1.03 KB gzipped
- Tree-shakeable exports
- Simple updates: < 0.1ms
- Undo/redo overhead: < 0.1ms
- Comprehensive benchmarks included

#### Documentation
- Complete README.md with examples
- Full API reference (API.md)
- Real-world examples (EXAMPLES.md)
  - Counter with undo/redo
  - Todo app with persistence
  - Shopping cart
  - Canvas editor
  - Form management
- Performance documentation (PERFORMANCE.md)
- TypeScript definitions for all APIs

#### Testing
- 93 comprehensive tests
- Unit tests for all core features
- Integration tests for plugins
- DevTools tests
- Utilities tests (40 tests)
- Performance benchmarks
- 100% TypeScript coverage

### Technical Details

#### Dependencies
- Svelte 5 (peer dependency)
- @svelte-dev/persist (workspace dependency)
- Zero external runtime dependencies

#### TypeScript
- Full TypeScript support
- Strict type checking
- Exported types for all APIs
- Generic type support for state

#### Browser Support
- Modern browsers with ES2020+ support
- SSR-safe for SvelteKit
- Works in all environments that support Svelte 5

### Breaking Changes
- None (initial release)

### Migration Guide
- None (initial release)

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing features

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Features that were removed

#### Fixed
- Bug fixes

#### Security
- Security improvements

---

## Roadmap

### v0.2.0 (Planned)
- Selectors API for computed state
- Shallow comparison optimization
- Additional storage adapters
- Enhanced devtools integration

### v1.0.0 (Future)
- Multi-tab sync plugin with BroadcastChannel
- Redux DevTools extension support
- Performance optimizations for large states
- Advanced state diffing algorithms

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT License - see [LICENSE](./LICENSE) for details
