/**
 * Logger middleware for debugging
 */

import type { Middleware, LoggerOptions } from '../types/index.js';

/**
 * Create logger middleware
 */
export function createLoggerMiddleware<T extends object>(
  options?: LoggerOptions
): Middleware<T> {
  const { collapsed = false, filter } = options ?? {};

  return {
    name: 'logger',

    onAfterUpdate(prevState, nextState, action) {
      // Filter actions if provided
      if (filter && !filter(action)) {
        return;
      }

      const groupMethod = collapsed ? 'groupCollapsed' : 'group';
      const actionName = action || 'update';

      console[groupMethod](
        `%c Reactor ${actionName}`,
        'color: #10b981; font-weight: bold; font-size: 11px;'
      );

      console.log(
        '%c prev state',
        'color: #9CA3AF; font-weight: bold;',
        prevState
      );

      console.log(
        '%c next state',
        'color: #3B82F6; font-weight: bold;',
        nextState
      );

      console.groupEnd();
    },

    onError(error) {
      console.error(
        '%c Reactor Error',
        'color: #EF4444; font-weight: bold;',
        error
      );
    },
  };
}
