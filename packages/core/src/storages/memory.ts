import type { StorageAdapter } from '../types/index.js';

/**
 * In-memory storage adapter (fallback for SSR)
 */
class MemoryStorage implements StorageAdapter {
  name = 'memory';
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryStorageAdapter = new MemoryStorage();
