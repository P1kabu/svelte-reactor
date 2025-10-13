<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo, logger } from '@svelte-dev/reactor/plugins';

  interface CounterState {
    value: number;
    step: number;
  }

  const counter = createReactor<CounterState>(
    {
      value: 0,
      step: 1,
    },
    {
      name: 'counter',
      plugins: [
        undoRedo({ limit: 50 }),
        logger({ collapsed: true }),
      ],
    }
  );

  function increment() {
    counter.update((state) => {
      state.value += state.step;
    }, 'increment');
  }

  function decrement() {
    counter.update((state) => {
      state.value -= state.step;
    }, 'decrement');
  }

  function reset() {
    counter.set({ value: 0 });
  }

  function setStep(value: number) {
    counter.update((state) => {
      state.step = value;
    }, 'set-step');
  }

  // Get history for display
  let history = $derived(counter.getHistory());
</script>

<div class="demo">
  <div class="demo-header">
    <h2>Counter Demo</h2>
    <p>Simple counter with undo/redo and history tracking</p>
  </div>

  <div class="counter-display">
    <div class="value">{counter.state.value}</div>
    <div class="step-info">Step: {counter.state.step}</div>
  </div>

  <div class="controls">
    <button class="btn btn-primary" onclick={decrement}>
      <span class="icon">-</span>
      Decrement
    </button>

    <button class="btn btn-primary" onclick={increment}>
      <span class="icon">+</span>
      Increment
    </button>

    <button class="btn btn-secondary" onclick={reset}>
      <span class="icon">↻</span>
      Reset
    </button>
  </div>

  <div class="step-controls">
    <label>
      Step size:
      <input
        type="range"
        min="1"
        max="10"
        value={counter.state.step}
        oninput={(e) => setStep(parseInt(e.currentTarget.value))}
      />
    </label>
  </div>

  <div class="undo-redo">
    <button
      class="btn btn-undo"
      onclick={() => counter.undo()}
      disabled={!counter.canUndo()}
    >
      ← Undo
    </button>

    <button
      class="btn btn-redo"
      onclick={() => counter.redo()}
      disabled={!counter.canRedo()}
    >
      Redo →
    </button>
  </div>

  <div class="history">
    <h3>History ({history.length} entries)</h3>
    {#if history.length > 0}
      <div class="history-list">
        {#each history.slice(-10).reverse() as entry, i}
          <div class="history-item">
            <span class="history-action">{entry.action || 'update'}</span>
            <span class="history-value">value: {entry.state.value}</span>
            <span class="history-time">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty">No history yet. Try incrementing!</p>
    {/if}
  </div>

  <div class="code-block">
    <h3>Code</h3>
    <pre><code>{`const counter = createReactor(
  { value: 0, step: 1 },
  {
    plugins: [
      undoRedo({ limit: 50 }),
      logger({ collapsed: true }),
    ],
  }
);

counter.update((state) => {
  state.value += state.step;
}, 'increment');

counter.undo(); // Go back
counter.redo(); // Go forward`}</code></pre>
  </div>
</div>

<style>
  .demo {
    max-width: 800px;
    margin: 0 auto;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .demo-header h2 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .demo-header p {
    color: #666;
    font-size: 1.1rem;
  }

  .counter-display {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .value {
    font-size: 5rem;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 0.5rem;
  }

  .step-info {
    font-size: 1.2rem;
    color: #666;
  }

  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #d0d0d0;
  }

  .icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .step-controls {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .step-controls label {
    display: block;
    font-weight: 600;
    color: #333;
  }

  .step-controls input[type='range'] {
    width: 100%;
    margin-top: 0.5rem;
  }

  .undo-redo {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .btn-undo,
  .btn-redo {
    background: #f0f4ff;
    color: #667eea;
    border: 2px solid #667eea;
  }

  .btn-undo:hover:not(:disabled),
  .btn-redo:hover:not(:disabled) {
    background: #667eea;
    color: white;
  }

  .history {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .history h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .history-action {
    font-weight: 600;
    color: #667eea;
  }

  .history-value {
    color: #666;
  }

  .history-time {
    color: #999;
    font-size: 0.8rem;
  }

  .empty {
    color: #999;
    text-align: center;
    padding: 2rem;
  }

  .code-block {
    background: #1e1e1e;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-x: auto;
  }

  .code-block h3 {
    color: white;
    margin-bottom: 1rem;
  }

  .code-block pre {
    margin: 0;
  }

  .code-block code {
    color: #d4d4d4;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
  }
</style>
