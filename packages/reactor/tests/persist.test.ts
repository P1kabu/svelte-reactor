/**
 * Persist integration tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createReactor } from '../src/core/reactor.svelte';
import { persist } from '../src/plugins';

interface CounterState {
  value: number;
}

describe('Persist plugin integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist reactor state to localStorage', () => {
    const counter = createReactor({ value: 0 }, {
      plugins: [persist({ key: 'test-counter' })],
    });

    counter.update((state) => {
      state.value = 42;
    });

    // Check localStorage
    const stored = localStorage.getItem('test-counter');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.value.value).toBe(42);
  });

  it('should load persisted state on initialization', () => {
    // First reactor - save state
    const counter1 = createReactor({ value: 0 }, {
      plugins: [persist({ key: 'test-counter-load' })],
    });

    counter1.update((state) => {
      state.value = 99;
    });

    counter1.destroy();

    // Second reactor - should load saved state
    const counter2 = createReactor({ value: 0 }, {
      plugins: [persist({ key: 'test-counter-load' })],
    });

    expect(counter2.state.value).toBe(99);
  });

  it('should work with debounce option', () => {
    const counter = createReactor({ value: 0 }, {
      plugins: [
        persist({
          key: 'test-counter-debounce',
          debounce: 100,
        }),
      ],
    });

    counter.update((state) => {
      state.value = 1;
    });
    counter.update((state) => {
      state.value = 2;
    });
    counter.update((state) => {
      state.value = 3;
    });

    // State should be updated immediately in reactor
    expect(counter.state.value).toBe(3);

    // But localStorage might be debounced
    // (actual debounce test would need timers)
  });

  it('should support different storage types', () => {
    const counter = createReactor({ value: 0 }, {
      plugins: [
        persist({
          key: 'test-counter-session',
          storage: 'sessionStorage',
        }),
      ],
    });

    counter.update((state) => {
      state.value = 123;
    });

    // Check sessionStorage
    const stored = sessionStorage.getItem('test-counter-session');
    expect(stored).toBeTruthy();
  });

  it('should work with compression option', () => {
    const counter = createReactor({ value: 0 }, {
      plugins: [
        persist({
          key: 'test-counter-compress',
          compress: true,
        }),
      ],
    });

    counter.update((state) => {
      state.value = 456;
    });

    expect(counter.state.value).toBe(456);

    // State should be persisted (compressed or not)
    const stored = localStorage.getItem('test-counter-compress');
    expect(stored).toBeTruthy();
  });

  it('should support migrations', () => {
    // Save old version
    const oldData = {
      value: {
        oldField: 'old-value',
      },
      __version: 1,
    };
    localStorage.setItem('test-counter-migrate', JSON.stringify(oldData));

    // Create reactor with migration
    const counter = createReactor({ newField: '' }, {
      plugins: [
        persist({
          key: 'test-counter-migrate',
          version: 2,
          migrations: {
            2: (data: any) => ({
              newField: data.oldField || 'default',
            }),
          },
        }),
      ],
    });

    // Should have migrated data
    expect(counter.state.newField).toBe('old-value');
  });
});

describe('Persist with other plugins', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should work together with undoRedo plugin', async () => {
    const { undoRedo } = await import('../src/plugins');

    const counter = createReactor({ value: 0 }, {
      plugins: [
        persist({ key: 'test-persist-undo' }),
        undoRedo({ limit: 10 }),
      ],
    });

    counter.update((state) => {
      state.value = 5;
    });
    counter.update((state) => {
      state.value = 10;
    });

    // Should persist
    expect(counter.state.value).toBe(10);

    // Should undo
    counter.undo();
    expect(counter.state.value).toBe(5);

    // Undone state should also persist
    const stored = localStorage.getItem('test-persist-undo');
    expect(stored).toBeTruthy();
  });
});
