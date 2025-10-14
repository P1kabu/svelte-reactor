/**
 * Utility exports
 */

export { deepClone, isEqual } from './clone.js';
export {
  diff,
  formatPath,
  applyPatch,
  getChangeSummary,
  type DiffOperation,
  type DiffEntry,
  type DiffResult,
} from './diff.js';
export { getPath, setPath, deletePath, pick, omit } from './path.js';
