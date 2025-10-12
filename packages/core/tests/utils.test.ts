import { describe, it, expect } from 'vitest';
import { serializeValue, deserializeValue } from '../src/utils/serializer.js';
import { debounce } from '../src/utils/debounce.js';
import { runMigrations } from '../src/utils/migrations.js';

describe('serializer', () => {
  it('should serialize and deserialize values', () => {
    const value = { name: 'John', age: 30 };
    const serialized = serializeValue(value, 1);
    const deserialized = deserializeValue(serialized);

    expect(deserialized?.value).toEqual(value);
    expect(deserialized?.__version).toBe(1);
  });

  it('should handle legacy data without metadata', () => {
    const legacyData = JSON.stringify({ name: 'John' });
    const deserialized = deserializeValue(legacyData);

    expect(deserialized?.value).toEqual({ name: 'John' });
    expect(deserialized?.__version).toBe(1);
  });

  it('should return null for invalid JSON', () => {
    const deserialized = deserializeValue('invalid json');
    expect(deserialized).toBeNull();
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 50);

    fn();
    fn();
    fn();

    expect(callCount).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(callCount).toBe(1);
  });
});

describe('migrations', () => {
  it('should run migrations in order', () => {
    const data = { name: 'John' };
    const migrations = {
      2: (d: any) => ({ ...d, age: 30 }),
      3: (d: any) => ({ ...d, email: 'john@example.com' }),
    };

    const migrated = runMigrations(data, 1, 3, migrations);

    expect(migrated).toEqual({
      name: 'John',
      age: 30,
      email: 'john@example.com',
    });
  });

  it('should skip migrations if no migration function exists', () => {
    const data = { name: 'John' };
    const migrations = {
      3: (d: any) => ({ ...d, age: 30 }),
    };

    const migrated = runMigrations(data, 1, 3, migrations);

    expect(migrated).toEqual({
      name: 'John',
      age: 30,
    });
  });
});
