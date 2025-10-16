# Changelog

All notable changes to svelte-reactor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2025-01-16

### Added
- **Async Actions Helper** - Automatic loading/error state management for async operations
  - `asyncActions()` helper function with full TypeScript support
  - Automatic `loading` and `error` state handling
  - Customizable field names (`loadingKey`, `errorKey`)
  - 23 comprehensive tests including 3 advanced complexity tests:
    - Concurrent async operations handling
    - Race condition management
    - Complex nested operations with error recovery
  - Works seamlessly with undo/redo plugin

### Changed
- **Enhanced Migration Guide** - Added detailed examples for:
  - Working with Arrays (arrayActions helper)
  - Async Operations (asyncActions helper)
  - Before/After comparisons with manual approaches
- Test count increased from 149 to 172 tests (+23 tests)
- Bundle size slightly increased to 12.22 KB gzipped (was 11.95 KB)
- Documentation updated with asyncActions examples

## [0.2.0] - 2025-01-16

### Added
- **Array Actions Helper** - Reduce boilerplate for common array CRUD operations
  - `arrayActions()` helper function for creating CRUD actions
  - 11 built-in methods: `add`, `update`, `updateBy`, `remove`, `removeWhere`, `clear`, `toggle`, `set`, `filter`, `find`, `has`, `count`
  - Full TypeScript type inference for array items
  - Compatible with undoRedo plugin
  - 21 comprehensive tests

### Fixed
- **persist plugin sync** - Fixed cross-tab/window synchronization for localStorage
  - Added `storage` event listener for detecting external changes
  - Changes from other tabs are now automatically synced (localStorage)
  - Manual changes in DevTools are now detected (both localStorage and sessionStorage)
  - Proper cleanup of event listeners on destroy()
  - 2 new tests for storage synchronization

### Changed
- Test count increased from 93 to 149 tests (+56 tests)
- Documentation updated with arrayActions examples
- Added Array Actions to main features list

## [0.1.1] - 2025-01-14

### Fixed
- Updated package name from `@svelte-dev/reactor` to `svelte-reactor` across all documentation and examples
- Fixed GitHub repository links to point to correct repository (P1kabu/svelte-reactor)
- Removed references to non-existent `@svelte-dev/persist` package
- Fixed GitHub Actions workflows to use correct package names
- Updated root README to display correct project information

## [0.1.0] - 2025-01-13

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

### v0.3.0 (Planned)
- Selectors API for computed state
- Shallow comparison optimization
- Additional storage adapters (IndexedDB, custom backends)
- Performance optimizations for large states

### v1.0.0 (Future)
- Multi-tab sync plugin with BroadcastChannel
- Redux DevTools extension support
- Advanced state diffing algorithms
- React/Vue adapters for cross-framework usage

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT License - see [LICENSE](./LICENSE) for details
