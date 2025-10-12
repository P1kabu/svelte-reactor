<script lang="ts">
  import { persisted } from '@svelte-dev/persist';

  // Simple counter with localStorage
  let counter = persisted('counter', $state(0));

  // Todo list
  interface Todo {
    id: string;
    text: string;
    done: boolean;
  }

  let todos = persisted('todos', $state<Todo[]>([]));
  let todoInput = $state('');

  function addTodo() {
    if (!todoInput.trim()) return;
    todos = [
      ...todos,
      {
        id: crypto.randomUUID(),
        text: todoInput,
        done: false,
      },
    ];
    todoInput = '';
  }

  function toggleTodo(id: string) {
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTodo(id: string) {
    todos = todos.filter((t) => t.id !== id);
  }

  // User settings with sessionStorage
  interface Settings {
    theme: 'light' | 'dark';
    notifications: boolean;
  }

  let settings = persisted(
    'settings',
    $state<Settings>({
      theme: 'dark',
      notifications: true,
    }),
    {
      storage: 'sessionStorage',
    }
  );

  // Synced counter (try opening in multiple tabs)
  let syncedCounter = persisted('synced-counter', $state(0), {
    sync: true,
  });

  // Form with auto-save (debounced)
  interface FormData {
    name: string;
    email: string;
    message: string;
  }

  let formData = persisted(
    'contact-form',
    $state<FormData>({
      name: '',
      email: '',
      message: '',
    }),
    {
      debounce: 500,
    }
  );

  function clearForm() {
    formData = {
      name: '',
      email: '',
      message: '',
    };
  }
</script>

<div class="container">
  <header>
    <h1>@svelte-dev/persist</h1>
    <p>Effortless state persistence for Svelte 5 Runes</p>
  </header>

  <div class="grid">
    <!-- Simple Counter -->
    <section class="card">
      <h2>Simple Counter (localStorage)</h2>
      <div class="counter">
        <button onclick={() => counter--}>-</button>
        <span class="count">{counter}</span>
        <button onclick={() => counter++}>+</button>
      </div>
      <p class="hint">Refresh the page - the value persists!</p>
    </section>

    <!-- Synced Counter -->
    <section class="card">
      <h2>Synced Counter (multi-tab)</h2>
      <div class="counter">
        <button onclick={() => syncedCounter--}>-</button>
        <span class="count">{syncedCounter}</span>
        <button onclick={() => syncedCounter++}>+</button>
      </div>
      <p class="hint">Open in multiple tabs - changes sync automatically!</p>
    </section>

    <!-- Todo List -->
    <section class="card full-width">
      <h2>Todo List (localStorage)</h2>
      <div class="todo-input">
        <input
          bind:value={todoInput}
          placeholder="Add a new todo..."
          onkeydown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onclick={addTodo}>Add</button>
      </div>
      <ul class="todo-list">
        {#each todos as todo}
          <li class:done={todo.done}>
            <input type="checkbox" checked={todo.done} onchange={() => toggleTodo(todo.id)} />
            <span>{todo.text}</span>
            <button class="delete" onclick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        {/each}
      </ul>
      {#if todos.length === 0}
        <p class="empty">No todos yet. Add one above!</p>
      {/if}
    </section>

    <!-- Settings -->
    <section class="card">
      <h2>Settings (sessionStorage)</h2>
      <div class="settings">
        <label>
          <span>Theme:</span>
          <select bind:value={settings.theme}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          <input type="checkbox" bind:checked={settings.notifications} />
          <span>Enable notifications</span>
        </label>
      </div>
      <p class="hint">Settings persist for this session only</p>
    </section>

    <!-- Form with Auto-save -->
    <section class="card full-width">
      <h2>Contact Form (debounced auto-save)</h2>
      <form class="form" onsubmit|preventDefault={() => {}}>
        <input bind:value={formData.name} placeholder="Name" />
        <input bind:value={formData.email} type="email" placeholder="Email" />
        <textarea bind:value={formData.message} placeholder="Message" rows="4"></textarea>
        <div class="form-actions">
          <button type="button" onclick={clearForm}>Clear</button>
          <button type="submit">Send</button>
        </div>
      </form>
      <p class="hint">Form data is auto-saved after 500ms of no typing</p>
    </section>
  </div>

  <footer>
    <p>
      Built with <a href="https://svelte.dev" target="_blank">Svelte 5</a> •
      <a href="https://github.com/svelte-dev/persist" target="_blank">GitHub</a>
    </p>
  </footer>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 3rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  header p {
    color: #888;
    font-size: 1.2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .card {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .card.full-width {
    grid-column: 1 / -1;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
  }

  .counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
  }

  .count {
    font-size: 3rem;
    font-weight: bold;
    min-width: 80px;
    text-align: center;
  }

  button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  button:active {
    transform: translateY(0);
  }

  .hint {
    color: #888;
    font-size: 0.9rem;
    margin-top: 1rem;
    text-align: center;
  }

  .todo-input {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  input[type='text'],
  input[type='email'],
  textarea,
  select {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid #333;
    color: white;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 1rem;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #667eea;
  }

  .todo-list {
    list-style: none;
  }

  .todo-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #0a0a0a;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .todo-list li.done span {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .todo-list input[type='checkbox'] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .todo-list span {
    flex: 1;
  }

  .delete {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: #ff4444;
  }

  .delete:hover {
    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
  }

  .empty {
    text-align: center;
    color: #666;
    padding: 2rem;
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .settings label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .settings label span {
    flex: 1;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  footer {
    text-align: center;
    padding: 2rem 0;
    color: #888;
  }

  footer a {
    color: #667eea;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>
