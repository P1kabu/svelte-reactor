/**
 * Array Actions Helper - CRUD operations for arrays
 */

import type { Reactor } from '../types/index.js';

/**
 * Pagination configuration options
 */
export interface PaginationOptions {
  /**
   * Number of items per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Initial page number (1-indexed)
   * @default 1
   */
  initialPage?: number;
}

/**
 * Paginated data result
 */
export interface PaginatedResult<T> {
  /** Current page items */
  items: T[];

  /** Current page number (1-indexed) */
  page: number;

  /** Total number of pages */
  totalPages: number;

  /** Total number of items */
  totalItems: number;

  /** Whether there is a next page */
  hasNext: boolean;

  /** Whether there is a previous page */
  hasPrev: boolean;

  /** Number of items per page */
  pageSize: number;
}

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

  /**
   * Pagination configuration (NEW in v0.2.4)
   * Enables pagination methods when provided
   */
  pagination?: PaginationOptions;
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

  /**
   * Get paginated data (only available when pagination is enabled)
   * @returns Paginated result with current page items and metadata
   */
  getPaginated?(): PaginatedResult<T>;

  /**
   * Set current page (only available when pagination is enabled)
   * @param page Page number (1-indexed)
   */
  setPage?(page: number): void;

  /**
   * Go to next page (only available when pagination is enabled)
   * @returns true if successful, false if already on last page
   */
  nextPage?(): boolean;

  /**
   * Go to previous page (only available when pagination is enabled)
   * @returns true if successful, false if already on first page
   */
  prevPage?(): boolean;

  /**
   * Go to first page (only available when pagination is enabled)
   */
  firstPage?(): void;

  /**
   * Go to last page (only available when pagination is enabled)
   */
  lastPage?(): void;
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
  const { idKey = 'id', actionPrefix = String(field), pagination } = options;

  // Pagination state (if enabled)
  let currentPage = pagination?.initialPage ?? 1;
  const pageSize = pagination?.pageSize ?? 20;

  // Helper to get array from state
  const getArray = (): T[] => {
    const value = reactor.state[field];
    if (!Array.isArray(value)) {
      const actualType = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
      throw new TypeError(
        `[arrayActions] Field '${String(field)}' must be an array.\n` +
        `  Current type: ${actualType}\n` +
        `  Current value: ${JSON.stringify(value)}\n\n` +
        `Tip: Initialize your state with an array:\n` +
        `  const store = createReactor({ ${String(field)}: [] });`
      );
    }
    return value as T[];
  };

  return {
    add(item: T): void {
      reactor.update((state) => {
        const arr = state[field] as T[];
        if (!Array.isArray(arr)) {
          const actualType = arr === null ? 'null' : arr === undefined ? 'undefined' : typeof arr;
          throw new TypeError(
            `[arrayActions:add] Field '${String(field)}' must be an array.\n` +
            `  Current type: ${actualType}\n` +
            `  Action: add\n\n` +
            `Tip: Initialize your state with an array:\n` +
            `  const store = createReactor({ ${String(field)}: [] });`
          );
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

        // Performance optimization: Create Map for O(1) lookups instead of O(n) arr.find()
        // This changes complexity from O(ids.length * arr.length) to O(arr.length + ids.length)
        const itemsById = new Map(arr.map((item: any) => [item[idKey], item]));

        for (const id of ids) {
          const item = itemsById.get(id);
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

    // Pagination methods (conditional based on options)
    ...(pagination ? {
      getPaginated(): PaginatedResult<T> {
        const arr = getArray();
        const totalItems = arr.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;

        // Clamp current page to valid range
        currentPage = Math.max(1, Math.min(currentPage, totalPages));

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        const items = arr.slice(startIndex, endIndex);

        return {
          items,
          page: currentPage,
          totalPages,
          totalItems,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
          pageSize,
        };
      },

      setPage(page: number): void {
        const arr = getArray();
        const totalPages = Math.ceil(arr.length / pageSize) || 1;

        if (page < 1 || page > totalPages) {
          console.warn(`[arrayActions] Invalid page ${page}. Valid range: 1-${totalPages}`);
          return;
        }

        currentPage = page;
      },

      nextPage(): boolean {
        const arr = getArray();
        const totalPages = Math.ceil(arr.length / pageSize) || 1;

        if (currentPage < totalPages) {
          currentPage++;
          return true;
        }
        return false;
      },

      prevPage(): boolean {
        if (currentPage > 1) {
          currentPage--;
          return true;
        }
        return false;
      },

      firstPage(): void {
        currentPage = 1;
      },

      lastPage(): void {
        const arr = getArray();
        const totalPages = Math.ceil(arr.length / pageSize) || 1;
        currentPage = totalPages;
      },
    } : {}),
  };
}
