# Contributing to @svelte-dev/persist

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/svelte-dev/persist.git
cd persist
```

2. Install dependencies:
```bash
pnpm install
```

3. Run tests:
```bash
pnpm test
```

4. Run tests in watch mode:
```bash
pnpm test:watch
```

## Project Structure

```
svelte-persist/
├── packages/
│   └── core/              # Main library
│       ├── src/
│       │   ├── persisted.svelte.ts  # Core functionality
│       │   ├── storages/            # Storage adapters
│       │   ├── utils/               # Utilities
│       │   └── types/               # TypeScript types
│       └── tests/                   # Unit tests
├── docs/                  # Documentation (coming soon)
├── playground/            # Interactive examples (coming soon)
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
