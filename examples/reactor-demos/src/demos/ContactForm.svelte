<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { persist, undoRedo } from 'svelte-reactor/plugins';

  interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
  }

  interface FormState {
    data: FormData;
    submitted: boolean;
    lastSaved: number | null;
  }

  const form = createReactor<FormState>(
    {
      data: {
        name: '',
        email: '',
        subject: '',
        message: '',
      },
      submitted: false,
      lastSaved: null,
    },
    {
      name: 'contact-form',
      plugins: [
        persist({ key: 'reactor-contact-form', debounce: 1000 }),
        undoRedo({ limit: 20 }),
      ],
    }
  );

  // Log state changes for debugging
  $effect(() => {
    console.log('📝 Form state:', {
      name: form.state.data.name,
      email: form.state.data.email,
      subject: form.state.data.subject,
      messageLength: form.state.data.message.length,
      lastSaved: form.state.lastSaved,
    });
  });

  function updateField(field: keyof FormData, value: string) {
    form.update((state) => {
      state.data[field] = value;
      state.lastSaved = Date.now();
    }, `update-${field}`);
  }

  function submitForm() {
    // Simulate form submission
    console.log('Submitting form:', form.state.data);

    form.update((state) => {
      state.submitted = true;
    });

    // Reset form after 2 seconds
    setTimeout(() => {
      form.set({
        data: {
          name: '',
          email: '',
          subject: '',
          message: '',
        },
        submitted: false,
        lastSaved: null,
      });
    }, 2000);
  }

  function clearForm() {
    form.set({
      data: {
        name: '',
        email: '',
        subject: '',
        message: '',
      },
      submitted: false,
      lastSaved: null,
    });
  }

  let isFormValid = $derived(() => {
    const { data } = form.state;
    return (
      data.name.trim().length > 0 &&
      data.email.trim().length > 0 &&
      data.email.includes('@') &&
      data.message.trim().length > 0
    );
  });

  let charCount = $derived(form.state.data.message.length);
  let lastSavedText = $derived(() => {
    const { lastSaved } = form.state;
    if (!lastSaved) return '';
    const seconds = Math.floor((Date.now() - lastSaved) / 1000);
    if (seconds < 5) return 'Just saved';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    return `Saved ${Math.floor(seconds / 60)}m ago`;
  });
</script>

<div class="demo">
  <div class="demo-header">
    <h2>Contact Form Demo</h2>
    <p>Auto-saving form with undo/redo and persistence</p>
  </div>

  <div class="form-container">
    {#if form.state.submitted}
      <div class="success-message">
        <div class="success-icon">✓</div>
        <h3>Message Sent!</h3>
        <p>Thank you for your message. We'll get back to you soon.</p>
      </div>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
        <div class="form-row">
          <div class="form-group">
            <label for="name">Name *</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={form.state.data.name}
              oninput={(e) => updateField('name', e.currentTarget.value)}
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={form.state.data.email}
              oninput={(e) => updateField('email', e.currentTarget.value)}
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="subject">Subject</label>
          <input
            id="subject"
            type="text"
            placeholder="What's this about?"
            value={form.state.data.subject}
            oninput={(e) => updateField('subject', e.currentTarget.value)}
          />
        </div>

        <div class="form-group">
          <label for="message">
            Message *
          </label>
          <div class="char-counter">
            <span class="char-count">{charCount} characters</span>
          </div>
          <textarea
            id="message"
            placeholder="Your message here..."
            rows="6"
            value={form.state.data.message}
            oninput={(e) => updateField('message', e.currentTarget.value)}
            required
          ></textarea>
        </div>

        <div class="form-status">
          {#if form.state.lastSaved}
            <span class="autosave">✓ {lastSavedText()}</span>
          {/if}
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-undo"
            onclick={() => form.undo()}
            disabled={!form.canUndo()}
          >
            ← Undo
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={clearForm}
          >
            Clear
          </button>

          <button
            type="button"
            class="btn btn-undo"
            onclick={() => form.redo()}
            disabled={!form.canRedo()}
          >
            Redo →
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={!isFormValid()}
          >
            Send Message
          </button>
        </div>
      </form>
    {/if}
  </div>

  <div class="code-block">
    <h3>Code</h3>
    <pre><code>{`const form = createReactor(
  {
    data: { name: '', email: '', message: '' },
    lastSaved: null,
  },
  {
    plugins: [
      persist({ key: 'contact-form', debounce: 1000 }),
      undoRedo({ limit: 20 }),
    ],
  }
);

// Update field with auto-save
form.update((state) => {
  state.data.name = 'John';
  state.lastSaved = Date.now();
}, 'update-name');

// Form state persists across page reloads
// Undo/Redo works for all field changes`}</code></pre>
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

  .form-container {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .success-message {
    text-align: center;
    padding: 3rem;
  }

  .success-icon {
    width: 4rem;
    height: 4rem;
    background: #10b981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
  }

  .success-message h3 {
    color: #10b981;
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }

  .success-message p {
    color: #666;
    font-size: 1.1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .char-counter {
    margin-bottom: 0.5rem;
    text-align: right;
  }

  .char-count {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #f0f4ff;
    color: #667eea;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #667eea;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-status {
    margin-bottom: 1rem;
    min-height: 1.5rem;
  }

  .autosave {
    color: #10b981;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
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

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-wrap: wrap;
    }
  }
</style>
