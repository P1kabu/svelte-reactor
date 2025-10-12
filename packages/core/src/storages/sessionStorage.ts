import type { StorageAdapter } from '../types/index.js';
import { QuotaExceededError } from '../types/index.js';

/**
 * Check if error is quota exceeded error
 */
function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/**
 * sessionStorage adapter
 */
export const sessionStorageAdapter: StorageAdapter = {
  name: 'sessionStorage',

  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError(key, value.length);
      }
      throw error;
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.clear();
  },
};
