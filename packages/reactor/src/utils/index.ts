/**
 * Utility exports - ALL INTERNAL ONLY
 * These utilities are used by the library internally but are not exposed to users.
 * Users should not import from 'svelte-reactor/utils' - all necessary APIs are in main exports.
 */

// Core utilities (used by reactor, history, plugins)
export { deepClone, smartClone, isEqual } from './clone.js';

// Path utilities (used by persist plugin for pick/omit options)
export { pick, omit, getPath, setPath, deletePath } from './path.js';

// Diff utilities (kept for potential future DevTools features and testing)
export {
  diff,
  type DiffOperation,
  type DiffEntry,
  type DiffResult,
} from './diff.js';
