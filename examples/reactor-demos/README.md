# svelte-reactor - Interactive Demos

Live demos showcasing the power of svelte-reactor state management library for Svelte 5.

## 🚀 Running the Demos

```bash
# Install dependencies (from project root)
pnpm install

# Start dev server
cd examples/reactor-demos
pnpm dev
```

Then open http://localhost:5174 in your browser.

## 📱 Available Demos

### 1. Counter Demo
Simple counter with undo/redo and history tracking.

**Features:**
- Increment/Decrement with custom step size
- Full undo/redo support
- History tracking with timestamps
- Action labeling for debugging

**Plugins used:**
- `undoRedo` - Undo/redo functionality
- `logger` - Console logging

### 2. Todo App Demo
Full-featured todo application with persistence.

**Features:**
- Add, toggle, and delete todos
- Filter by all/active/completed
- Auto-save to localStorage
- Full undo/redo support
- Clear completed todos

**Plugins used:**
- `persist` - LocalStorage persistence with debounce
- `undoRedo` - Undo/redo with 100 history limit
- `logger` - Development logging

### 3. Contact Form Demo
Auto-saving form with validation.

**Features:**
- Real-time auto-save (1s debounce)
- Form validation
- Character counter
- Undo/redo for all field changes
- Last saved timestamp

**Plugins used:**
- `persist` - Auto-save form data
- `undoRedo` - Field-level undo/redo

### 4. Canvas Editor Demo
Drawing application with full drawing history.

**Features:**
- Free-hand drawing
- Color palette
- Brush width options
- Undo/Redo each stroke
- Path count statistics

**Plugins used:**
- `undoRedo` - Drawing history with 100 step limit

## 🎯 Key Concepts Demonstrated

### Undo/Redo
All demos showcase reactor's powerful undo/redo system:
- Unlimited history (configurable limit)
- Action labeling for debugging
- Batch operations
- State snapshots

### Persistence
Todo and Form demos show automatic state persistence:
- LocalStorage integration
- Debounced saves
- State restoration on reload
- Works seamlessly with undo/redo

### Middleware
Logger plugin demonstrates middleware capabilities:
- Before/after update hooks
- Action tracking
- State inspection

## 🛠 Building for Production

```bash
pnpm build
```

Outputs to `dist/` directory.

## 📦 What's Inside

```
examples/reactor-demos/
├── src/
│   ├── demos/
│   │   ├── Counter.svelte       # Counter demo
│   │   ├── TodoApp.svelte       # Todo app demo
│   │   ├── ContactForm.svelte   # Form demo
│   │   └── CanvasEditor.svelte  # Canvas demo
│   ├── App.svelte               # Main app with navigation
│   └── main.ts                  # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

## 🔗 Learn More

- [svelte-reactor](../../packages/reactor) - Main package
- [API Documentation](../../packages/reactor/API.md)
- [Examples](../../packages/reactor/EXAMPLES.md)
