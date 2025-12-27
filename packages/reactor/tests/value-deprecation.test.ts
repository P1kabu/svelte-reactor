/**
 * Tests for .value deprecation warning in simpleStore and persistedStore
 *
 * @see https://github.com/P1kabu/svelte-reactor/issues/xxx
 *
 * Problem: Users migrating from other libraries (like Zustand) expect .value property
 * which returns undefined. This caused real production bugs.
 *
 * Solution: Add .value as deprecated alias for .get() with console.warn
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simpleStore } from '../src/helpers/simple-store.js';
import { persistedStore } from '../src/helpers/persisted-store.js';

describe('.value deprecation', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    localStorage.clear();
  });

  describe('simpleStore', () => {
    it('should return correct value via .value', () => {
      const store = simpleStore(42);
      expect((store as any).value).toBe(42);
    });

    it('should return updated value via .value', () => {
      const store = simpleStore(0);
      store.set(100);
      expect((store as any).value).toBe(100);
    });

    it('should log deprecation warning when accessing .value', () => {
      const store = simpleStore(0);
      (store as any).value;

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('.value is deprecated')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('.get()')
      );
    });

    it('should log warning on each .value access', () => {
      const store = simpleStore(0);
      (store as any).value;
      (store as any).value;
      (store as any).value;

      expect(warnSpy).toHaveBeenCalledTimes(3);
    });

    it('.value should not appear in Object.keys()', () => {
      const store = simpleStore(0);
      expect(Object.keys(store)).not.toContain('value');
    });

    it('.value should not appear in for...in loop', () => {
      const store = simpleStore(0);
      const keys: string[] = [];
      for (const key in store) {
        keys.push(key);
      }
      expect(keys).not.toContain('value');
    });

    it('.get() should not log warning', () => {
      const store = simpleStore(42);
      expect(store.get()).toBe(42);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('.value and .get() should return same value', () => {
      const store = simpleStore({ nested: { data: 'test' } });
      expect((store as any).value).toEqual(store.get());
    });

    it('should work with complex objects', () => {
      const store = simpleStore({
        items: [1, 2, 3],
        user: { name: 'John' }
      });

      expect((store as any).value).toEqual({
        items: [1, 2, 3],
        user: { name: 'John' }
      });
    });
  });

  describe('persistedStore', () => {
    it('should return correct value via .value', () => {
      const store = persistedStore('test-key', 'hello');
      expect((store as any).value).toBe('hello');
    });

    it('should log deprecation warning when accessing .value', () => {
      const store = persistedStore('test-key-2', { count: 0 });
      (store as any).value;

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('.value is deprecated')
      );
    });

    it('.value should not appear in Object.keys()', () => {
      const store = persistedStore('test-key-3', 0);
      expect(Object.keys(store)).not.toContain('value');
    });

    it('.get() should not log warning', () => {
      const store = persistedStore('test-key-4', 'data');
      expect(store.get()).toBe('data');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('TypeScript compatibility', () => {
    it('WritableStore interface should have .get() method', () => {
      const store = simpleStore(0);
      // TypeScript should recognize .get() as valid method
      const getValue: () => number = store.get;
      expect(typeof getValue).toBe('function');
    });

    it('.value should require type assertion (intentionally hidden)', () => {
      const store = simpleStore(0);
      // TypeScript should NOT recognize .value without type assertion
      // (store as any).value is required to access it
      // This is intentional to discourage usage
      expect(typeof (store as any).value).toBe('number');
    });
  });
});
