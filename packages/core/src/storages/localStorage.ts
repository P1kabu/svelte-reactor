import type { StorageAdapter } from '../types/index.js';
import { QuotaExceededError } from '../types/index.js';

/**
 * Check if error is quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    // Check for different quota exceeded error codes
    (error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/**
 * localStorage adapter
 */
export const localStorageAdapter: StorageAdapter = {
  name: 'localStorage',

  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError(key, value.length);
      }
      throw error;
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },
};
