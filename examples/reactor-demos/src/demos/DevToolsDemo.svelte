<script lang="ts">
  import { createReactor, arrayActions } from 'svelte-reactor';
  import { undoRedo, persist, logger } from 'svelte-reactor/plugins';

  // Sample stores для демонстрації
  const counter = createReactor({ value: 0 }, {
    name: 'counter',
    plugins: [undoRedo()],
    devtools: true
  });

  interface Todo {
    id: number;
    text: string;
    done: boolean;
  }

  const todos = createReactor({ items: [] as Todo[] }, {
    name: 'todos',
    plugins: [persist({ key: 'devtools-todos' }), undoRedo()],
    devtools: true
  });

  const todoActions = arrayActions(todos, 'items', { idKey: 'id' });

  // DevTools State
  let selectedReactor = $state('counter');
  let selectedTab = $state<'state' | 'history' | 'performance' | 'snapshots'>('state');
  let isProfiling = $state(false);
  let profilingData = $state<any[]>([]);
  let snapshots = $state<any[]>([]);

  // History for visualization
  let counterHistory = $state<any[]>([
    { action: 'init', state: { value: 0 }, timestamp: Date.now() - 5000, duration: 0.02 }
  ]);

  let todosHistory = $state<any[]>([
    { action: 'init', state: { items: [] }, timestamp: Date.now() - 8000, duration: 0.03 }
  ]);

  // Subscribe to changes
  counter.subscribe((state) => {
    if (isProfiling) {
      profilingData = [...profilingData, {
        reactor: 'counter',
        state: JSON.parse(JSON.stringify(state)),
        timestamp: Date.now()
      }];
    }
  });

  // Demo actions
  function incrementCounter() {
    const start = performance.now();
    counter.update(s => { s.value++; }, 'increment');
    const duration = performance.now() - start;

    counterHistory = [...counterHistory, {
      action: 'increment',
      state: { value: counter.state.value },
      timestamp: Date.now(),
      duration: duration.toFixed(3)
    }];
  }

  function decrementCounter() {
    const start = performance.now();
    counter.update(s => { s.value--; }, 'decrement');
    const duration = performance.now() - start;

    counterHistory = [...counterHistory, {
      action: 'decrement',
      state: { value: counter.state.value },
      timestamp: Date.now(),
      duration: duration.toFixed(3)
    }];
  }

  function addTodo() {
    const start = performance.now();
    todoActions.add({
      id: Date.now(),
      text: `Task ${todos.state.items.length + 1}`,
      done: false
    });
    const duration = performance.now() - start;

    todosHistory = [...todosHistory, {
      action: 'todos:add',
      state: { items: [...todos.state.items] },
      timestamp: Date.now(),
      duration: duration.toFixed(3)
    }];
  }

  function toggleProfiling() {
    isProfiling = !isProfiling;
    if (isProfiling) {
      profilingData = [];
    }
  }

  function saveSnapshot() {
    const snapshot = {
      id: Date.now(),
      name: `Snapshot ${snapshots.length + 1}`,
      reactors: {
        counter: JSON.parse(JSON.stringify(counter.state)),
        todos: JSON.parse(JSON.stringify(todos.state))
      },
      timestamp: new Date().toLocaleTimeString()
    };
    snapshots = [...snapshots, snapshot];
  }

  function restoreSnapshot(snapshot: any) {
    counter.set(snapshot.reactors.counter);
    todos.set(snapshot.reactors.todos);

    counterHistory = [...counterHistory, {
      action: 'restore-snapshot',
      state: snapshot.reactors.counter,
      timestamp: Date.now(),
      duration: 0.01
    }];
  }

  function timeTravelTo(index: number) {
    const history = selectedReactor === 'counter' ? counterHistory : todosHistory;
    const entry = history[index];

    if (selectedReactor === 'counter') {
      counter.set(entry.state);
    } else {
      todos.set(entry.state);
    }
  }

  // Get current reactor for display
  const currentReactor = $derived(selectedReactor === 'counter' ? counter : todos);
  const currentHistory = $derived(selectedReactor === 'counter' ? counterHistory : todosHistory);

  // Performance stats
  const avgDuration = $derived.by(() => {
    if (currentHistory.length === 0) return 0;
    const sum = currentHistory.reduce((acc, h) => acc + parseFloat(h.duration || 0), 0);
    return (sum / currentHistory.length).toFixed(3);
  });

  const totalUpdates = $derived(currentHistory.length - 1);
</script>

<div class="devtools-demo">
  <div class="demo-header">
    <h1>🛠️ DevTools Enhancement Preview</h1>
    <p>This is how enhanced DevTools will look in future versions!</p>
  </div>

  <div class="devtools-container">
    <!-- Left Panel: App Controls -->
    <div class="app-panel">
      <h2>📱 Demo Application</h2>

      <div class="reactor-demo">
        <h3>Counter Store</h3>
        <div class="demo-display">
          <div class="big-number">{counter.state.value}</div>
          <div class="button-group">
            <button onclick={decrementCounter}>➖ Decrement</button>
            <button onclick={incrementCounter}>➕ Increment</button>
          </div>
        </div>
      </div>

      <div class="reactor-demo">
        <h3>Todos Store</h3>
        <div class="demo-display">
          <div class="todos-mini">
            {#each todos.state.items.slice(0, 3) as todo}
              <div class="todo-mini">{todo.text}</div>
            {/each}
            {#if todos.state.items.length === 0}
              <div class="empty">No todos yet</div>
            {/if}
          </div>
          <button onclick={addTodo}>➕ Add Todo</button>
        </div>
      </div>

      <div class="devtools-controls">
        <h3>⚙️ DevTools Actions</h3>
        <button class="control-btn" onclick={saveSnapshot}>
          💾 Save Snapshot
        </button>
        <button
          class="control-btn"
          class:active={isProfiling}
          onclick={toggleProfiling}
        >
          {isProfiling ? '⏹️ Stop Profiling' : '▶️ Start Profiling'}
        </button>
      </div>
    </div>

    <!-- Right Panel: DevTools UI -->
    <div class="devtools-panel">
      <div class="devtools-header">
        <h2>🔧 Svelte Reactor DevTools</h2>
      </div>

      <!-- Reactor Selector -->
      <div class="reactor-selector">
        <button
          class:active={selectedReactor === 'counter'}
          onclick={() => selectedReactor = 'counter'}
        >
          🔢 Counter
        </button>
        <button
          class:active={selectedReactor === 'todos'}
          onclick={() => selectedReactor = 'todos'}
        >
          📋 Todos
        </button>
      </div>

      <!-- Tabs -->
      <div class="devtools-tabs">
        <button
          class:active={selectedTab === 'state'}
          onclick={() => selectedTab = 'state'}
        >
          📊 State
        </button>
        <button
          class:active={selectedTab === 'history'}
          onclick={() => selectedTab = 'history'}
        >
          🕐 History
        </button>
        <button
          class:active={selectedTab === 'performance'}
          onclick={() => selectedTab = 'performance'}
        >
          📈 Performance
        </button>
        <button
          class:active={selectedTab === 'snapshots'}
          onclick={() => selectedTab = 'snapshots'}
        >
          💾 Snapshots
        </button>
      </div>

      <!-- Content -->
      <div class="devtools-content">
        {#if selectedTab === 'state'}
          <div class="state-view">
            <h3>Current State</h3>
            <pre class="state-json">{JSON.stringify(currentReactor.state, null, 2)}</pre>

            <div class="state-info">
              <div class="info-item">
                <span class="label">Can Undo:</span>
                <span class="value">{currentReactor.canUndo() ? '✅' : '❌'}</span>
              </div>
              <div class="info-item">
                <span class="label">Can Redo:</span>
                <span class="value">{currentReactor.canRedo() ? '✅' : '❌'}</span>
              </div>
              <div class="info-item">
                <span class="label">Total Updates:</span>
                <span class="value">{totalUpdates}</span>
              </div>
            </div>
          </div>

        {:else if selectedTab === 'history'}
          <div class="history-view">
            <h3>Action History</h3>
            <div class="timeline">
              {#each currentHistory as entry, i}
                <div
                  class="timeline-entry"
                  onclick={() => timeTravelTo(i)}
                >
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="action-name">{entry.action}</div>
                    <div class="action-time">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                      <span class="duration">{entry.duration}ms</span>
                    </div>
                    <pre class="action-state">{JSON.stringify(entry.state, null, 2)}</pre>
                  </div>
                </div>
              {/each}
            </div>
          </div>

        {:else if selectedTab === 'performance'}
          <div class="performance-view">
            <h3>Performance Metrics</h3>

            <div class="perf-stats">
              <div class="perf-card">
                <div class="perf-value">{totalUpdates}</div>
                <div class="perf-label">Total Updates</div>
              </div>
              <div class="perf-card">
                <div class="perf-value">{avgDuration}ms</div>
                <div class="perf-label">Avg Duration</div>
              </div>
              <div class="perf-card">
                <div class="perf-value">{currentHistory.length}</div>
                <div class="perf-label">History Size</div>
              </div>
            </div>

            <div class="perf-chart">
              <h4>Update Duration Chart</h4>
              <div class="chart">
                {#each currentHistory.slice(-10) as entry, i}
                  <div class="chart-bar">
                    <div
                      class="bar-fill"
                      style="height: {Math.min(parseFloat(entry.duration || 0) * 20, 100)}%"
                    ></div>
                    <div class="bar-label">{i + 1}</div>
                  </div>
                {/each}
              </div>
            </div>

            {#if isProfiling}
              <div class="profiling-indicator">
                <span class="pulse">🔴</span> Profiling active... ({profilingData.length} samples)
              </div>
            {/if}
          </div>

        {:else if selectedTab === 'snapshots'}
          <div class="snapshots-view">
            <h3>State Snapshots</h3>

            {#if snapshots.length === 0}
              <div class="empty-state">
                No snapshots yet. Click "Save Snapshot" to create one!
              </div>
            {:else}
              <div class="snapshots-list">
                {#each snapshots as snapshot}
                  <div class="snapshot-card">
                    <div class="snapshot-header">
                      <div class="snapshot-name">{snapshot.name}</div>
                      <div class="snapshot-time">{snapshot.timestamp}</div>
                    </div>
                    <div class="snapshot-data">
                      <pre>{JSON.stringify(snapshot.reactors, null, 2)}</pre>
                    </div>
                    <div class="snapshot-actions">
                      <button onclick={() => restoreSnapshot(snapshot)}>
                        ↩️ Restore
                      </button>
                      <button class="danger" onclick={() => {
                        snapshots = snapshots.filter(s => s.id !== snapshot.id);
                      }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .devtools-demo {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .demo-header h1 {
    color: #667eea;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .demo-header p {
    color: #64748b;
    font-size: 1.1rem;
  }

  .devtools-container {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 2rem;
    min-height: 600px;
  }

  /* App Panel */
  .app-panel {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .app-panel h2 {
    color: #1e293b;
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
  }

  .reactor-demo {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid #f1f5f9;
  }

  .reactor-demo:last-of-type {
    border-bottom: none;
  }

  .reactor-demo h3 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .demo-display {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .big-number {
    font-size: 3rem;
    font-weight: bold;
    color: #667eea;
    text-align: center;
    margin-bottom: 1rem;
  }

  .todos-mini {
    min-height: 80px;
    margin-bottom: 1rem;
  }

  .todo-mini {
    background: white;
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .empty {
    text-align: center;
    color: #94a3b8;
    padding: 2rem;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  button:hover {
    background: #5568d3;
    transform: translateY(-1px);
  }

  button.danger {
    background: #ef4444;
  }

  button.danger:hover {
    background: #dc2626;
  }

  .devtools-controls h3 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .control-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .control-btn.active {
    background: #ef4444;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* DevTools Panel */
  .devtools-panel {
    background: #1e293b;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }

  .devtools-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem 1.5rem;
    color: white;
  }

  .devtools-header h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  .reactor-selector {
    background: #334155;
    padding: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  .reactor-selector button {
    flex: 1;
    background: #475569;
  }

  .reactor-selector button.active {
    background: #667eea;
  }

  .devtools-tabs {
    background: #334155;
    padding: 0.5rem 1rem;
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid #475569;
  }

  .devtools-tabs button {
    background: transparent;
    color: #94a3b8;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .devtools-tabs button.active {
    background: #1e293b;
    color: white;
    border-radius: 6px 6px 0 0;
  }

  .devtools-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    color: #e2e8f0;
  }

  /* State View */
  .state-view h3 {
    color: #94a3b8;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .state-json {
    background: #0f172a;
    padding: 1rem;
    border-radius: 6px;
    color: #86efac;
    font-size: 0.9rem;
    overflow-x: auto;
    margin-bottom: 1.5rem;
  }

  .state-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .info-item {
    background: #334155;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
  }

  .info-item .label {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .info-item .value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #e2e8f0;
  }

  /* History View */
  .history-view h3 {
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .timeline {
    position: relative;
  }

  .timeline-entry {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .timeline-entry:hover {
    transform: translateX(4px);
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    background: #667eea;
    border-radius: 50%;
    margin-top: 0.5rem;
    flex-shrink: 0;
  }

  .timeline-content {
    flex: 1;
    background: #334155;
    padding: 1rem;
    border-radius: 6px;
  }

  .action-name {
    font-weight: bold;
    color: #94effd;
    margin-bottom: 0.5rem;
  }

  .action-time {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .duration {
    background: #0f172a;
    padding: 0.125rem 0.5rem;
    border-radius: 3px;
    margin-left: 0.5rem;
  }

  .action-state {
    background: #0f172a;
    padding: 0.75rem;
    border-radius: 4px;
    color: #86efac;
    font-size: 0.75rem;
    overflow-x: auto;
    margin-top: 0.5rem;
  }

  /* Performance View */
  .performance-view h3 {
    color: #94a3b8;
    margin-bottom: 1.5rem;
  }

  .perf-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .perf-card {
    background: #334155;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
  }

  .perf-value {
    font-size: 2rem;
    font-weight: bold;
    color: #94effd;
    margin-bottom: 0.5rem;
  }

  .perf-label {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .perf-chart {
    background: #334155;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .perf-chart h4 {
    color: #94a3b8;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .chart {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    height: 150px;
  }

  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
  }

  .bar-fill {
    width: 100%;
    background: linear-gradient(to top, #667eea, #94effd);
    border-radius: 4px 4px 0 0;
    min-height: 2px;
    transition: height 0.3s;
  }

  .bar-label {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .profiling-indicator {
    background: #334155;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    color: #94a3b8;
  }

  .pulse {
    display: inline-block;
    animation: pulse 1s infinite;
  }

  /* Snapshots View */
  .snapshots-view h3 {
    color: #94a3b8;
    margin-bottom: 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }

  .snapshots-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .snapshot-card {
    background: #334155;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .snapshot-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .snapshot-name {
    font-weight: bold;
    color: #94effd;
  }

  .snapshot-time {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .snapshot-data pre {
    background: #0f172a;
    padding: 1rem;
    border-radius: 6px;
    color: #86efac;
    font-size: 0.8rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .snapshot-actions {
    display: flex;
    gap: 0.5rem;
  }

  .snapshot-actions button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
</style>
