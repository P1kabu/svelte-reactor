/**
 * Undo/Redo history manager
 */

import type { HistoryEntry, HistoryStack, UndoRedoHistory as IUndoRedoHistory } from '../types/index.js';
import { deepClone } from '../utils/clone.js';

/**
 * Undo/Redo history implementation
 */
export class UndoRedoHistory<T> implements IUndoRedoHistory<T> {
  private past: HistoryEntry<T>[] = [];
  private future: HistoryEntry<T>[] = [];
  private current: T;
  private limit: number;
  private batchMode = false;
  private batchBuffer: HistoryEntry<T>[] = [];
  private excludeActions: string[];
  private compress: boolean;
  private groupByAction: boolean;

  constructor(
    initialState: T,
    limit = 50,
    options?: {
      exclude?: string[];
      compress?: boolean;
      groupByAction?: boolean;
    }
  ) {
    this.current = deepClone(initialState);
    this.limit = limit;
    this.excludeActions = options?.exclude || [];
    this.compress = options?.compress || false;
    this.groupByAction = options?.groupByAction || false;
  }

  /**
   * Push new state to history
   */
  push(prevState: T, nextState: T, action?: string): void {
    // Skip excluded actions
    if (action && this.excludeActions.includes(action)) {
      this.current = deepClone(nextState);
      return;
    }

    // If in batch mode, buffer the entry
    if (this.batchMode) {
      this.batchBuffer.push({
        state: deepClone(prevState),
        timestamp: Date.now(),
        action,
      });
      return;
    }

    // Group by action name if enabled
    if (this.groupByAction && action && this.past.length > 0) {
      const lastEntry = this.past[this.past.length - 1];
      if (lastEntry.action === action) {
        // Same action - just update current, don't add new entry
        this.current = deepClone(nextState);
        this.future = [];
        return;
      }
    }

    // Compress history if enabled
    if (this.compress && this.past.length > 0) {
      const lastEntry = this.past[this.past.length - 1];
      // Simple compression: skip if state is identical
      if (JSON.stringify(lastEntry.state) === JSON.stringify(prevState)) {
        this.current = deepClone(nextState);
        this.future = [];
        return;
      }
    }

    // Add to history
    this.past.push({
      state: deepClone(prevState),
      timestamp: Date.now(),
      action,
    });

    // Enforce limit
    if (this.past.length > this.limit) {
      this.past.shift();
    }

    // Clear future (can't redo after new change)
    this.future = [];

    // Update current
    this.current = deepClone(nextState);
  }

  /**
   * Undo last change
   */
  undo(): T | null {
    if (this.past.length === 0) {
      return null;
    }

    const entry = this.past.pop()!;

    // Save current to future
    this.future.push({
      state: deepClone(this.current),
      timestamp: Date.now(),
    });

    // Restore previous state
    this.current = deepClone(entry.state);
    return entry.state;
  }

  /**
   * Redo last undone change
   */
  redo(): T | null {
    if (this.future.length === 0) {
      return null;
    }

    const entry = this.future.pop()!;

    // Save current to past
    this.past.push({
      state: deepClone(this.current),
      timestamp: Date.now(),
    });

    // Restore future state
    this.current = deepClone(entry.state);
    return entry.state;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Start batch mode (group multiple changes)
   */
  startBatch(): void {
    this.batchMode = true;
    this.batchBuffer = [];
  }

  /**
   * End batch mode and save as single entry
   */
  endBatch(): void {
    this.batchMode = false;

    if (this.batchBuffer.length > 0) {
      // Save only the first state in batch
      const firstEntry = this.batchBuffer[0];
      this.past.push({
        state: firstEntry.state,
        timestamp: Date.now(),
        action: 'batch',
      });

      // Enforce limit
      if (this.past.length > this.limit) {
        this.past.shift();
      }

      // Clear buffer
      this.batchBuffer = [];
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
  }

  /**
   * Get history stack for inspection
   */
  getStack(): HistoryStack<T> {
    return {
      past: [...this.past],
      future: [...this.future],
      current: deepClone(this.current),
    };
  }
}
