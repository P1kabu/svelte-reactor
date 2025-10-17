<script lang="ts">
  import { createReactor, arrayActions, asyncActions } from 'svelte-reactor';
  import { undoRedo, persist, logger } from 'svelte-reactor/plugins';
  import { onDestroy } from 'svelte';

  // Test 1: Memory Leak Fix - Reactor with cleanup
  let memoryTestReactor = $state<any>(null);
  let reactorCount = $state(0);

  interface LogEntry {
    message: string;
    type: 'info' | 'success' | 'error';
    time: string;
  }

  let logs = $state<LogEntry[]>([]);

  function addLog(message: string, type: LogEntry['type'] = 'info') {
    logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
  }

  function createTestReactor() {
    if (memoryTestReactor) {
      memoryTestReactor.destroy();
      addLog('✅ Previous reactor destroyed (subscribers & middlewares cleared)', 'success');
    }

    memoryTestReactor = createReactor(
      { value: 0 },
      {
        name: `test-reactor-${reactorCount}`,
        plugins: [logger({ collapsed: true })],
        devtools: true
      }
    );

    reactorCount++;
    addLog(`🆕 Created reactor #${reactorCount}`, 'success');
  }

  // Test 2: Performance - Skip unnecessary updates
  const perfTest = createReactor({ count: 0, updates: 0 }, {
    name: 'performance-test',
    devtools: true
  });

  let perfSubscriptions = $state(0);
  perfTest.subscribe(() => {
    perfSubscriptions++;
  });

  function testPerformance() {
    const before = perfSubscriptions;

    // This should NOT trigger update (same value)
    perfTest.update(s => {
      s.count = s.count;
    });

    // This SHOULD trigger update (different value)
    perfTest.update(s => {
      s.count++;
      s.updates++;
    });

    const skipped = perfSubscriptions - before === 1;
    addLog(
      skipped
        ? '✅ Performance: Skipped unnecessary update!'
        : '❌ Performance: Did not skip update',
      skipped ? 'success' : 'error'
    );
  }

  // Test 3: Error Handling
  function testErrorHandling() {
    try {
      createReactor(null as any);
      addLog('❌ Error handling failed: accepted null', 'error');
    } catch (e: any) {
      addLog('✅ Error handling: ' + e.message.substring(0, 50), 'success');
    }

    try {
      const test = createReactor({ value: 0 });
      test.update('not a function' as any);
      addLog('❌ Error handling failed: accepted string', 'error');
    } catch (e: any) {
      addLog('✅ Error handling: ' + e.message.substring(0, 50), 'success');
    }
  }

  // Test 4: Array Actions Helper
  interface Todo {
    id: number;
    text: string;
    done: boolean;
  }

  const todos = createReactor({ items: [] as Todo[] }, {
    name: 'todos-test',
    plugins: [
      persist({ key: 'test-todos' }),
      undoRedo({ limit: 50 })
    ],
    devtools: true
  });

  const todoActions = arrayActions(todos, 'items', { idKey: 'id' });

  function addTodo() {
    const text = prompt('Enter todo:');
    if (text) {
      todoActions.add({
        id: Date.now(),
        text,
        done: false
      });
      addLog(`✅ Added todo: "${text}"`, 'success');
    }
  }

  function toggleTodo(id: number) {
    todoActions.toggle(id, 'done');
    addLog(`✅ Toggled todo #${id}`, 'success');
  }

  function removeTodo(id: number) {
    todoActions.remove(id);
    addLog(`✅ Removed todo #${id}`, 'success');
  }

  // Test 5: Async Actions Helper
  interface User {
    id: number;
    name: string;
  }

  const apiTest = createReactor({
    users: [] as User[],
    loading: false,
    error: null as Error | null
  }, {
    name: 'api-test',
    devtools: true
  });

  const api = asyncActions(apiTest, {
    fetchUsers: async () => {
      addLog('📡 Fetching users...', 'info');
      await new Promise(r => setTimeout(r, 1000));

      // Simulate API
      const users: User[] = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];

      return { users };
    },

    failedRequest: async () => {
      addLog('📡 Attempting failed request...', 'info');
      await new Promise(r => setTimeout(r, 500));
      throw new Error('API Error: Server unavailable');
    }
  });

  async function testAsyncActions(shouldFail = false) {
    try {
      if (shouldFail) {
        await api.failedRequest();
      } else {
        await api.fetchUsers();
        addLog(`✅ Loaded ${apiTest.state.users.length} users`, 'success');
      }
    } catch (error: any) {
      addLog(`✅ Error caught: ${error.message}`, 'success');
    }
  }

  // Cleanup on unmount
  onDestroy(() => {
    if (memoryTestReactor) {
      memoryTestReactor.destroy();
    }
    todos.destroy();
    perfTest.destroy();
    apiTest.destroy();
    addLog('🧹 All reactors cleaned up!', 'success');
  });
</script>

<div class="test-page">
  <h1>🧪 Svelte Reactor v0.2.2 Test Demo</h1>
  <p class="version">Testing critical bug fixes, performance, and new features</p>

  <div class="grid">
    <!-- Test 1: Memory Leaks -->
    <div class="card">
      <h2>🧠 Memory Management <span class="badge fix">v0.2.2 Fix</span></h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{reactorCount}</div>
          <div class="stat-label">Reactors Created</div>
        </div>
      </div>
      <div class="button-group">
        <button onclick={createTestReactor}>Create Reactor</button>
        <button class="danger" onclick={() => {
          if (memoryTestReactor) {
            memoryTestReactor.destroy();
            memoryTestReactor = null;
            addLog('🗑️ Reactor destroyed manually', 'success');
          }
        }}>Destroy Current</button>
      </div>
      <p class="description">
        Creates and destroys reactors. v0.2.2 properly clears subscribers & middlewares!
      </p>
    </div>

    <!-- Test 2: Performance -->
    <div class="card">
      <h2>⚡ Performance <span class="badge fix">v0.2.2 Fix</span></h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{perfTest.state.count}</div>
          <div class="stat-label">Count</div>
        </div>
        <div class="stat">
          <div class="stat-value">{perfTest.state.updates}</div>
          <div class="stat-label">Updates</div>
        </div>
        <div class="stat">
          <div class="stat-value">{perfSubscriptions}</div>
          <div class="stat-label">Subscriptions</div>
        </div>
      </div>
      <div class="button-group">
        <button onclick={testPerformance}>Test Skip Logic</button>
        <button onclick={() => perfTest.update(s => { s.count++; s.updates++; })}>
          Force Update
        </button>
      </div>
      <p class="description">
        v0.2.2 skips unnecessary updates when state unchanged!
      </p>
    </div>

    <!-- Test 3: Error Handling -->
    <div class="card">
      <h2>🛡️ Error Handling <span class="badge fix">v0.2.2 Fix</span></h2>
      <div class="button-group">
        <button onclick={testErrorHandling}>Test Validation</button>
      </div>
      <p class="description">
        v0.2.2 provides helpful validation and context-aware error messages!
      </p>
    </div>

    <!-- Test 4: Array Actions -->
    <div class="card">
      <h2>📋 Array Actions <span class="badge new">Helper</span></h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{todoActions.count()}</div>
          <div class="stat-label">Todos</div>
        </div>
      </div>
      <div class="button-group">
        <button class="success" onclick={addTodo}>Add Todo</button>
        <button onclick={() => todos.undo()} disabled={!todos.canUndo()}>
          Undo
        </button>
        <button onclick={() => todos.redo()} disabled={!todos.canRedo()}>
          Redo
        </button>
        <button class="danger" onclick={() => {
          todoActions.clear();
          addLog('🗑️ Cleared all todos', 'success');
        }}>
          Clear All
        </button>
      </div>

      <div class="todo-list">
        {#each todos.state.items as todo (todo.id)}
          <div class="todo-item" class:done={todo.done}>
            <input
              type="checkbox"
              checked={todo.done}
              onchange={() => toggleTodo(todo.id)}
            />
            <span class="todo-text">{todo.text}</span>
            <button class="danger small" onclick={() => removeTodo(todo.id)}>×</button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Test 5: Async Actions -->
    <div class="card">
      <h2>🌐 Async Actions <span class="badge new">Helper</span></h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{apiTest.state.users.length}</div>
          <div class="stat-label">Users</div>
        </div>
        <div class="stat">
          <div class="stat-value">{apiTest.state.loading ? '⏳' : '✅'}</div>
          <div class="stat-label">Status</div>
        </div>
      </div>
      <div class="button-group">
        <button
          class="success"
          onclick={() => testAsyncActions(false)}
          disabled={apiTest.state.loading}
        >
          Fetch Users
        </button>
        <button
          class="danger"
          onclick={() => testAsyncActions(true)}
          disabled={apiTest.state.loading}
        >
          Test Error
        </button>
      </div>

      {#if apiTest.state.error}
        <div class="error-message">
          ❌ {apiTest.state.error.message}
        </div>
      {/if}

      {#if apiTest.state.users.length > 0}
        <div class="user-list">
          {#each apiTest.state.users as user}
            <div class="user-item">
              👤 {user.name}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Activity Log -->
  <div class="card log-card">
    <h2>📊 Activity Log</h2>
    <div class="log">
      {#each logs as log}
        <div class="log-entry {log.type}">
          <span class="log-time">[{log.time}]</span> {log.message}
        </div>
      {/each}
      {#if logs.length === 0}
        <div class="empty-log">
          No activity yet. Try the buttons above! 👆
        </div>
      {/if}
    </div>
    <button onclick={() => { logs = []; }}>
      Clear Log
    </button>
  </div>
</div>

<style>
  .test-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
  }

  .version {
    text-align: center;
    color: #64748b;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card h2 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #10b981;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .badge.new { background: #f59e0b; }
  .badge.fix { background: #ef4444; }

  button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background 0.2s;
    margin: 0.25rem;
  }

  button:hover { background: #5568d3; }
  button:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  button.danger { background: #ef4444; }
  button.danger:hover { background: #dc2626; }

  button.success { background: #10b981; }
  button.success:hover { background: #059669; }

  button.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .stat {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 6px;
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    margin-top: 0.25rem;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .description {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #64748b;
  }

  .todo-list {
    margin-top: 1rem;
    max-height: 150px;
    overflow-y: auto;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 6px;
    margin: 0.5rem 0;
  }

  .todo-item.done {
    opacity: 0.6;
  }

  .todo-item.done .todo-text {
    text-decoration: line-through;
  }

  .todo-text {
    flex: 1;
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.5rem;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .user-list {
    margin-top: 1rem;
  }

  .user-item {
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 6px;
    margin: 0.25rem 0;
  }

  .log-card {
    grid-column: 1 / -1;
  }

  .log {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    max-height: 200px;
    overflow-y: auto;
    margin-top: 1rem;
  }

  .log-entry {
    margin: 0.25rem 0;
    padding: 0.25rem;
    border-left: 2px solid #667eea;
    padding-left: 0.5rem;
  }

  .log-entry.success {
    border-color: #10b981;
    color: #86efac;
  }

  .log-entry.error {
    border-color: #ef4444;
    color: #fca5a5;
  }

  .log-time {
    color: #94a3b8;
  }

  .empty-log {
    color: #64748b;
    text-align: center;
    padding: 2rem;
  }
</style>
