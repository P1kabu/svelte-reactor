/**
 * Utility exports
 */

// Public utilities
export { deepClone, isEqual } from './clone.js';
export { pick, omit } from './path.js';

// Internal exports (for internal use only - keep for diff tests)
export {
  diff,
  type DiffOperation,
  type DiffEntry,
  type DiffResult,
} from './diff.js';

// Internal path utilities (used by pick/omit)
export { getPath, setPath, deletePath } from './path.js';
