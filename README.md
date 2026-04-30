<p align="center">
	<img src="./public/images/logo.png" alt="Tasmil Frontend" width="120" />
</p>

# Tasmil Frontend

Frontend application for Tasmil Finance.

> For full platform architecture (Frontend + Backend + AI + MCP + Contracts), see the workspace root README: `../../README.md`.

## Stack

- Next.js 16 (App Router)
- React 19
- TailwindCSS 4
- Radix UI
- TanStack Query
- AG-UI
- Kubb-generated API hooks

## Directory Highlights

```text
src/
├─ app/        # Route tree
├─ features/   # Domain modules
├─ shared/     # Shared UI and utilities
├─ gen/        # Generated API clients (do not edit manually)
├─ providers/  # Global providers
└─ store/      # Zustand stores
```

## Development

```bash
pnpm install
pnpm dev
```

Runs on http://localhost:3000.

## API Client Generation

```bash
pnpm generate:api
```

This regenerates typed API clients/hooks from OpenAPI.

## Quality & Tests

```bash
pnpm lint
pnpm check
pnpm type-check
pnpm test
pnpm test:e2e
```

## Integration Notes

- Frontend communicates with backend APIs and AI-assisted flows.
- Wallet and strategy UX integrates with Stellar/Soroban workflows.
- Keep generated code in `src/gen` untouched; regenerate instead.
