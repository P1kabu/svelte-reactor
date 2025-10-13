# Contributing to @svelte-dev/reactor

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/svelte-dev/reactor.git
cd reactor
```

2. Install dependencies:
```bash
pnpm install
```

3. Run tests:
```bash
cd packages/reactor
pnpm test
```

4. Run tests in watch mode:
```bash
pnpm test:watch
```

5. Run benchmarks:
```bash
pnpm bench
```

## Project Structure

```
svelte-dev.reactor/
├── packages/
│   ├── reactor/           # Main library
│   │   ├── src/
│   │   │   ├── core/      # Core reactor functionality
│   │   │   ├── history/   # Undo/redo engine
│   │   │   ├── plugins/   # Built-in plugins
│   │   │   ├── devtools/  # DevTools API
│   │   │   ├── utils/     # Utilities (clone, diff)
│   │   │   └── types/     # TypeScript types
│   │   └── tests/         # Unit & integration tests
│   └── persist/           # Persistence library
├── examples/
│   └── reactor-demos/     # Interactive demos
└── package.json          # Monorepo root
```

## Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Add tests for your changes

4. Run tests:
```bash
pnpm test
```

5. Run type checking:
```bash
pnpm typecheck
```

6. Format code:
```bash
pnpm format
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add a clear description of your changes
4. Link any related issues

## Coding Standards

- Use TypeScript for all code
- Follow existing code style (enforced by ESLint and Prettier)
- Write tests for new features
- Keep bundle size small
- Document public APIs with JSDoc comments

## Testing

We use Vitest for testing. Tests should:
- Cover all new functionality
- Include edge cases
- Be clear and maintainable

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
