<script lang="ts">
  import { createReactor } from 'svelte-reactor';
  import { undoRedo } from 'svelte-reactor/plugins';
  import { onMount } from 'svelte';

  interface Point {
    x: number;
    y: number;
  }

  interface DrawingPath {
    points: Point[];
    color: string;
    width: number;
  }

  interface CanvasState {
    paths: DrawingPath[];
    currentColor: string;
    currentWidth: number;
  }

  const canvas = createReactor<CanvasState>(
    {
      paths: [],
      currentColor: '#667eea',
      currentWidth: 3,
    },
    {
      name: 'canvas',
      devtools: true,
      plugins: [undoRedo({ limit: 100 })],
    }
  );

  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let isDrawing = $state(false);
  let currentPath: Point[] = [];

  const colors = ['#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea'];
  const widths = [1, 3, 5, 8];

  onMount(() => {
    ctx = canvasElement.getContext('2d')!;
    redrawCanvas();
  });

  function redrawCanvas() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw all paths
    canvas.state.paths.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      ctx.stroke();
    });
  }

  function getMousePos(e: MouseEvent): Point {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e: MouseEvent) {
    isDrawing = true;
    currentPath = [getMousePos(e)];
  }

  function draw(e: MouseEvent) {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    currentPath.push(pos);

    // Draw current stroke
    if (currentPath.length >= 2) {
      const last = currentPath[currentPath.length - 2];
      const current = currentPath[currentPath.length - 1];

      ctx.strokeStyle = canvas.state.currentColor;
      ctx.lineWidth = canvas.state.currentWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    }
  }

  function stopDrawing() {
    if (!isDrawing || currentPath.length === 0) return;

    isDrawing = false;

    // Save path to state
    canvas.update((state) => {
      state.paths.push({
        points: [...currentPath],
        color: state.currentColor,
        width: state.currentWidth,
      });
    }, 'draw');

    currentPath = [];
  }

  function undo() {
    canvas.undo();
    redrawCanvas();
  }

  function redo() {
    canvas.redo();
    redrawCanvas();
  }

  function clearCanvas() {
    canvas.set({
      paths: [],
      currentColor: canvas.state.currentColor,
      currentWidth: canvas.state.currentWidth,
    });
    redrawCanvas();
  }

  function setColor(color: string) {
    canvas.update((state) => {
      state.currentColor = color;
    }, 'set-color');
  }

  function setWidth(width: number) {
    canvas.update((state) => {
      state.currentWidth = width;
    }, 'set-width');
  }

  // Redraw when state changes (undo/redo)
  $effect(() => {
    canvas.state.paths;
    redrawCanvas();
  });
</script>

<div class="demo">
  <div class="demo-header">
    <h2>Canvas Editor Demo</h2>
    <p>Drawing app with undo/redo and real-time preview</p>
  </div>

  <div class="canvas-container">
    <div class="toolbar">
      <div class="tool-group">
        <span class="tool-label">Color:</span>
        <div class="color-palette" role="group" aria-label="Color selection">
          {#each colors as color}
            <button
              class="color-btn"
              class:active={canvas.state.currentColor === color}
              style="background-color: {color}"
              onclick={() => setColor(color)}
              aria-label={`Select color ${color}`}
              title={color}
            ></button>
          {/each}
        </div>
      </div>

      <div class="tool-group">
        <span class="tool-label">Width:</span>
        <div class="width-options" role="group" aria-label="Brush width selection">
          {#each widths as width}
            <button
              class="width-btn"
              class:active={canvas.state.currentWidth === width}
              onclick={() => setWidth(width)}
              aria-label={`Select width ${width}px`}
            >
              <div
                class="width-preview"
                style="height: {width}px; background: {canvas.state.currentColor}"
              ></div>
            </button>
          {/each}
        </div>
      </div>

      <div class="tool-group">
        <button
          class="btn btn-undo"
          onclick={undo}
          disabled={!canvas.canUndo()}
        >
          ← Undo
        </button>

        <button
          class="btn btn-undo"
          onclick={redo}
          disabled={!canvas.canRedo()}
        >
          Redo →
        </button>

        <button class="btn btn-secondary" onclick={clearCanvas}>
          Clear
        </button>
      </div>
    </div>

    <canvas
      bind:this={canvasElement}
      width="800"
      height="500"
      onmousedown={startDrawing}
      onmousemove={draw}
      onmouseup={stopDrawing}
      onmouseleave={stopDrawing}
    ></canvas>

    <div class="stats">
      <span>Paths: {canvas.state.paths.length}</span>
      <span>History: {canvas.getHistory().length}</span>
    </div>
  </div>

  <div class="code-block">
    <h3>Code</h3>
    <pre><code>{`const canvas = createReactor(
  {
    paths: [],
    currentColor: '#667eea',
    currentWidth: 3,
  },
  {
    name: 'canvas',
    devtools: true,  // Enable Redux DevTools
    plugins: [undoRedo({ limit: 100 })],
  }
);

// Save drawing path
canvas.update((state) => {
  state.paths.push({
    points: [...currentPath],
    color: state.currentColor,
    width: state.currentWidth,
  });
}, 'draw');

// Undo removes last path
canvas.undo();

// Redo restores it
canvas.redo();`}</code></pre>
  </div>
</div>

<style>
  .demo {
    max-width: 900px;
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

  .canvas-container {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .toolbar {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    align-items: center;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .tool-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .tool-group .tool-label {
    font-weight: 600;
    color: #333;
  }

  .color-palette {
    display: flex;
    gap: 0.5rem;
  }

  .color-btn {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .color-btn:hover {
    transform: scale(1.1);
  }

  .color-btn.active {
    border-color: #333;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #333;
  }

  .width-options {
    display: flex;
    gap: 0.5rem;
  }

  .width-btn {
    width: 3rem;
    height: 2.5rem;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .width-btn:hover {
    border-color: #667eea;
  }

  .width-btn.active {
    border-color: #667eea;
    background: #f0f4ff;
  }

  .width-preview {
    width: 2rem;
    border-radius: 2px;
  }

  canvas {
    width: 100%;
    height: auto;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: crosshair;
    background: white;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #666;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
