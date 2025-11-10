/**
 * Async Actions Helper - Handle async operations with automatic loading/error states
 */

import type { Reactor } from '../types/index.js';

export interface AsyncState {
  loading: boolean;
  error: Error | null;
}

export interface RetryOptions {
  /**
   * Number of retry attempts
   * @default 3
   */
  attempts?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  delay?: number;

  /**
   * Backoff strategy
   * - 'linear': delay, delay, delay...
   * - 'exponential': delay, delay*2, delay*4...
   * @default 'exponential'
   */
  backoff?: 'linear' | 'exponential';

  /**
   * Custom function to determine if should retry
   * @default retry on all errors
   */
  retryOn?: (error: Error) => boolean;
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

  /**
   * Retry configuration
   */
  retry?: RetryOptions;

  /**
   * Debounce delay in milliseconds
   * Delays execution and cancels previous pending calls
   */
  debounce?: number;
}

export type AsyncAction<T, Args extends any[]> = (...args: Args) => Promise<T>;

export interface AsyncController<T> extends Promise<T> {
  /**
   * Cancel the async operation
   */
  cancel: () => void;

  /**
   * AbortController for the operation (if supported)
   */
  abort?: AbortController;
}

export type AsyncActions<T extends Record<string, AsyncAction<any, any>>> = {
  [K in keyof T]: T[K] extends AsyncAction<infer R, infer Args>
    ? (...args: Args) => AsyncController<R>
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
    retry: retryOptions,
    debounce: debounceDelay,
  } = options;

  // Retry defaults
  const retryAttempts = retryOptions?.attempts ?? 3;
  const retryDelay = retryOptions?.delay ?? 1000;
  const retryBackoff = retryOptions?.backoff ?? 'exponential';
  const retryOn = retryOptions?.retryOn ?? (() => true);

  // Store debounce timers and abort controllers per action
  const debounceTimers = new Map<string, any>();
  const abortControllers = new Map<string, AbortController>();

  // Helper: sleep function
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper: calculate retry delay with backoff
  const getRetryDelay = (attempt: number): number => {
    if (retryBackoff === 'exponential') {
      return retryDelay * Math.pow(2, attempt);
    }
    return retryDelay;
  };

  // Helper: execute with retry
  const executeWithRetry = async <R>(
    fn: () => Promise<R>,
    actionName: string
  ): Promise<R> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        // Check if should retry
        const shouldRetry = attempt < retryAttempts && (!retryOptions || retryOn(err));

        if (!shouldRetry) {
          throw err;
        }

        // Wait before retry with backoff
        const delay = getRetryDelay(attempt);
        await sleep(delay);
      }
    }

    throw lastError;
  };

  const wrappedActions: any = {};

  for (const [name, action] of Object.entries(actions)) {
    wrappedActions[name] = (...args: any[]) => {
      let cancelled = false;
      let abortController: AbortController | undefined;

      // Create abort controller if available
      if (typeof AbortController !== 'undefined') {
        abortController = new AbortController();
        abortControllers.set(name, abortController);
      }

      const executeAction = async (): Promise<any> => {
        if (cancelled) {
          throw new Error('Action cancelled');
        }

        // Set loading state and optionally reset error
        reactor.update((state) => {
          (state as any)[loadingKey] = true;
          if (resetErrorOnStart) {
            (state as any)[errorKey] = null;
          }
        }, `${actionPrefix}:${name}:start`);

        try {
          // Execute with retry if configured
          const result = retryOptions
            ? await executeWithRetry(() => action(...args), name)
            : await action(...args);

          if (cancelled) {
            throw new Error('Action cancelled');
          }

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
          if (cancelled) {
            // Don't update state if cancelled
            throw error;
          }

          // Set error state and clear loading
          reactor.update((state) => {
            (state as any)[loadingKey] = false;
            (state as any)[errorKey] = error instanceof Error ? error : new Error(String(error));
          }, `${actionPrefix}:${name}:error`);

          throw error;
        }
      };

      // Handle debounce
      let promise: Promise<any>;
      let promiseReject: ((reason?: any) => void) | null = null;

      if (debounceDelay && debounceDelay > 0) {
        // Cancel previous debounced call
        const existingTimer = debounceTimers.get(name);
        if (existingTimer) {
          clearTimeout(existingTimer.timer);
          if (existingTimer.reject) {
            existingTimer.reject(new Error('Action cancelled by new call'));
          }
        }

        // Cancel previous action
        const existingAbort = abortControllers.get(name);
        if (existingAbort) {
          existingAbort.abort();
        }

        // Create debounced promise
        promise = new Promise((resolve, reject) => {
          promiseReject = reject;
          const timer = setTimeout(async () => {
            debounceTimers.delete(name);
            try {
              const result = await executeAction();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, debounceDelay);

          debounceTimers.set(name, { timer, reject });
        });
      } else {
        // Wrap executeAction in a promise to capture reject function
        promise = new Promise(async (resolve, reject) => {
          promiseReject = reject;
          try {
            const result = await executeAction();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }

      // Create controller with cancel method
      const controller: any = promise;
      controller.cancel = () => {
        cancelled = true;

        // Cancel debounce timer and reject promise
        const timerData = debounceTimers.get(name);
        if (timerData) {
          clearTimeout(timerData.timer);
          debounceTimers.delete(name);
          if (timerData.reject) {
            timerData.reject(new Error('Action cancelled'));
          }
        }

        // Reject the main promise if available
        if (promiseReject) {
          promiseReject(new Error('Action cancelled'));
        }

        // Abort if available
        if (abortController) {
          abortController.abort();
        }
      };
      controller.abort = abortController;

      return controller as AsyncController<any>;
    };
  }

  return wrappedActions as AsyncActions<T>;
}
