/**
 * Async Actions Helper - Handle async operations with automatic loading/error states
 */

import type { Reactor } from '../types/index.js';

export interface AsyncState {
  loading: boolean;
  error: Error | null;
}

export interface AsyncActionOptions {
  /**
   * Field name for loading state
   * @default 'loading'
   */
  loadingKey?: string;

  /**
   * Field name for error state
   * @default 'error'
   */
  errorKey?: string;

  /**
   * Action prefix for undo/redo history
   * @default 'async'
   */
  actionPrefix?: string;

  /**
   * Reset error on new request
   * @default true
   */
  resetErrorOnStart?: boolean;
}

export type AsyncAction<T, Args extends any[]> = (...args: Args) => Promise<T>;

export type AsyncActions<T extends Record<string, AsyncAction<any, any>>> = {
  [K in keyof T]: T[K] extends AsyncAction<infer R, infer Args>
    ? (...args: Args) => Promise<R>
    : never;
};

/**
 * Create async actions helper for a reactor
 *
 * @example
 * ```typescript
 * const store = createReactor({
 *   users: [],
 *   loading: false,
 *   error: null
 * });
 *
 * const api = asyncActions(store, {
 *   fetchUsers: async () => {
 *     const response = await fetch('/api/users');
 *     return { users: await response.json() };
 *   },
 *   createUser: async (name: string) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify({ name })
 *     });
 *     return { users: [...store.state.users, await response.json()] };
 *   }
 * });
 *
 * // Usage - automatically handles loading & error states
 * await api.fetchUsers();
 * await api.createUser('John');
 * ```
 */
export function asyncActions<
  S extends object,
  T extends Record<string, AsyncAction<any, any>>
>(
  reactor: Reactor<S>,
  actions: T,
  options: AsyncActionOptions = {}
): AsyncActions<T> {
  const {
    loadingKey = 'loading',
    errorKey = 'error',
    actionPrefix = 'async',
    resetErrorOnStart = true,
  } = options;

  const wrappedActions: any = {};

  for (const [name, action] of Object.entries(actions)) {
    wrappedActions[name] = async (...args: any[]) => {
      // Set loading state and optionally reset error
      reactor.update((state) => {
        (state as any)[loadingKey] = true;
        if (resetErrorOnStart) {
          (state as any)[errorKey] = null;
        }
      }, `${actionPrefix}:${name}:start`);

      try {
        // Execute the async action
        const result = await action(...args);

        // Apply result to state and clear loading
        reactor.update((state) => {
          if (result && typeof result === 'object') {
            Object.assign(state, result);
          }
          (state as any)[loadingKey] = false;
          (state as any)[errorKey] = null;
        }, `${actionPrefix}:${name}:success`);

        return result;
      } catch (error) {
        // Set error state and clear loading
        reactor.update((state) => {
          (state as any)[loadingKey] = false;
          (state as any)[errorKey] = error instanceof Error ? error : new Error(String(error));
        }, `${actionPrefix}:${name}:error`);

        throw error;
      }
    };
  }

  return wrappedActions as AsyncActions<T>;
}
