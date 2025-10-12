import { Bench } from 'tinybench';
import { localStorageAdapter, memoryStorageAdapter } from '@svelte-dev/persist';

// Mock localStorage for Node.js
if (typeof localStorage === 'undefined') {
  global.localStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
}

const bench = new Bench({ time: 1000 });

// Test data
const smallData = JSON.stringify({ id: 1, name: 'John', age: 30 });
const mediumData = JSON.stringify(
  Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random(),
  }))
);
const largeData = JSON.stringify(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random(),
    nested: {
      a: i,
      b: i * 2,
      c: i * 3,
    },
  }))
);

console.log('📊 Running performance benchmarks...\n');

// localStorage benchmarks
bench
  .add('localStorage: write small data', () => {
    localStorageAdapter.set('test-small', smallData);
  })
  .add('localStorage: read small data', () => {
    localStorageAdapter.get('test-small');
  })
  .add('localStorage: write medium data (100 items)', () => {
    localStorageAdapter.set('test-medium', mediumData);
  })
  .add('localStorage: read medium data (100 items)', () => {
    localStorageAdapter.get('test-medium');
  })
  .add('localStorage: write large data (1000 items)', () => {
    localStorageAdapter.set('test-large', largeData);
  })
  .add('localStorage: read large data (1000 items)', () => {
    localStorageAdapter.get('test-large');
  });

// Memory storage benchmarks
bench
  .add('memory: write small data', () => {
    memoryStorageAdapter.set('test-small', smallData);
  })
  .add('memory: read small data', () => {
    memoryStorageAdapter.get('test-small');
  })
  .add('memory: write large data', () => {
    memoryStorageAdapter.set('test-large', largeData);
  })
  .add('memory: read large data', () => {
    memoryStorageAdapter.get('test-large');
  });

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    'Task Name': task.name,
    'ops/sec': parseInt(task.result.hz).toLocaleString(),
    'Average Time (ms)': task.result.mean.toFixed(4),
    'Margin': `±${task.result.rme.toFixed(2)}%`,
  }))
);

console.log('\n✅ Benchmark complete!');
