<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { persist, undoRedo, logger } from 'svelte-reactor/plugins';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
  }

  interface TodoState {
    items: Todo[];
    filter: 'all' | 'active' | 'completed';
  }

  const todos = createReactor<TodoState>(
    {
      items: [],
      filter: 'all',
    },
    {
      name: 'todos',
      plugins: [
        persist({ key: 'reactor-todos', debounce: 300 }),
        undoRedo({ limit: 100 }),
        logger({ collapsed: true }),
      ],
    }
  );

  let newTodoText = $state('');

  function addTodo() {
    if (!newTodoText.trim()) return;

    todos.update((state) => {
      state.items.push({
        id: crypto.randomUUID(),
        text: newTodoText.trim(),
        done: false,
        createdAt: Date.now(),
      });
    }, 'add-todo');

    newTodoText = '';
  }

  function toggleTodo(id: string) {
    todos.update((state) => {
      const todo = state.items.find((t) => t.id === id);
      if (todo) todo.done = !todo.done;
    }, 'toggle-todo');
  }

  function deleteTodo(id: string) {
    todos.update((state) => {
      state.items = state.items.filter((t) => t.id !== id);
    }, 'delete-todo');
  }

  function clearCompleted() {
    todos.batch(() => {
      todos.update((state) => {
        state.items = state.items.filter((t) => !t.done);
      }, 'clear-completed');
    });
  }

  function setFilter(filter: 'all' | 'active' | 'completed') {
    todos.update((state) => {
      state.filter = filter;
    }, 'set-filter');
  }

  let filteredTodos = $derived(() => {
    const { items, filter } = todos.state;
    if (filter === 'active') return items.filter((t) => !t.done);
    if (filter === 'completed') return items.filter((t) => t.done);
    return items;
  });

  let stats = $derived(() => {
    const { items } = todos.state;
    return {
      total: items.length,
      active: items.filter((t) => !t.done).length,
      completed: items.filter((t) => t.done).length,
    };
  });
</script>

<div class="demo">
  <div class="demo-header">
    <h2>Todo App Demo</h2>
    <p>Full-featured todo app with persistence, undo/redo, and filtering</p>
  </div>

  <div class="todo-container">
    <div class="add-todo">
      <input
        type="text"
        placeholder="What needs to be done?"
        bind:value={newTodoText}
        onkeydown={(e) => e.key === 'Enter' && addTodo()}
      />
      <button class="btn btn-primary" onclick={addTodo}>
        Add Todo
      </button>
    </div>

    <div class="filters">
      <button
        class="filter-btn"
        class:active={todos.state.filter === 'all'}
        onclick={() => setFilter('all')}
      >
        All ({stats().total})
      </button>
      <button
        class="filter-btn"
        class:active={todos.state.filter === 'active'}
        onclick={() => setFilter('active')}
      >
        Active ({stats().active})
      </button>
      <button
        class="filter-btn"
        class:active={todos.state.filter === 'completed'}
        onclick={() => setFilter('completed')}
      >
        Completed ({stats().completed})
      </button>
    </div>

    <div class="todo-list">
      {#if filteredTodos().length > 0}
        {#each filteredTodos() as todo (todo.id)}
          <div class="todo-item" class:done={todo.done}>
            <input
              type="checkbox"
              checked={todo.done}
              onchange={() => toggleTodo(todo.id)}
            />
            <span class="todo-text">{todo.text}</span>
            <button
              class="delete-btn"
              onclick={() => deleteTodo(todo.id)}
              title="Delete"
            >
              ×
            </button>
          </div>
        {/each}
      {:else}
        <div class="empty">
          {#if todos.state.filter === 'all'}
            No todos yet. Add one above!
          {:else if todos.state.filter === 'active'}
            No active todos. Great job!
          {:else}
            No completed todos yet.
          {/if}
        </div>
      {/if}
    </div>

    <div class="todo-actions">
      <button
        class="btn btn-undo"
        onclick={() => todos.undo()}
        disabled={!todos.canUndo()}
      >
        ← Undo
      </button>

      <button
        class="btn btn-secondary"
        onclick={clearCompleted}
        disabled={stats().completed === 0}
      >
        Clear Completed
      </button>

      <button
        class="btn btn-undo"
        onclick={() => todos.redo()}
        disabled={!todos.canRedo()}
      >
        Redo →
      </button>
    </div>
  </div>

  <div class="code-block">
    <h3>Code</h3>
    <pre><code>{`const todos = createReactor(
  { items: [], filter: 'all' },
  {
    plugins: [
      persist({ key: 'todos', debounce: 300 }),
      undoRedo({ limit: 100 }),
      logger({ collapsed: true }),
    ],
  }
);

// Add todo
todos.update((state) => {
  state.items.push({
    id: crypto.randomUUID(),
    text: 'New todo',
    done: false,
  });
}, 'add-todo');

// Toggle todo
todos.update((state) => {
  const todo = state.items.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
}, 'toggle-todo');`}</code></pre>
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

  .todo-container {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .add-todo {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .add-todo input {
    flex: 1;
    padding: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
  }

  .add-todo input:focus {
    outline: none;
    border-color: #667eea;
  }

  .filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #f0f0f0;
  }

  .filter-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    background: #f0f4ff;
    border-color: #667eea;
  }

  .filter-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .todo-list {
    min-height: 200px;
    margin-bottom: 1.5rem;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  .todo-item:hover {
    background: #f0f0f0;
  }

  .todo-item.done {
    opacity: 0.6;
  }

  .todo-item.done .todo-text {
    text-decoration: line-through;
  }

  .todo-item input[type='checkbox'] {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
  }

  .todo-text {
    flex: 1;
    font-size: 1rem;
  }

  .delete-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: #ff4757;
    color: white;
    border-radius: 50%;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: #e84118;
    transform: scale(1.1);
  }

  .empty {
    text-align: center;
    padding: 3rem;
    color: #999;
    font-size: 1.1rem;
  }

  .todo-actions {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
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
  }

  .btn-secondary {
    background: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #d0d0d0;
  }

  .btn-undo {
    background: #f0f4ff;
    color: #667eea;
    border: 2px solid #667eea;
  }

  .btn-undo:hover:not(:disabled) {
    background: #667eea;
    color: white;
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
