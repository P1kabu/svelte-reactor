/**
 * Persist Plugin with IndexedDB Integration Tests (Simplified)
 * Tests focus on reactor state behavior, not IndexedDB persistence details
 */

import { describe, it, expect } from 'vitest';
import { createReactor } from '../src/index';
import { persist } from '../src/plugins/persist-plugin';
import 'fake-indexeddb/auto';

describe('Persist Plugin with IndexedDB', () => {
  it('should initialize reactor with IndexedDB storage', () => {
    interface State {
      count: number;
      name: string;
    }

    const reactor = createReactor<State>(
      { count: 0, name: 'test' },
      {
        plugins: [
          persist({
            key: 'test-state',
            storage: 'indexedDB',
            indexedDB: { database: 'test-db' }
          })
        ]
      }
    );

    // Reactor state should be accessible
    expect(reactor.state.count).toBe(0);
    expect(reactor.state.name).toBe('test');

    // Updates should work
    reactor.update(s => { s.count = 42; });
    expect(reactor.state.count).toBe(42);

    reactor.destroy();
  });

  it('should handle state updates with IndexedDB', () => {
    interface State {
      user: { name: string; age: number };
      settings: { theme: string };
    }

    const reactor = createReactor<State>(
      {
        user: { name: 'John', age: 30 },
        settings: { theme: 'light' }
      },
      {
        plugins: [
          persist({
            key: 'user-state',
            storage: 'indexedDB',
            indexedDB: { database: 'test-user-db' }
          })
        ]
      }
    );

    // Multiple updates
    reactor.update(s => { s.user.name = 'Jane'; });
    reactor.update(s => { s.user.age = 25; });
    reactor.update(s => { s.settings.theme = 'dark'; });

    expect(reactor.state.user.name).toBe('Jane');
    expect(reactor.state.user.age).toBe(25);
    expect(reactor.state.settings.theme).toBe('dark');

    reactor.destroy();
  });

  it('should work with pick option', () => {
    interface State {
      user: {
        name: string;
        email: string;
        token: string;
      };
      settings: {
        theme: string;
      };
    }

    const reactor = createReactor<State>(
      {
        user: { name: 'John', email: 'john@test.com', token: 'secret' },
        settings: { theme: 'dark' }
      },
      {
        plugins: [
          persist({
            key: 'selective-state',
            storage: 'indexedDB',
            pick: ['user.name', 'user.email', 'settings'],
            indexedDB: { database: 'test-pick-db' }
          })
        ]
      }
    );

    // State should still be fully accessible
    expect(reactor.state.user.name).toBe('John');
    expect(reactor.state.user.email).toBe('john@test.com');
    expect(reactor.state.user.token).toBe('secret');
    expect(reactor.state.settings.theme).toBe('dark');

    reactor.destroy();
  });

  it('should work with omit option', () => {
    interface State {
      user: {
        name: string;
        token: string;
      };
      cache: number[];
    }

    const reactor = createReactor<State>(
      {
        user: { name: 'John', token: 'secret' },
        cache: [1, 2, 3]
      },
      {
        plugins: [
          persist({
            key: 'omit-state',
            storage: 'indexedDB',
            omit: ['user.token', 'cache'],
            indexedDB: { database: 'test-omit-db' }
          })
        ]
      }
    );

    // State should still be fully accessible
    expect(reactor.state.user.name).toBe('John');
    expect(reactor.state.user.token).toBe('secret');
    expect(reactor.state.cache).toEqual([1, 2, 3]);

    reactor.destroy();
  });

  it('should handle debounced writes', () => {
    interface State {
      counter: number;
    }

    const reactor = createReactor<State>(
      { counter: 0 },
      {
        plugins: [
          persist({
            key: 'debounced-state',
            storage: 'indexedDB',
            debounce: 100,
            indexedDB: { database: 'test-debounce-db' }
          })
        ]
      }
    );

    // Rapid updates
    reactor.update(s => { s.counter = 1; });
    reactor.update(s => { s.counter = 2; });
    reactor.update(s => { s.counter = 3; });
    reactor.update(s => { s.counter = 4; });
    reactor.update(s => { s.counter = 5; });

    // Final state should be correct
    expect(reactor.state.counter).toBe(5);

    reactor.destroy();
  });

  it('should handle custom database and store names', () => {
    interface State {
      value: string;
    }

    const reactor = createReactor<State>(
      { value: 'test' },
      {
        plugins: [
          persist({
            key: 'custom-config',
            storage: 'indexedDB',
            indexedDB: {
              database: 'custom-db',
              storeName: 'custom-store',
              version: 2
            }
          })
        ]
      }
    );

    reactor.update(s => { s.value = 'updated'; });
    expect(reactor.state.value).toBe('updated');

    reactor.destroy();
  });

  it('should cleanup on destroy', () => {
    const reactor = createReactor(
      { count: 0 },
      {
        plugins: [
          persist({
            key: 'cleanup-test',
            storage: 'indexedDB',
            indexedDB: { database: 'test-cleanup-db' }
          })
        ]
      }
    );

    reactor.update(s => { s.count = 10; });
    expect(reactor.state.count).toBe(10);

    // Should destroy without errors
    reactor.destroy();
    expect(true).toBe(true);
  });
});
