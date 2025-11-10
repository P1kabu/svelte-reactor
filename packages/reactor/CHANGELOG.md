# Changelog

All notable changes to svelte-reactor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.3] - 2025-11-10

### Added

- **persist Plugin Enhancement** - Selective persistence with `pick` and `omit` options
  - `pick: string[]` - Only persist specific fields (supports dot notation)
  - `omit: string[]` - Exclude specific fields from persistence (supports dot notation)
  - Security: Prevent sensitive data (tokens, passwords) from being persisted
  - Performance: Reduce localStorage usage by excluding temporary data
  - Cannot use both `pick` and `omit` together
  - 8 comprehensive tests added

- **arrayActions Helper Enhancement** - Sorting and bulk operations
  - `sort(compareFn)` - Sort array with comparator function (supports undo/redo)
  - `bulkUpdate(ids, updates)` - Update multiple items at once
  - `bulkRemove(idsOrPredicate)` - Remove multiple items by ids or predicate
  - More efficient than calling individual methods multiple times
  - All methods support undo/redo with single history entry
  - 13 comprehensive tests added

- **asyncActions Helper Enhancement** - Retry logic, debouncing, and cancellation
  - Retry configuration with exponential/linear backoff strategies
    - `retry.attempts` - Number of retry attempts (default: 3)
    - `retry.delay` - Delay between retries in ms (default: 1000)
    - `retry.backoff` - 'exponential' or 'linear' (default: 'exponential')
    - `retry.retryOn` - Custom retry condition function
  - Debouncing support with `debounce` option (in milliseconds)
  - Request cancellation with `controller.cancel()`
  - Returns AsyncController for manual cancellation
  - 14 comprehensive tests added

- **logger Plugin Enhancement** - Advanced filtering and performance tracking
  - `filter(action, state, prevState)` - Filter function with access to action and state
  - `trackPerformance` - Track execution time for each action
  - `slowThreshold` - Warn if action execution time exceeds threshold (in ms)
  - `includeTimestamp` - Add timestamp to logs
  - `maxDepth` - Limit object depth in console (default: 3)
  - 12 comprehensive tests added

- **Integration Tests** - 5 comprehensive integration tests for v0.2.3 features
  - Test complex scenarios combining multiple features
  - Verify feature interactions work correctly

### Fixed

- **CRITICAL**: Fixed unhandled promise rejection when cancelling non-debounced async actions
  - Properly handle promise chains during cancellation
  - Added comprehensive error handling for all cancellation scenarios
- **persist plugin**: Fixed empty `pick: []` array not working correctly
- **asyncActions**: Fixed debounce cancellation not properly handling promise chains
- **State consistency**: Fixed edge cases in state updates for bulk operations

### Changed

- Test count increased from 174 to 232 tests (+58 tests)
- Bundle size increased from 10.87 KB to 13.27 KB gzipped (+2.4 KB)
- Documentation updated with v0.2.3 features and examples
- All new features are tree-shakeable

## [0.2.2] - 2025-10-18

### Fixed
- **Memory leaks** - Fixed memory leaks in core reactor
  - Subscribers Set is now properly cleared on destroy()
  - Middlewares array is now properly cleared on destroy()
  - Prevents memory leaks when reactors are destroyed and recreated

- **Performance optimization** - Skip unnecessary updates when state unchanged
  - Added deep equality check before running middlewares and notifying subscribers
  - Improves performance by avoiding re-renders when state hasn't actually changed
  - Uses existing `isEqual()` utility for reliable comparison

- **Error handling** - Enhanced error messages and validation
  - Added validation for createReactor initialState (must be non-null object)
  - Added validation for reactor name (must be non-empty string)
  - Added validation for subscribe() parameter (must be function)
  - Added validation for update() parameter (must be function)
  - Added validation for persist plugin options (key required, debounce must be number)
  - Improved error messages with reactor name context
  - Better error recovery in persist plugin (auto-cleanup corrupted data)
  - Quota exceeded detection in persist plugin with helpful error messages

- **Documentation links** - Fixed broken links in README for NPM package
  - Added API.md, EXAMPLES.md, PERFORMANCE.md to published files
  - Fixed CONTRIBUTING.md link to use GitHub URL
  - Fixed LICENSE link to use relative path

### Changed
- Test count increased from 172 to 181 tests (+9 tests for bug fixes)
- More descriptive error messages include reactor name for easier debugging

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
- Updated package name from `svelte-reactor` to `svelte-reactor` across all documentation and examples
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
