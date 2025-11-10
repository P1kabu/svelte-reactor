# Svelte Reactor Rules

## Quick Reference

- Use `createReactor()` for all state management
- Always use `.update()` or `.set()` for state changes
- Never mutate state directly
- Use plugins for common features

## Core API

```typescript
import { createReactor } from 'svelte-reactor';
const store = createReactor(initialState, options);
```

## Plugins

- `undoRedo()` - Undo/redo functionality
- `persist({ key, pick?, omit? })` - localStorage persistence (v0.2.3: selective persistence)
- `logger({ filter?, trackPerformance? })` - Console logging (v0.2.3: advanced filtering)

## Helpers

- `arrayActions(reactor, field, { idKey })` - CRUD operations for arrays
  - Methods: `add`, `update`, `remove`, `toggle`, `filter`, `find`, `has`, etc.
  - **NEW in v0.2.3:** `sort`, `bulkUpdate`, `bulkRemove`
- `asyncActions(reactor, actions, options)` - Async operations with loading/error
  - Automatic `loading` and `error` state management
  - Options: `loadingKey`, `errorKey`, `actionPrefix`
  - **NEW in v0.2.3:** `retry`, `debounce`, cancellation with `.cancel()`

## Best Practices (v0.2.3)

✅ **DO:**
- Use createReactor for reactive state
- Combine multiple plugins
- Use .update() for state changes
- Enable devtools in development
- Call destroy() when component unmounts (prevents memory leaks!)
- Use arrayActions() and asyncActions() helpers
- Add action names for better debugging

❌ **DON'T:**
- Mutate state directly
- Mix with writable() stores
- Forget to destroy() reactor (memory leak!)
- Persist sensitive data without encryption
- Skip input validation (reactor validates automatically)

## v0.2.3 Features

🔒 **Selective Persistence:** Pick/omit fields for security
```typescript
persist({ key: 'app', omit: ['user.token'] }) // Don't save sensitive data
```

⚡ **Retry & Debounce:** Automatic retry with backoff + request debouncing
```typescript
asyncActions(store, actions, {
  retry: { attempts: 3, backoff: 'exponential' },
  debounce: 300
})
```

📊 **Performance Tracking:** Logger with execution time monitoring
```typescript
logger({ trackPerformance: true, slowThreshold: 16 })
```

🎯 **Bulk Operations:** Efficient multi-item updates
```typescript
actions.bulkUpdate(['1', '2', '3'], { done: true });
actions.sort((a, b) => a.priority - b.priority);
```

## Common Patterns

### Counter
```typescript
const counter = createReactor({ value: 0 }, {
  plugins: [undoRedo()]
});
```

### Todos with Persistence
```typescript
import { arrayActions } from 'svelte-reactor';

const todos = createReactor({ items: [] }, {
  plugins: [persist({ key: 'todos' }), undoRedo()]
});

const actions = arrayActions(todos, 'items', { idKey: 'id' });
actions.add({ id: '1', text: 'Buy milk', done: false });
actions.toggle('1', 'done');
actions.remove('1');
```

### Async Data Fetching
```typescript
import { asyncActions } from 'svelte-reactor';

const store = createReactor({ users: [], loading: false, error: null });

const api = asyncActions(store, {
  fetchUsers: async () => {
    const res = await fetch('/api/users');
    return { users: await res.json() };
  }
});

await api.fetchUsers(); // Automatic loading/error handling
```

### Form State
```typescript
const form = createReactor({ name: '', email: '' });
form.update(s => ({ ...s, name: 'John' }));
```

## Advanced

- Custom middleware for state transformation
- DevTools integration for debugging
- Full Svelte stores API compatibility
- SSR support (SvelteKit ready)

---

**Current Version:** v0.2.3 (232 tests, production-ready)
**Key Updates:** Selective persistence, retry/debounce, bulk operations, performance tracking
