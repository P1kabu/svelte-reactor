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
- `persist({ key })` - localStorage persistence
- `logger()` - Console logging of changes

## Best Practices

✅ **DO:**
- Use createReactor for reactive state
- Combine multiple plugins
- Use .update() for state changes
- Enable devtools in development
- Unsubscribe when component unmounts

❌ **DON'T:**
- Mutate state directly
- Mix with writable() stores
- Forget to unsubscribe
- Persist sensitive data without encryption

## Common Patterns

### Counter
```typescript
const counter = createReactor({ value: 0 }, {
  plugins: [undoRedo()]
});
```

### Todos with Persistence
```typescript
const todos = createReactor({ items: [] }, {
  plugins: [persist({ key: 'todos' }), undoRedo()]
});
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
