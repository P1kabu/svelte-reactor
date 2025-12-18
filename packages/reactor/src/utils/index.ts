/**
 * Utility exports - ALL INTERNAL ONLY
 * These utilities are used by the library internally but are not exposed to users.
 * Users should not import from 'svelte-reactor/utils' - all necessary APIs are in main exports.
 *
 * Note: Diff utilities have been moved to a separate optional import:
 * import { diff, applyPatch } from 'svelte-reactor/utils/diff';
 */

// Core utilities (used by reactor, history, plugins)
export { deepClone, smartClone, isEqual } from './clone.js';

// Path utilities (used by persist plugin for pick/omit options)
export { pick, omit, getPath, setPath, deletePath } from './path.js';
