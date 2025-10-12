/**
 * Deep clone utility for state snapshots
 */

/**
 * Deep clone an object using structuredClone (fast native method)
 * Falls back to JSON.parse/stringify for older environments
 */
export function deepClone<T>(value: T): T {
  // Use native structuredClone if available (fastest)
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to JSON method
    }
  }

  // Fallback to JSON method
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.error('[Reactor] Failed to clone state:', error);
    return value;
  }
}

/**
 * Check if two values are equal (deep comparison)
 */
export function isEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual((a as any)[key], (b as any)[key])) return false;
  }

  return true;
}
