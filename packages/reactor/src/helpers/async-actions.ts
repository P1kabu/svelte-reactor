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

  /**
   * How to handle concurrent requests for the same action
   * - 'replace': Cancel previous request, run new one (default for debounced)
   * - 'queue': Wait for previous to finish before starting new one
   * - 'parallel': Allow all to run concurrently (default)
   * @default 'parallel'
   */
  concurrency?: 'replace' | 'queue' | 'parallel';
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
    concurrency = 'parallel',
  } = options;

  // Retry defaults
  const retryAttempts = retryOptions?.attempts ?? 3;
  const retryDelay = retryOptions?.delay ?? 1000;
  const retryBackoff = retryOptions?.backoff ?? 'exponential';
  const retryOn = retryOptions?.retryOn ?? (() => true);

  // Store debounce timers and abort controllers per action
  const debounceTimers = new Map<string, any>();
  const abortControllers = new Map<string, AbortController>();

  // Track active requests per action for concurrency control
  const activeRequests = new Map<string, { id: number; promise: Promise<any> }>();
  const requestCounters = new Map<string, number>();

  // Track pending operations count for accurate loading state
  const pendingCounts = new Map<string, number>();

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

      // Generate unique request ID for this invocation
      const currentCounter = (requestCounters.get(name) ?? 0) + 1;
      requestCounters.set(name, currentCounter);
      const requestId = currentCounter;

      // Create abort controller if available
      if (typeof AbortController !== 'undefined') {
        abortController = new AbortController();
        abortControllers.set(name, abortController);
      }

      // Handle concurrency modes
      const effectiveConcurrency = debounceDelay ? 'replace' : concurrency;

      // For 'replace' mode, cancel previous request
      if (effectiveConcurrency === 'replace') {
        const existing = activeRequests.get(name);
        if (existing) {
          const existingAbort = abortControllers.get(name);
          if (existingAbort) {
            existingAbort.abort();
          }
        }
      }

      // Helper to increment/decrement pending count
      const incrementPending = () => {
        pendingCounts.set(name, (pendingCounts.get(name) ?? 0) + 1);
      };
      const decrementPending = () => {
        const current = pendingCounts.get(name) ?? 1;
        pendingCounts.set(name, Math.max(0, current - 1));
      };
      const hasPendingRequests = () => (pendingCounts.get(name) ?? 0) > 0;

      const executeAction = async (): Promise<any> => {
        // For 'queue' mode, wait for previous request to complete
        if (effectiveConcurrency === 'queue') {
          const existing = activeRequests.get(name);
          if (existing) {
            try {
              await existing.promise;
            } catch {
              // Ignore errors from previous request
            }
          }
        }

        if (cancelled) {
          throw new Error(
            `[asyncActions:${name}] Action cancelled.\n` +
            `  Action: ${name}\n` +
            `  Reason: cancel() was called before action started\n\n` +
            `Tip: Handle cancellation in your code:\n` +
            `  try { await actions.${name}(); }\n` +
            `  catch (error) { /* Handle cancellation */ }`
          );
        }

        incrementPending();

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

          // Check if this request is still the latest (race condition prevention)
          const latestRequestId = requestCounters.get(name) ?? 0;
          const isStale = effectiveConcurrency === 'replace' && requestId !== latestRequestId;

          if (cancelled || isStale) {
            decrementPending();
            if (isStale) {
              // Silently ignore stale responses - don't update state
              return result;
            }
            throw new Error(
              `[asyncActions:${name}] Action cancelled.\n` +
              `  Action: ${name}\n` +
              `  Reason: cancel() was called during action execution\n\n` +
              `Tip: Check for cancellation in long-running operations:\n` +
              `  if (abortController.signal.aborted) return;`
            );
          }

          decrementPending();

          // Apply result to state and clear loading (only if no other pending requests)
          reactor.update((state) => {
            if (result && typeof result === 'object') {
              Object.assign(state, result);
            }
            // Only clear loading if no other pending requests for this action
            if (!hasPendingRequests()) {
              (state as any)[loadingKey] = false;
            }
            (state as any)[errorKey] = null;
          }, `${actionPrefix}:${name}:success`);

          return result;
        } catch (error) {
          decrementPending();

          // Check if this is a stale request
          const latestRequestId = requestCounters.get(name) ?? 0;
          const isStale = effectiveConcurrency === 'replace' && requestId !== latestRequestId;

          if (cancelled || isStale) {
            // Don't update state if cancelled or stale
            throw error;
          }

          // Set error state and clear loading (only if no other pending requests)
          reactor.update((state) => {
            if (!hasPendingRequests()) {
              (state as any)[loadingKey] = false;
            }
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
            } finally {
              // Clean up active request tracking
              activeRequests.delete(name);
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
          } finally {
            // Clean up active request tracking
            activeRequests.delete(name);
          }
        });
      }

      // Track this request for queue mode
      activeRequests.set(name, { id: requestId, promise });

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
