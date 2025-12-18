/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { deepClone, isEqual } from '../src/utils/index.js';
import { diff, type DiffEntry } from '../src/utils/diff.js';

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
  });

  it('should clone simple objects', () => {
    const obj = { a: 1, b: 2 };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  it('should clone nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    };

    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
    expect(cloned.b.d).not.toBe(obj.b.d);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, 3, [4, 5, 6]];
    const cloned = deepClone(arr);

    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[3]).not.toBe(arr[3]);
  });

  it('should clone dates', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);

    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it('should clone maps and sets', () => {
    const map = new Map([['a', 1], ['b', 2]]);
    const cloned = deepClone(map);

    expect(cloned).toEqual(map);
    expect(cloned).not.toBe(map);
  });

  it('should handle circular references gracefully', () => {
    const obj: any = { a: 1 };
    obj.self = obj;

    // structuredClone can handle circular refs
    const cloned = deepClone(obj);
    expect(cloned.a).toBe(1);
  });
});

describe('isEqual', () => {
  it('should compare primitive values', () => {
    expect(isEqual(42, 42)).toBe(true);
    expect(isEqual(42, 43)).toBe(false);
    expect(isEqual('hello', 'hello')).toBe(true);
    expect(isEqual('hello', 'world')).toBe(false);
    expect(isEqual(true, true)).toBe(true);
    expect(isEqual(true, false)).toBe(false);
  });

  it('should compare null and undefined', () => {
    expect(isEqual(null, null)).toBe(true);
    expect(isEqual(undefined, undefined)).toBe(true);
    expect(isEqual(null, undefined)).toBe(false);
  });

  it('should compare simple objects', () => {
    expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('should compare nested objects', () => {
    const obj1 = { a: 1, b: { c: 2, d: { e: 3 } } };
    const obj2 = { a: 1, b: { c: 2, d: { e: 3 } } };
    const obj3 = { a: 1, b: { c: 2, d: { e: 4 } } };

    expect(isEqual(obj1, obj2)).toBe(true);
    expect(isEqual(obj1, obj3)).toBe(false);
  });

  it('should compare arrays', () => {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(isEqual([1, 2, 3], [1, 2])).toBe(false);
  });

  it('should compare same reference', () => {
    const obj = { a: 1 };
    expect(isEqual(obj, obj)).toBe(true);
  });

  it('should handle different key counts', () => {
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });
});

describe('diff', () => {
  it('should detect no changes', () => {
    const state = { a: 1, b: 2 };
    const result = diff(state, state);

    expect(result.hasChanges).toBe(false);
    expect(result.changes).toHaveLength(0);
  });

  it('should detect updated values', () => {
    const oldState = { a: 1, b: 2 };
    const newState = { a: 1, b: 3 };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['b'],
      operation: 'update',
      oldValue: 2,
      newValue: 3,
    });
  });

  it('should detect added properties', () => {
    const oldState = { a: 1 };
    const newState = { a: 1, b: 2 };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['b'],
      operation: 'add',
      newValue: 2,
    });
  });

  it('should detect removed properties', () => {
    const oldState = { a: 1, b: 2 };
    const newState = { a: 1 };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['b'],
      operation: 'remove',
      oldValue: 2,
    });
  });

  it('should detect nested changes', () => {
    const oldState = { a: { b: { c: 1 } } };
    const newState = { a: { b: { c: 2 } } };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['a', 'b', 'c'],
      operation: 'update',
      oldValue: 1,
      newValue: 2,
    });
  });

  it('should detect array changes', () => {
    const oldState = { items: [1, 2, 3] };
    const newState = { items: [1, 2, 4] };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['items', '2'],
      operation: 'update',
      oldValue: 3,
      newValue: 4,
    });
  });

  it('should detect array additions', () => {
    const oldState = { items: [1, 2] };
    const newState = { items: [1, 2, 3] };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['items', '2'],
      operation: 'add',
      newValue: 3,
    });
  });

  it('should detect array removals', () => {
    const oldState = { items: [1, 2, 3] };
    const newState = { items: [1, 2] };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toEqual({
      path: ['items', '2'],
      operation: 'remove',
      oldValue: 3,
    });
  });

  it('should handle null/undefined transitions', () => {
    const oldState = { a: null };
    const newState = { a: 1 };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].operation).toBe('add');
  });

  it('should detect multiple changes', () => {
    const oldState = { a: 1, b: 2, c: 3 };
    const newState = { a: 1, b: 4, d: 5 };
    const result = diff(oldState, newState);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.length).toBeGreaterThan(1);

    const operations = result.changes.map(c => c.operation).sort();
    expect(operations).toContain('update');
    expect(operations).toContain('add');
    expect(operations).toContain('remove');
  });
});
