# Examples

Real-world examples and patterns for using @svelte-dev/reactor.

## Table of Contents

- [Basic Examples](#basic-examples)
  - [Counter with Undo/Redo](#counter-with-undoredo)
  - [Form State Management](#form-state-management)
  - [Settings Panel](#settings-panel)
- [Advanced Examples](#advanced-examples)
  - [Todo App with Persistence](#todo-app-with-persistence)
  - [Shopping Cart](#shopping-cart)
  - [Canvas Editor](#canvas-editor)
- [Patterns](#patterns)
  - [Custom Middleware](#custom-middleware)
  - [Derived State](#derived-state)
  - [Action Tracking](#action-tracking)
  - [State Migrations](#state-migrations)

---

## Basic Examples

### Counter with Undo/Redo

Simple counter with full undo/redo support.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo } from '@svelte-dev/reactor/plugins';

  const counter = createReactor(
    { value: 0, step: 1 },
    {
      plugins: [undoRedo({ limit: 50 })],
    }
  );

  function increment() {
    counter.update(state => {
      state.value += state.step;
    }, 'increment');
  }

  function decrement() {
    counter.update(state => {
      state.value -= state.step;
    }, 'decrement');
  }

  function setStep(step: number) {
    counter.update(state => {
      state.step = step;
    }, 'set-step');
  }
</script>

<div>
  <h2>Counter: {counter.state.value}</h2>

  <div>
    <button onclick={decrement}>-</button>
    <button onclick={increment}>+</button>
  </div>

  <div>
    Step:
    <button onclick={() => setStep(1)}>1</button>
    <button onclick={() => setStep(5)}>5</button>
    <button onclick={() => setStep(10)}>10</button>
  </div>

  <div>
    <button onclick={() => counter.undo()} disabled={!counter.canUndo()}>
      Undo
    </button>
    <button onclick={() => counter.redo()} disabled={!counter.canRedo()}>
      Redo
    </button>
  </div>
</div>
```

---

### Form State Management

Manage complex form state with validation.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo } from '@svelte-dev/reactor/plugins';

  interface FormState {
    name: string;
    email: string;
    age: number;
    errors: {
      name?: string;
      email?: string;
      age?: string;
    };
  }

  const form = createReactor<FormState>(
    {
      name: '',
      email: '',
      age: 0,
      errors: {},
    },
    {
      plugins: [undoRedo()],
    }
  );

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function updateField(field: keyof Omit<FormState, 'errors'>, value: any) {
    form.update(state => {
      state[field] = value;

      // Clear error for this field
      delete state.errors[field as keyof FormState['errors']];
    }, `update-${field}`);
  }

  function validate() {
    form.update(state => {
      state.errors = {};

      if (!state.name) {
        state.errors.name = 'Name is required';
      }

      if (!validateEmail(state.email)) {
        state.errors.email = 'Invalid email';
      }

      if (state.age < 18) {
        state.errors.age = 'Must be 18 or older';
      }
    }, 'validate');
  }

  const hasErrors = $derived(Object.keys(form.state.errors).length > 0);
</script>

<form onsubmit|preventDefault={validate}>
  <div>
    <label>
      Name:
      <input
        type="text"
        value={form.state.name}
        oninput={(e) => updateField('name', e.currentTarget.value)}
      />
      {#if form.state.errors.name}
        <span class="error">{form.state.errors.name}</span>
      {/if}
    </label>
  </div>

  <div>
    <label>
      Email:
      <input
        type="email"
        value={form.state.email}
        oninput={(e) => updateField('email', e.currentTarget.value)}
      />
      {#if form.state.errors.email}
        <span class="error">{form.state.errors.email}</span>
      {/if}
    </label>
  </div>

  <div>
    <label>
      Age:
      <input
        type="number"
        value={form.state.age}
        oninput={(e) => updateField('age', parseInt(e.currentTarget.value))}
      />
      {#if form.state.errors.age}
        <span class="error">{form.state.errors.age}</span>
      {/if}
    </label>
  </div>

  <button type="submit">Submit</button>
  <button type="button" onclick={() => form.undo()} disabled={!form.canUndo()}>
    Undo
  </button>
</form>

<style>
  .error {
    color: red;
    font-size: 0.9em;
  }
</style>
```

---

### Settings Panel

Persistent settings with localStorage.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist } from '@svelte-dev/reactor/plugins';

  interface Settings {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
    fontSize: number;
  }

  const settings = createReactor<Settings>(
    {
      theme: 'light',
      notifications: true,
      language: 'en',
      fontSize: 16,
    },
    {
      plugins: [
        persist({
          key: 'app-settings',
          debounce: 500,
        }),
      ],
    }
  );

  function toggleTheme() {
    settings.update(state => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    }, 'toggle-theme');
  }

  function setFontSize(size: number) {
    settings.update(state => {
      state.fontSize = Math.max(12, Math.min(24, size));
    }, 'set-font-size');
  }
</script>

<div class={settings.state.theme}>
  <h2>Settings</h2>

  <div>
    <label>
      Theme:
      <button onclick={toggleTheme}>
        {settings.state.theme === 'light' ? '🌙' : '☀️'}
      </button>
    </label>
  </div>

  <div>
    <label>
      <input
        type="checkbox"
        checked={settings.state.notifications}
        onchange={(e) => settings.update(s => {
          s.notifications = e.currentTarget.checked;
        }, 'toggle-notifications')}
      />
      Enable notifications
    </label>
  </div>

  <div>
    <label>
      Language:
      <select
        value={settings.state.language}
        onchange={(e) => settings.update(s => {
          s.language = e.currentTarget.value;
        }, 'change-language')}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </label>
  </div>

  <div>
    <label>
      Font size: {settings.state.fontSize}px
      <input
        type="range"
        min="12"
        max="24"
        value={settings.state.fontSize}
        oninput={(e) => setFontSize(parseInt(e.currentTarget.value))}
      />
    </label>
  </div>
</div>

<style>
  .light {
    background: white;
    color: black;
  }
  .dark {
    background: #1a1a1a;
    color: white;
  }
</style>
```

---

## Advanced Examples

### Todo App with Persistence

Complete todo app with categories, filters, and persistence.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo } from '@svelte-dev/reactor/plugins';

  interface Todo {
    id: string;
    text: string;
    done: boolean;
    category: string;
    createdAt: number;
  }

  interface TodoState {
    items: Todo[];
    filter: 'all' | 'active' | 'done';
    category: string;
    categories: string[];
  }

  const todos = createReactor<TodoState>(
    {
      items: [],
      filter: 'all',
      category: 'all',
      categories: ['Work', 'Personal', 'Shopping'],
    },
    {
      plugins: [
        persist({ key: 'todos-v2', debounce: 300 }),
        undoRedo({ limit: 100 }),
      ],
    }
  );

  let newTodoText = $state('');
  let selectedCategory = $state('Work');

  function addTodo() {
    if (!newTodoText.trim()) return;

    todos.update(state => {
      state.items.push({
        id: crypto.randomUUID(),
        text: newTodoText.trim(),
        done: false,
        category: selectedCategory,
        createdAt: Date.now(),
      });
    }, 'add-todo');

    newTodoText = '';
  }

  function toggleTodo(id: string) {
    todos.update(state => {
      const todo = state.items.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    }, 'toggle-todo');
  }

  function removeTodo(id: string) {
    todos.update(state => {
      state.items = state.items.filter(t => t.id !== id);
    }, 'remove-todo');
  }

  function clearCompleted() {
    todos.update(state => {
      state.items = state.items.filter(t => !t.done);
    }, 'clear-completed');
  }

  function addCategory(name: string) {
    todos.update(state => {
      if (!state.categories.includes(name)) {
        state.categories.push(name);
      }
    }, 'add-category');
  }

  const filtered = $derived(() => {
    let items = todos.state.items;

    // Filter by status
    if (todos.state.filter === 'active') {
      items = items.filter(t => !t.done);
    } else if (todos.state.filter === 'done') {
      items = items.filter(t => t.done);
    }

    // Filter by category
    if (todos.state.category !== 'all') {
      items = items.filter(t => t.category === todos.state.category);
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  });

  const stats = $derived({
    total: todos.state.items.length,
    active: todos.state.items.filter(t => !t.done).length,
    done: todos.state.items.filter(t => t.done).length,
  });
</script>

<div class="todo-app">
  <h1>Todo App</h1>

  <div class="add-todo">
    <input
      bind:value={newTodoText}
      placeholder="What needs to be done?"
      onkeydown={(e) => e.key === 'Enter' && addTodo()}
    />
    <select bind:value={selectedCategory}>
      {#each todos.state.categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
    <button onclick={addTodo}>Add</button>
  </div>

  <div class="filters">
    <button
      class:active={todos.state.filter === 'all'}
      onclick={() => todos.update(s => { s.filter = 'all'; })}
    >
      All ({stats.total})
    </button>
    <button
      class:active={todos.state.filter === 'active'}
      onclick={() => todos.update(s => { s.filter = 'active'; })}
    >
      Active ({stats.active})
    </button>
    <button
      class:active={todos.state.filter === 'done'}
      onclick={() => todos.update(s => { s.filter = 'done'; })}
    >
      Done ({stats.done})
    </button>
  </div>

  <div class="categories">
    <button
      class:active={todos.state.category === 'all'}
      onclick={() => todos.update(s => { s.category = 'all'; })}
    >
      All Categories
    </button>
    {#each todos.state.categories as cat}
      <button
        class:active={todos.state.category === cat}
        onclick={() => todos.update(s => { s.category = cat; })}
      >
        {cat}
      </button>
    {/each}
  </div>

  <ul class="todo-list">
    {#each filtered() as todo (todo.id)}
      <li class:done={todo.done}>
        <input
          type="checkbox"
          checked={todo.done}
          onchange={() => toggleTodo(todo.id)}
        />
        <span>{todo.text}</span>
        <span class="category">{todo.category}</span>
        <button onclick={() => removeTodo(todo.id)}>×</button>
      </li>
    {/each}
  </ul>

  <div class="actions">
    <button onclick={clearCompleted} disabled={stats.done === 0}>
      Clear Completed
    </button>
    <button onclick={() => todos.undo()} disabled={!todos.canUndo()}>
      Undo
    </button>
    <button onclick={() => todos.redo()} disabled={!todos.canRedo()}>
      Redo
    </button>
  </div>
</div>

<style>
  .todo-app {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  .add-todo {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .add-todo input {
    flex: 1;
  }

  .filters, .categories {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filters button.active,
  .categories button.active {
    background: #4CAF50;
    color: white;
  }

  .todo-list {
    list-style: none;
    padding: 0;
  }

  .todo-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .todo-list li.done span {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .category {
    font-size: 0.8em;
    background: #eee;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-left: auto;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
</style>
```

---

### Shopping Cart

Shopping cart with quantity management and persistence.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { persist, undoRedo } from '@svelte-dev/reactor/plugins';

  interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }

  interface CartState {
    items: CartItem[];
    discount: number;
  }

  const cart = createReactor<CartState>(
    {
      items: [],
      discount: 0,
    },
    {
      plugins: [
        persist({ key: 'shopping-cart', debounce: 500 }),
        undoRedo({ limit: 50 }),
      ],
    }
  );

  function addItem(id: string, name: string, price: number) {
    cart.update(state => {
      const existing = state.items.find(item => item.id === id);
      if (existing) {
        existing.quantity++;
      } else {
        state.items.push({ id, name, price, quantity: 1 });
      }
    }, 'add-item');
  }

  function removeItem(id: string) {
    cart.update(state => {
      state.items = state.items.filter(item => item.id !== id);
    }, 'remove-item');
  }

  function updateQuantity(id: string, quantity: number) {
    cart.update(state => {
      const item = state.items.find(i => i.id === id);
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
    }, 'update-quantity');
  }

  function applyDiscount(percent: number) {
    cart.update(state => {
      state.discount = Math.max(0, Math.min(100, percent));
    }, 'apply-discount');
  }

  const subtotal = $derived(
    cart.state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const total = $derived(
    subtotal * (1 - cart.state.discount / 100)
  );

  const itemCount = $derived(
    cart.state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  // Sample products
  const products = [
    { id: '1', name: 'Laptop', price: 999 },
    { id: '2', name: 'Mouse', price: 29 },
    { id: '3', name: 'Keyboard', price: 79 },
    { id: '4', name: 'Monitor', price: 299 },
  ];
</script>

<div class="shop">
  <h2>Products</h2>
  <div class="products">
    {#each products as product}
      <div class="product">
        <h3>{product.name}</h3>
        <p>${product.price}</p>
        <button onclick={() => addItem(product.id, product.name, product.price)}>
          Add to Cart
        </button>
      </div>
    {/each}
  </div>

  <h2>Cart ({itemCount} items)</h2>
  {#if cart.state.items.length === 0}
    <p>Cart is empty</p>
  {:else}
    <ul class="cart-items">
      {#each cart.state.items as item (item.id)}
        <li>
          <span>{item.name}</span>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onchange={(e) => updateQuantity(item.id, parseInt(e.currentTarget.value))}
          />
          <span>${(item.price * item.quantity).toFixed(2)}</span>
          <button onclick={() => removeItem(item.id)}>Remove</button>
        </li>
      {/each}
    </ul>

    <div class="totals">
      <div>Subtotal: ${subtotal.toFixed(2)}</div>

      <div>
        Discount:
        <input
          type="number"
          min="0"
          max="100"
          value={cart.state.discount}
          onchange={(e) => applyDiscount(parseInt(e.currentTarget.value))}
        />%
      </div>

      <div class="total">Total: ${total.toFixed(2)}</div>
    </div>

    <div class="actions">
      <button onclick={() => cart.undo()} disabled={!cart.canUndo()}>
        Undo
      </button>
      <button onclick={() => cart.redo()} disabled={!cart.canRedo()}>
        Redo
      </button>
      <button onclick={() => cart.update(s => { s.items = []; s.discount = 0; }, 'clear-cart')}>
        Clear Cart
      </button>
    </div>
  {/if}
</div>

<style>
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .product {
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 4px;
  }

  .cart-items {
    list-style: none;
    padding: 0;
  }

  .cart-items li {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .cart-items input {
    width: 60px;
  }

  .totals {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .total {
    font-size: 1.2em;
    font-weight: bold;
    margin-top: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
</style>
```

---

### Canvas Editor

Simple drawing app with undo/redo.

```svelte
<script lang="ts">
  import { createReactor } from '@svelte-dev/reactor';
  import { undoRedo } from '@svelte-dev/reactor/plugins';

  interface Point {
    x: number;
    y: number;
  }

  interface Stroke {
    id: string;
    points: Point[];
    color: string;
    width: number;
  }

  const canvas = createReactor(
    {
      strokes: [] as Stroke[],
      currentColor: '#000000',
      currentWidth: 2,
    },
    {
      plugins: [undoRedo({ limit: 100 })],
    }
  );

  let drawing = $state(false);
  let currentStroke: Stroke | null = $state(null);

  function startDrawing(e: MouseEvent) {
    drawing = true;
    currentStroke = {
      id: crypto.randomUUID(),
      points: [{ x: e.offsetX, y: e.offsetY }],
      color: canvas.state.currentColor,
      width: canvas.state.currentWidth,
    };
  }

  function draw(e: MouseEvent) {
    if (!drawing || !currentStroke) return;

    currentStroke.points.push({
      x: e.offsetX,
      y: e.offsetY,
    });
  }

  function stopDrawing() {
    if (currentStroke && currentStroke.points.length > 1) {
      canvas.update(state => {
        state.strokes.push(currentStroke!);
      }, 'add-stroke');
    }
    drawing = false;
    currentStroke = null;
  }

  function clear() {
    canvas.update(state => {
      state.strokes = [];
    }, 'clear');
  }

  // Render canvas
  let canvasEl: HTMLCanvasElement;
  $effect(() => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d')!;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Draw all strokes
    canvas.state.strokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      stroke.points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke && currentStroke.points.length > 1) {
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      currentStroke.points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  });
</script>

<div class="canvas-editor">
  <div class="toolbar">
    <label>
      Color:
      <input
        type="color"
        value={canvas.state.currentColor}
        oninput={(e) => canvas.update(s => {
          s.currentColor = e.currentTarget.value;
        })}
      />
    </label>

    <label>
      Width:
      <input
        type="range"
        min="1"
        max="20"
        value={canvas.state.currentWidth}
        oninput={(e) => canvas.update(s => {
          s.currentWidth = parseInt(e.currentTarget.value);
        })}
      />
      {canvas.state.currentWidth}px
    </label>

    <button onclick={clear}>Clear</button>
    <button onclick={() => canvas.undo()} disabled={!canvas.canUndo()}>
      Undo
    </button>
    <button onclick={() => canvas.redo()} disabled={!canvas.canRedo()}>
      Redo
    </button>
  </div>

  <canvas
    bind:this={canvasEl}
    width={800}
    height={600}
    onmousedown={startDrawing}
    onmousemove={draw}
    onmouseup={stopDrawing}
    onmouseleave={stopDrawing}
  />
</div>

<style>
  .canvas-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  canvas {
    border: 2px solid #333;
    cursor: crosshair;
  }
</style>
```

---

## Patterns

### Custom Middleware

Create custom middleware for logging, analytics, or side effects.

```typescript
import { createReactor } from '@svelte-dev/reactor';

// Analytics middleware
const analyticsMiddleware = {
  name: 'analytics',
  onAfterUpdate(prevState: any, nextState: any, action?: string) {
    if (action) {
      // Track analytics event
      console.log('Analytics:', action, { prevState, nextState });
    }
  },
};

// API sync middleware
const apiSyncMiddleware = {
  name: 'api-sync',
  onAfterUpdate(prevState: any, nextState: any, action?: string) {
    if (action?.startsWith('save-')) {
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      });
    }
  },
};

const reactor = createReactor(
  { value: 0 },
  {
    plugins: [
      {
        install: () => ({
          middlewares: [analyticsMiddleware, apiSyncMiddleware],
        }),
      },
    ],
  }
);
```

---

### Derived State

Use Svelte's `$derived` for computed values.

```typescript
import { createReactor } from '@svelte-dev/reactor';

const cart = createReactor({
  items: [
    { id: '1', price: 10, quantity: 2 },
    { id: '2', price: 20, quantity: 1 },
  ],
  taxRate: 0.1,
});

// Computed values
const subtotal = $derived(
  cart.state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const tax = $derived(subtotal * cart.state.taxRate);

const total = $derived(subtotal + tax);

// Use in template
console.log(`Total: $${total.toFixed(2)}`);
```

---

### Action Tracking

Use action names to track and debug state changes.

```typescript
import { createReactor } from '@svelte-dev/reactor';
import { undoRedo, logger } from '@svelte-dev/reactor/plugins';

const reactor = createReactor(
  { value: 0 },
  {
    plugins: [
      undoRedo({
        exclude: ['preview', 'hover'], // Don't track temporary actions
      }),
      logger(), // Logs all actions
    ],
  }
);

// Named actions for better debugging
reactor.update(s => { s.value++; }, 'increment');
reactor.update(s => { s.value = 100; }, 'preview'); // Won't be in history
reactor.update(s => { s.value = 0; }, 'reset');

// View history with action names
const history = reactor.getHistory();
console.log(history); // Each entry has action name
```

---

### State Migrations

Handle schema changes with version migrations.

```typescript
import { createReactor } from '@svelte-dev/reactor';
import { persist } from '@svelte-dev/reactor/plugins';

const todos = createReactor(
  {
    items: [] as Array<{ id: string; text: string; done: boolean; priority: 'low' | 'medium' | 'high' }>,
  },
  {
    plugins: [
      persist({
        key: 'todos',
        version: 3,
        migrate: (stored: any, version: number) => {
          // Migrate from v1 to v2: add 'done' field
          if (version < 2) {
            stored.items = stored.items.map((item: any) => ({
              ...item,
              done: false,
            }));
          }

          // Migrate from v2 to v3: add 'priority' field
          if (version < 3) {
            stored.items = stored.items.map((item: any) => ({
              ...item,
              priority: 'medium',
            }));
          }

          return stored;
        },
      }),
    ],
  }
);
```

---

## Best Practices

1. **Use action names** - Name your actions for better debugging and history tracking
2. **Batch operations** - Use `batch()` for multiple related updates
3. **Derive computed values** - Use `$derived` instead of storing computed state
4. **Exclude temporary actions** - Don't add preview/hover states to history
5. **Persist strategically** - Use debounce to avoid excessive writes
6. **Limit history** - Set reasonable `limit` in `undoRedo` to avoid memory issues
7. **Type your state** - Always use TypeScript interfaces for state shape
8. **Handle migrations** - Plan for schema changes with version migrations

---

## More Resources

- [README.md](./README.md) - Getting started and overview
- [API.md](./API.md) - Complete API reference
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance benchmarks
