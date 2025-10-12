# Changesets

This directory contains changesets for version management.

## Creating a changeset

```bash
pnpm changeset
```

This will prompt you to select packages and change types, then generate a changeset file.

## Releasing

Releases are handled automatically via GitHub Actions when changesets are merged to main.
