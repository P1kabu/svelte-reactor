/**
 * Pagination Tests for arrayActions helper
 * Testing pagination functionality with large datasets
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createReactor } from '../src/core/reactor.svelte.js';
import { arrayActions } from '../src/helpers/array-actions.js';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: number;
}

describe('arrayActions - Pagination', () => {
  let reactor: any;
  let actions: any;

  beforeEach(() => {
    // Create reactor with 100 items
    const items: Todo[] = Array.from({ length: 100 }, (_, i) => ({
      id: `${i + 1}`,
      text: `Todo ${i + 1}`,
      done: false,
      priority: i + 1,
    }));

    reactor = createReactor({ items });
    actions = arrayActions(reactor, 'items', {
      idKey: 'id',
      pagination: {
        pageSize: 10,
        initialPage: 1,
      },
    });
  });

  describe('getPaginated()', () => {
    it('should return first page by default', () => {
      const result = actions.getPaginated();

      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(10);
      expect(result.totalItems).toBe(100);
      expect(result.pageSize).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);

      // Check first page items
      expect(result.items[0].id).toBe('1');
      expect(result.items[9].id).toBe('10');
    });

    it('should return correct middle page', () => {
      actions.setPage(5);
      const result = actions.getPaginated();

      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);

      // Check middle page items
      expect(result.items[0].id).toBe('41');
      expect(result.items[9].id).toBe('50');
    });

    it('should return correct last page', () => {
      actions.setPage(10);
      const result = actions.getPaginated();

      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(10);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);

      // Check last page items
      expect(result.items[0].id).toBe('91');
      expect(result.items[9].id).toBe('100');
    });

    it('should handle partial last page', () => {
      // Add only 5 more items (total 105)
      for (let i = 101; i <= 105; i++) {
        actions.add({
          id: `${i}`,
          text: `Todo ${i}`,
          done: false,
          priority: i,
        });
      }

      actions.setPage(11);
      const result = actions.getPaginated();

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(11);
      expect(result.totalPages).toBe(11);
      expect(result.totalItems).toBe(105);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle empty array', () => {
      actions.clear();
      const result = actions.getPaginated();

      expect(result.items).toHaveLength(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalItems).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle array with fewer items than pageSize', () => {
      actions.clear();
      for (let i = 1; i <= 5; i++) {
        actions.add({
          id: `${i}`,
          text: `Todo ${i}`,
          done: false,
          priority: i,
        });
      }

      const result = actions.getPaginated();

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalItems).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('setPage()', () => {
    it('should change current page', () => {
      actions.setPage(3);
      const result = actions.getPaginated();

      expect(result.page).toBe(3);
      expect(result.items[0].id).toBe('21');
    });

    it('should warn and ignore invalid page (too high)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      actions.setPage(11); // Only 10 pages
      const result = actions.getPaginated();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.page).toBe(1); // Should stay on current page

      consoleSpy.mockRestore();
    });

    it('should warn and ignore invalid page (too low)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      actions.setPage(0);
      const result = actions.getPaginated();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.page).toBe(1); // Should stay on current page

      consoleSpy.mockRestore();
    });

    it('should handle negative page numbers', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      actions.setPage(-1);
      const result = actions.getPaginated();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.page).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('nextPage()', () => {
    it('should move to next page', () => {
      const success = actions.nextPage();
      const result = actions.getPaginated();

      expect(success).toBe(true);
      expect(result.page).toBe(2);
      expect(result.items[0].id).toBe('11');
    });

    it('should return false when already on last page', () => {
      actions.setPage(10);
      const success = actions.nextPage();

      expect(success).toBe(false);
      expect(actions.getPaginated().page).toBe(10);
    });

    it('should work multiple times', () => {
      actions.nextPage();
      actions.nextPage();
      actions.nextPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(4);
    });
  });

  describe('prevPage()', () => {
    it('should move to previous page', () => {
      actions.setPage(5);
      const success = actions.prevPage();
      const result = actions.getPaginated();

      expect(success).toBe(true);
      expect(result.page).toBe(4);
    });

    it('should return false when already on first page', () => {
      const success = actions.prevPage();

      expect(success).toBe(false);
      expect(actions.getPaginated().page).toBe(1);
    });

    it('should work multiple times', () => {
      actions.setPage(5);
      actions.prevPage();
      actions.prevPage();
      actions.prevPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(2);
    });
  });

  describe('firstPage()', () => {
    it('should jump to first page', () => {
      actions.setPage(7);
      actions.firstPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(1);
      expect(result.items[0].id).toBe('1');
    });

    it('should work when already on first page', () => {
      actions.firstPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(1);
    });
  });

  describe('lastPage()', () => {
    it('should jump to last page', () => {
      actions.lastPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(10);
      expect(result.items[0].id).toBe('91');
    });

    it('should work when already on last page', () => {
      actions.setPage(10);
      actions.lastPage();

      const result = actions.getPaginated();
      expect(result.page).toBe(10);
    });

    it('should update when array size changes', () => {
      actions.lastPage();
      expect(actions.getPaginated().page).toBe(10);

      // Add 20 more items (now 12 pages)
      for (let i = 101; i <= 120; i++) {
        actions.add({
          id: `${i}`,
          text: `Todo ${i}`,
          done: false,
          priority: i,
        });
      }

      actions.lastPage();
      expect(actions.getPaginated().page).toBe(12);
    });
  });

  describe('Edge cases', () => {
    it('should clamp page when array shrinks', () => {
      actions.setPage(10); // Page 10 of 10

      // Remove 50 items (now only 5 pages)
      for (let i = 1; i <= 50; i++) {
        actions.remove(`${i}`);
      }

      const result = actions.getPaginated();
      expect(result.page).toBe(5); // Auto-clamped to last valid page
      expect(result.totalPages).toBe(5);
    });

    it('should work after filtering', () => {
      // Mark some as done
      for (let i = 1; i <= 30; i++) {
        actions.update(`${i}`, { done: true });
      }

      // Remove done items (70 items left, 7 pages)
      actions.removeWhere((item: Todo) => item.done);

      actions.setPage(7);
      const result = actions.getPaginated();

      expect(result.totalPages).toBe(7);
      expect(result.totalItems).toBe(70);
      expect(result.page).toBe(7);
    });

    it('should work after sorting', () => {
      // Sort by priority descending
      actions.sort((a: Todo, b: Todo) => b.priority - a.priority);

      const result = actions.getPaginated();

      // First page should have highest priority items
      expect(result.items[0].priority).toBe(100);
      expect(result.items[9].priority).toBe(91);
    });

    it('should handle page navigation after bulk operations', () => {
      actions.setPage(5);

      // Bulk update
      const ids = Array.from({ length: 20 }, (_, i) => `${i + 1}`);
      actions.bulkUpdate(ids, { done: true });

      const result = actions.getPaginated();
      expect(result.page).toBe(5);
      expect(result.totalItems).toBe(100);
    });
  });

  describe('Custom page size', () => {
    it('should respect custom page size of 25', () => {
      const customActions = arrayActions(reactor, 'items', {
        idKey: 'id',
        pagination: {
          pageSize: 25,
        },
      });

      const result = customActions.getPaginated();

      expect(result.items).toHaveLength(25);
      expect(result.totalPages).toBe(4);
      expect(result.pageSize).toBe(25);
    });

    it('should respect custom page size of 1', () => {
      const customActions = arrayActions(reactor, 'items', {
        idKey: 'id',
        pagination: {
          pageSize: 1,
        },
      });

      const result = customActions.getPaginated();

      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(100);
      expect(result.pageSize).toBe(1);
    });

    it('should respect custom initial page', () => {
      const customActions = arrayActions(reactor, 'items', {
        idKey: 'id',
        pagination: {
          pageSize: 10,
          initialPage: 3,
        },
      });

      const result = customActions.getPaginated();

      expect(result.page).toBe(3);
      expect(result.items[0].id).toBe('21');
    });
  });

  describe('Without pagination enabled', () => {
    it('should not have pagination methods when pagination is not enabled', () => {
      const noPaginationActions = arrayActions(reactor, 'items', {
        idKey: 'id',
        // No pagination option
      });

      expect(noPaginationActions.getPaginated).toBeUndefined();
      expect(noPaginationActions.setPage).toBeUndefined();
      expect(noPaginationActions.nextPage).toBeUndefined();
      expect(noPaginationActions.prevPage).toBeUndefined();
      expect(noPaginationActions.firstPage).toBeUndefined();
      expect(noPaginationActions.lastPage).toBeUndefined();
    });
  });
});
