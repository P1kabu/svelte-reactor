import { describe, it, expect, beforeEach } from 'vitest';
import {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
} from '../src/storages/index.js';
import { QuotaExceededError } from '../src/types/index.js';

describe('localStorage adapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should get and set values', () => {
    localStorageAdapter.set('test-key', 'test-value');
    expect(localStorageAdapter.get('test-key')).toBe('test-value');
  });

  it('should return null for non-existent keys', () => {
    expect(localStorageAdapter.get('non-existent')).toBeNull();
  });

  it('should remove values', () => {
    localStorageAdapter.set('test-key', 'test-value');
    localStorageAdapter.remove('test-key');
    expect(localStorageAdapter.get('test-key')).toBeNull();
  });

  it('should clear all values', () => {
    localStorageAdapter.set('key1', 'value1');
    localStorageAdapter.set('key2', 'value2');
    localStorageAdapter.clear();
    expect(localStorageAdapter.get('key1')).toBeNull();
    expect(localStorageAdapter.get('key2')).toBeNull();
  });
});

describe('sessionStorage adapter', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should get and set values', () => {
    sessionStorageAdapter.set('test-key', 'test-value');
    expect(sessionStorageAdapter.get('test-key')).toBe('test-value');
  });

  it('should return null for non-existent keys', () => {
    expect(sessionStorageAdapter.get('non-existent')).toBeNull();
  });

  it('should remove values', () => {
    sessionStorageAdapter.set('test-key', 'test-value');
    sessionStorageAdapter.remove('test-key');
    expect(sessionStorageAdapter.get('test-key')).toBeNull();
  });
});

describe('memory adapter', () => {
  beforeEach(() => {
    memoryStorageAdapter.clear();
  });

  it('should get and set values', () => {
    memoryStorageAdapter.set('test-key', 'test-value');
    expect(memoryStorageAdapter.get('test-key')).toBe('test-value');
  });

  it('should return null for non-existent keys', () => {
    expect(memoryStorageAdapter.get('non-existent')).toBeNull();
  });

  it('should remove values', () => {
    memoryStorageAdapter.set('test-key', 'test-value');
    memoryStorageAdapter.remove('test-key');
    expect(memoryStorageAdapter.get('test-key')).toBeNull();
  });

  it('should clear all values', () => {
    memoryStorageAdapter.set('key1', 'value1');
    memoryStorageAdapter.set('key2', 'value2');
    memoryStorageAdapter.clear();
    expect(memoryStorageAdapter.get('key1')).toBeNull();
    expect(memoryStorageAdapter.get('key2')).toBeNull();
  });
});
