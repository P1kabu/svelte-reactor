import type { StorageAdapter } from '../types/index.js';
import { QuotaExceededError } from '../types/index.js';

const DEFAULT_DB_NAME = 'svelte-persist';
const DEFAULT_STORE_NAME = 'keyval';
const DB_VERSION = 1;

/**
 * IndexedDB wrapper with simplified API
 */
class IndexedDBStorage implements StorageAdapter {
  name = 'indexedDB';
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string = DEFAULT_DB_NAME, storeName: string = DEFAULT_STORE_NAME) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Open or get existing database connection
   */
  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Get value from IndexedDB
   */
  async get(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result ?? null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Set value in IndexedDB
   */
  async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          // Check for quota exceeded error
          if (
            request.error?.name === 'QuotaExceededError' ||
            transaction.error?.name === 'QuotaExceededError'
          ) {
            reject(new QuotaExceededError(key, value.length));
          } else {
            reject(request.error);
          }
        };
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw error;
    }
  }

  /**
   * Remove value from IndexedDB
   */
  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB remove error:', error);
    }
  }

  /**
   * Clear all values from IndexedDB
   */
  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  /**
   * Get all keys in the store
   */
  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result as string[]);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB keys error:', error);
      return [];
    }
  }
}

/**
 * Create IndexedDB storage adapter
 */
export function createIndexedDBAdapter(
  dbName?: string,
  storeName?: string
): StorageAdapter {
  return new IndexedDBStorage(dbName, storeName);
}

/**
 * Default IndexedDB adapter
 */
export const indexedDBAdapter = new IndexedDBStorage();
