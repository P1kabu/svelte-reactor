<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { persist } from 'svelte-reactor/plugins';
  import Counter from './demos/Counter.svelte';
  import TodoApp from './demos/TodoApp.svelte';
  import ContactForm from './demos/ContactForm.svelte';
  import CanvasEditor from './demos/CanvasEditor.svelte';
  import TestPage from './demos/TestPage.svelte';
  import DevToolsDemo from './demos/DevToolsDemo.svelte';

  const demos = [
    { id: 'test', name: '🧪 v0.2.2 Test', component: TestPage },
    { id: 'devtools', name: '🛠️ DevTools Preview', component: DevToolsDemo },
    { id: 'counter', name: 'Counter', component: Counter },
    { id: 'todo', name: 'Todo App', component: TodoApp },
    { id: 'form', name: 'Contact Form', component: ContactForm },
    { id: 'canvas', name: 'Canvas Editor', component: CanvasEditor },
  ];

  // Use reactor to persist navigation state
  interface NavState {
    currentDemo: string;
  }

  const nav = createReactor<NavState>(
    { currentDemo: 'test' },
    {
      name: 'navigation',
      plugins: [persist({ key: 'reactor-demo-nav' })],
    }
  );

  // Update URL hash when demo changes
  $effect(() => {
    window.location.hash = nav.state.currentDemo;
  });

  function setDemo(demoId: string) {
    nav.update((state) => {
      state.currentDemo = demoId;
    });
  }
</script>

<div class="app">
  <header>
    <h1>svelte-reactor</h1>
    <p>Powerful reactive state management for Svelte 5</p>
  </header>

  <nav>
    {#each demos as demo}
      <button
        class="nav-btn"
        class:active={nav.state.currentDemo === demo.id}
        onclick={() => setDemo(demo.id)}
      >
        {demo.name}
      </button>
    {/each}
  </nav>

  <main>
    {#if nav.state.currentDemo === 'test'}
      <TestPage />
    {:else if nav.state.currentDemo === 'devtools'}
      <DevToolsDemo />
    {:else if nav.state.currentDemo === 'counter'}
      <Counter />
    {:else if nav.state.currentDemo === 'todo'}
      <TodoApp />
    {:else if nav.state.currentDemo === 'form'}
      <ContactForm />
    {:else if nav.state.currentDemo === 'canvas'}
      <CanvasEditor />
    {/if}
  </main>

  <footer>
    <p>
      <a href="https://github.com/P1kabu/svelte-reactor" target="_blank">GitHub</a>
      •
      <a href="https://www.npmjs.com/package/svelte-reactor" target="_blank">npm</a>
      •
      <a href="https://github.com/P1kabu/svelte-reactor#readme" target="_blank">Docs</a>
    </p>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
  }

  header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  header p {
    opacity: 0.9;
    font-size: 1.1rem;
  }

  nav {
    background: white;
    padding: 1rem;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    border-bottom: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .nav-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-btn:hover {
    background: #f0f4ff;
  }

  .nav-btn.active {
    background: #667eea;
    color: white;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
  }

  footer {
    background: #333;
    color: white;
    padding: 1.5rem;
    text-align: center;
  }

  footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>
