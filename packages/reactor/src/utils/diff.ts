/**
 * State diff utility for tracking changes
 */

export type DiffOperation = 'add' | 'remove' | 'update';

export interface DiffEntry {
  path: string[];
  operation: DiffOperation;
  oldValue?: any;
  newValue?: any;
}

export interface DiffResult {
  changes: DiffEntry[];
  hasChanges: boolean;
}

/**
 * Calculate diff between two states
 * Returns an array of changes with paths and operations
 */
export function diff<T extends object>(oldState: T, newState: T): DiffResult {
  const changes: DiffEntry[] = [];

  function walkObject(
    oldObj: any,
    newObj: any,
    path: string[] = []
  ): void {
    // Handle null/undefined
    if (oldObj === null || oldObj === undefined) {
      if (newObj !== null && newObj !== undefined) {
        changes.push({
          path,
          operation: 'add',
          newValue: newObj,
        });
      }
      return;
    }

    if (newObj === null || newObj === undefined) {
      changes.push({
        path,
        operation: 'remove',
        oldValue: oldObj,
      });
      return;
    }

    // Handle primitives
    if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
      if (oldObj !== newObj) {
        changes.push({
          path,
          operation: 'update',
          oldValue: oldObj,
          newValue: newObj,
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      const maxLength = Math.max(oldObj.length, newObj.length);

      for (let i = 0; i < maxLength; i++) {
        if (i >= oldObj.length) {
          changes.push({
            path: [...path, String(i)],
            operation: 'add',
            newValue: newObj[i],
          });
        } else if (i >= newObj.length) {
          changes.push({
            path: [...path, String(i)],
            operation: 'remove',
            oldValue: oldObj[i],
          });
        } else {
          walkObject(oldObj[i], newObj[i], [...path, String(i)]);
        }
      }
      return;
    }

    // Handle objects
    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const hasOldKey = key in oldObj;
      const hasNewKey = key in newObj;

      if (!hasOldKey && hasNewKey) {
        changes.push({
          path: [...path, key],
          operation: 'add',
          newValue: newObj[key],
        });
      } else if (hasOldKey && !hasNewKey) {
        changes.push({
          path: [...path, key],
          operation: 'remove',
          oldValue: oldObj[key],
        });
      } else {
        walkObject(oldObj[key], newObj[key], [...path, key]);
      }
    }
  }

  walkObject(oldState, newState);

  return {
    changes,
    hasChanges: changes.length > 0,
  };
}

/**
 * Format a diff path for display
 */
export function formatPath(path: string[]): string {
  if (path.length === 0) return 'root';

  return path.reduce((acc, key, index) => {
    // Array index
    if (/^\d+$/.test(key)) {
      return `${acc}[${key}]`;
    }
    // Object key
    if (index === 0) {
      return key;
    }
    return `${acc}.${key}`;
  }, '');
}

/**
 * Apply a patch (array of changes) to a state
 * Returns a new state object
 */
export function applyPatch<T extends object>(state: T, changes: DiffEntry[]): T {
  const result = structuredClone(state) as any;

  for (const change of changes) {
    const { path, operation, newValue } = change;

    if (path.length === 0) continue;

    // Navigate to parent
    let current = result;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = path[path.length - 1];

    switch (operation) {
      case 'add':
      case 'update':
        current[lastKey] = newValue;
        break;
      case 'remove':
        if (Array.isArray(current)) {
          current.splice(Number(lastKey), 1);
        } else {
          delete current[lastKey];
        }
        break;
    }
  }

  return result;
}

/**
 * Get a summary of changes for logging
 */
export function getChangeSummary(diffResult: DiffResult): string {
  const { changes } = diffResult;

  if (changes.length === 0) {
    return 'No changes';
  }

  const summary: Record<DiffOperation, number> = {
    add: 0,
    remove: 0,
    update: 0,
  };

  for (const change of changes) {
    summary[change.operation]++;
  }

  const parts: string[] = [];
  if (summary.add > 0) parts.push(`${summary.add} added`);
  if (summary.update > 0) parts.push(`${summary.update} updated`);
  if (summary.remove > 0) parts.push(`${summary.remove} removed`);

  return parts.join(', ');
}
