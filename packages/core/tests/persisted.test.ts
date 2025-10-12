import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageAdapter, sessionStorageAdapter } from '../src/storages/index.js';

describe('persisted - basic functionality', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load primitive values', () => {
    // Simulate saving a value
    localStorageAdapter.set('test-counter', JSON.stringify({ value: 5, __version: 1 }));

    // Simulate loading
    const stored = localStorageAdapter.get('test-counter');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.value).toBe(5);
  });

  it('should save and load objects', () => {
    const user = { name: 'John', age: 30 };
    localStorageAdapter.set('test-user', JSON.stringify({ value: user, __version: 1 }));

    const stored = localStorageAdapter.get('test-user');
    const parsed = JSON.parse(stored!);

    expect(parsed.value).toEqual(user);
  });

  it('should save and load arrays', () => {
    const todos = [
      { id: 1, text: 'Task 1', done: false },
      { id: 2, text: 'Task 2', done: true },
    ];

    localStorageAdapter.set('test-todos', JSON.stringify({ value: todos, __version: 1 }));

    const stored = localStorageAdapter.get('test-todos');
    const parsed = JSON.parse(stored!);

    expect(parsed.value).toEqual(todos);
  });
});

describe('persisted - with different storages', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should work with localStorage', () => {
    localStorageAdapter.set('test-key', 'test-value');
    expect(localStorageAdapter.get('test-key')).toBe('test-value');
  });

  it('should work with sessionStorage', () => {
    sessionStorageAdapter.set('test-key', 'test-value');
    expect(sessionStorageAdapter.get('test-key')).toBe('test-value');
  });
});
