# @svelte-dev/persist

> Effortless state persistence for Svelte 5 Runes

See the [main README](../../README.md) for full documentation.

## Installation

```bash
npm install @svelte-dev/persist
```

## Quick Start

```svelte
<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  let count = persisted('counter', $state(0));
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

## License

MIT
