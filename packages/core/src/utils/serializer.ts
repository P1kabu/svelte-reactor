import type { Serializer, PersistedData } from '../types/index.js';

/**
 * Default JSON serializer
 */
export const defaultSerializer: Serializer<any> = {
  stringify: JSON.stringify,
  parse: JSON.parse,
};

/**
 * Serialize value with metadata
 */
export function serializeValue<T>(
  value: T,
  version?: number,
  serializer: Serializer<T> = defaultSerializer
): string {
  const data: PersistedData<T> = {
    value,
    __version: version,
    __timestamp: Date.now(),
  };
  return serializer.stringify(data as T);
}

/**
 * Deserialize value with metadata
 */
export function deserializeValue<T>(
  str: string,
  serializer: Serializer<T> = defaultSerializer
): PersistedData<T> | null {
  try {
    const parsed = serializer.parse(str);

    // Handle legacy data without metadata wrapper
    if (parsed && typeof parsed === 'object' && 'value' in parsed) {
      return parsed as PersistedData<T>;
    }

    // Legacy format: just the raw value
    return {
      value: parsed as T,
      __version: 1,
    };
  } catch {
    return null;
  }
}
