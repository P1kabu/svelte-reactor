# Svelte Reactor v0.2.8 - Copilot Reference

Docs: [README](./README.md) | [API](./API.md) | [EXAMPLES](./EXAMPLES.md)

## Imports
```typescript
import { createReactor, simpleStore, persistedStore, computedStore, arrayActions, asyncActions, derived, get, readonly, isEqual } from 'svelte-reactor';
import { undoRedo, persist, logger } from 'svelte-reactor/plugins';
```

## createReactor
```typescript
const store = createReactor({ count: 0 }, { name: 'counter', plugins: [undoRedo()], devtools: true });
store.update(s => { s.count++; }, 'increment');
store.set({ count: 5 });
store.subscribe(state => {});
store.select(s => s.count, (val, prev) => {});
store.undo(); store.redo();
store.canUndo(); store.canRedo();
store.batch(() => {});
store.destroy();
```

## simpleStore
```typescript
const count = simpleStore(0);
count.set(5);
count.update(n => n + 1);
console.log(count.get());  // ✅ Use .get() to read value
// count.value is DEPRECATED - shows warning
count.subscribe(val => {});
```

## persistedStore
```typescript
const settings = persistedStore('key', { theme: 'dark' }, { storage: 'localStorage', debounce: 300, omit: ['secret'] });
console.log(settings.get().theme);  // ✅ Use .get() to read value
```

## Reading Values
| Store | Read (non-reactive) | Read (reactive) |
|-------|---------------------|-----------------|
| `simpleStore/persistedStore` | `.get()` | `$store` |
| `createReactor` | `.state` | `.state` |

⚠️ `.value` is DEPRECATED - use `.get()` instead

## computedStore
```typescript
const filtered = computedStore(store, s => s.items.filter(i => !i.done), { keys: ['items'], equals: isEqual });
```

## arrayActions
```typescript
const actions = arrayActions(store, 'items', { idKey: 'id' });
actions.add({ id: '1', name: 'Item' });
actions.update('1', { name: 'New' });
actions.remove('1');
actions.toggle('1', 'done');
actions.bulkUpdate(['1', '2'], { done: true });
actions.sort((a, b) => a.order - b.order);
actions.find('1');
actions.has('1');
actions.count();
actions.clear();
```

## asyncActions
```typescript
const api = asyncActions(store, {
  fetch: async (id: string) => { const r = await fetch(`/api/${id}`); return { data: await r.json() }; }
}, { retry: { attempts: 3 }, debounce: 300, concurrency: 'replace' });
await api.fetch('1');
api.fetch.cancel();
```

## Plugins
```typescript
undoRedo({ maxHistory: 50 })
persist({ key: 'app', storage: 'localStorage', omit: ['token'], ttl: 300000, onExpire: () => {} })
logger({ filter: a => a?.startsWith('user:'), trackPerformance: true })
```

## Selective Subscribe
```typescript
store.select(s => s.user.name, (name, prev) => {}, { fireImmediately: false, equalityFn: isEqual });
```

## Svelte Component
```svelte
<script lang="ts">
import { createReactor } from 'svelte-reactor';
import { onDestroy } from 'svelte';
const store = createReactor({ count: 0 });
onDestroy(() => store.destroy());
</script>
<button onclick={() => store.update(s => { s.count++; })}>
  {store.state.count}
</button>
```

## Rules
- Always call `store.destroy()` in `onDestroy`
- Use `store.update(fn)` not direct mutation
- Use `omit` for sensitive data in persist
- Use `select()` for specific field subscriptions
