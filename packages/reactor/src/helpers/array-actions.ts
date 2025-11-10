/**
 * Array Actions Helper - CRUD operations for arrays
 */

import type { Reactor } from '../types/index.js';

export interface ArrayActionsOptions {
  /**
   * Field name to use as unique identifier
   * @default 'id'
   */
  idKey?: string;

  /**
   * Action prefix for undo/redo history
   * @default field name
   */
  actionPrefix?: string;
}

export interface ArrayActions<T> {
  /**
   * Add item to array
   */
  add(item: T): void;

  /**
   * Update item by id
   */
  update(id: any, updates: Partial<T>): void;

  /**
   * Update item by id using updater function
   */
  updateBy(id: any, updater: (item: T) => void): void;

  /**
   * Remove item by id
   */
  remove(id: any): void;

  /**
   * Remove items matching predicate
   */
  removeWhere(predicate: (item: T) => boolean): void;

  /**
   * Clear all items
   */
  clear(): void;

  /**
   * Toggle boolean field for item
   */
  toggle(id: any, field: keyof T): void;

  /**
   * Replace entire array
   */
  set(items: T[]): void;

  /**
   * Filter items
   */
  filter(predicate: (item: T) => boolean): void;

  /**
   * Find item by id
   */
  find(id: any): T | undefined;

  /**
   * Check if item exists
   */
  has(id: any): boolean;

  /**
   * Get array length
   */
  count(): number;

  /**
   * Sort array using comparator function
   */
  sort(compareFn: (a: T, b: T) => number): void;

  /**
   * Update multiple items by their ids
   */
  bulkUpdate(ids: any[], updates: Partial<T>): void;

  /**
   * Remove multiple items by their ids or by predicate
   */
  bulkRemove(idsOrPredicate: any[] | ((item: T) => boolean)): void;
}

/**
 * Create array actions helper for a reactor field
 *
 * @example
 * ```typescript
 * const todos = createReactor({ items: [] as Todo[] });
 * const actions = arrayActions(todos, 'items', { idKey: 'id' });
 *
 * // CRUD operations
 * actions.add({ id: '1', text: 'Buy milk', done: false });
 * actions.update('1', { done: true });
 * actions.remove('1');
 * actions.clear();
 *
 * // Advanced operations
 * actions.toggle('1', 'done');
 * actions.filter(item => !item.done);
 * ```
 */
export function arrayActions<S extends object, K extends keyof S, T = S[K] extends (infer U)[] ? U : never>(
  reactor: Reactor<S>,
  field: K,
  options: ArrayActionsOptions = {}
): ArrayActions<T> {
  const { idKey = 'id', actionPrefix = String(field) } = options;

  // Helper to get array from state
  const getArray = (): T[] => {
    const value = reactor.state[field];
    if (!Array.isArray(value)) {
      throw new Error(`Field '${String(field)}' is not an array`);
    }
    return value as T[];
  };

  return {
    add(item: T): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        if (!Array.isArray(arr)) {
          throw new Error(`Field '${String(field)}' is not an array`);
        }
        arr.push(item);
      }, `${actionPrefix}:add`);
    },

    update(id: any, updates: Partial<T>): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        const index = arr.findIndex((item: any) => item[idKey] === id);
        if (index !== -1) {
          Object.assign(arr[index] as any, updates);
        }
      }, `${actionPrefix}:update`);
    },

    updateBy(id: any, updater: (item: T) => void): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        const item = arr.find((item: any) => item[idKey] === id);
        if (item) {
          updater(item);
        }
      }, `${actionPrefix}:update`);
    },

    remove(id: any): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        const index = arr.findIndex((item: any) => item[idKey] === id);
        if (index !== -1) {
          arr.splice(index, 1);
        }
      }, `${actionPrefix}:remove`);
    },

    removeWhere(predicate: (item: T) => boolean): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        const filtered = arr.filter((item) => !predicate(item));
        (state[field] as any) = filtered;
      }, `${actionPrefix}:removeWhere`);
    },

    clear(): void {
      reactor.update((state) => {
        (state[field] as any) = [];
      }, `${actionPrefix}:clear`);
    },

    toggle(id: any, toggleField: keyof T): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        const item = arr.find((item: any) => item[idKey] === id);
        if (item && typeof item[toggleField] === 'boolean') {
          (item[toggleField] as any) = !item[toggleField];
        }
      }, `${actionPrefix}:toggle`);
    },

    set(items: T[]): void {
      reactor.update((state) => {
        (state[field] as any) = items;
      }, `${actionPrefix}:set`);
    },

    filter(predicate: (item: T) => boolean): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        (state[field] as any) = arr.filter(predicate);
      }, `${actionPrefix}:filter`);
    },

    find(id: any): T | undefined {
      const arr = getArray();
      return arr.find((item: any) => item[idKey] === id);
    },

    has(id: any): boolean {
      const arr = getArray();
      return arr.some((item: any) => item[idKey] === id);
    },

    count(): number {
      const arr = getArray();
      return arr.length;
    },

    sort(compareFn: (a: T, b: T) => number): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        arr.sort(compareFn);
      }, `${actionPrefix}:sort`);
    },

    bulkUpdate(ids: any[], updates: Partial<T>): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        for (const id of ids) {
          const item = arr.find((item: any) => item[idKey] === id);
          if (item) {
            Object.assign(item as any, updates);
          }
        }
      }, `${actionPrefix}:bulkUpdate`);
    },

    bulkRemove(idsOrPredicate: any[] | ((item: T) => boolean)): void {
      reactor.update((state) => {
        const arr = state[field] as T[];

        if (typeof idsOrPredicate === 'function') {
          // Remove by predicate
          (state[field] as any) = arr.filter((item) => !idsOrPredicate(item));
        } else {
          // Remove by ids
          const idsSet = new Set(idsOrPredicate);
          (state[field] as any) = arr.filter((item: any) => !idsSet.has(item[idKey]));
        }
      }, `${actionPrefix}:bulkRemove`);
    },
  };
}
