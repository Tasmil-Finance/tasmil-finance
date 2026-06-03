<p align="center">
  <img src="./public/images/logo.png" alt="Tasmil Finance" width="120" />
</p>

<h1 align="center">Tasmil Finance</h1>

<p align="center">AI-powered DeFi portfolio management on Stellar/Soroban</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-111827?style=for-the-badge" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge" />
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind-4-0ea5e9?style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge" />
  <img alt="Stellar" src="https://img.shields.io/badge/Stellar-Mainnet-000000?style=for-the-badge" />
</p>

---

## Overview

The Tasmil Finance web application at [tasmil-finance.xyz](https://tasmil-finance.xyz) — a full-stack DeFi interface combining a yield vault dashboard, AI-powered chat, and automated portfolio management on Stellar. Users connect a Stellar wallet, choose a risk preset, fund a non-custodial keeper-wallet vault, and the platform manages the rest.

---

## Architecture

```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Authenticated app routes
│   ├── (landing-page)/       # Public marketing pages
│   ├── (public)/             # Unauthenticated pages (login, register)
│   ├── admin/                # Admin panel routes
│   ├── agui/                 # AG-UI streaming proxy routes
│   ├── api/                  # Next.js API routes
│   └── r/                    # Referral redirect routes
│
├── features/                 # Domain modules — each owns its UI, hooks, state
│   ├── account/              # Vault dashboard, settings, session-key management
│   ├── onboarding/           # Multi-step vault creation wizard
│   ├── portfolio/            # Portfolio overview, history, performance charts
│   ├── strategies/           # Strategy browser — live pool yields and analytics
│   ├── chat/                 # AI chat interface + AG-UI stream integration
│   ├── farming/              # Yield farming flows
│   ├── aggregator/           # Cross-protocol aggregation views
│   ├── protocols/            # Per-protocol detail pages
│   ├── referrals/            # Referral program UI
│   ├── quest/                # Quest / rewards system
│   ├── welcome-reward/       # Welcome reward flow
│   ├── credits/              # Credits and usage
│   ├── topup/                # Fund vault flows
│   ├── whitelist/            # Whitelist access gating
│   ├── profile/              # User profile management
│   ├── landing/              # Landing page sections
│   └── admin*/               # Admin: whitelist, top-ups, auth
│
├── shared/                   # Reusable primitives across features
│   ├── ui/                   # Base components (Button, Input, Modal, …)
│   ├── components/           # Composed components (WalletButton, NetworkBadge, …)
│   ├── hooks/                # Shared React hooks
│   ├── layout/               # Page layout wrappers
│   ├── context/              # Wallet context
│   ├── config/               # App-wide config
│   └── utils/                # Pure utility functions
│
├── providers/                # Global React providers
│   ├── app-provider.tsx      # Root: QueryClient, Theme, Tooltip
│   ├── wallet-provider.tsx   # Stellar Wallets Kit
│   ├── agui-stream-provider.tsx
│   └── thread-provider.tsx
│
├── store/                    # Zustand stores (persisted to localStorage)
│   ├── auth.store.ts
│   └── wallet.store.ts
│
├── gen-backend/              # Auto-generated: Backend API client (Kubb)
└── gen-ai/                   # Auto-generated: AI agents client (Kubb)
```

### Key Data Flows

**Vault onboarding:**
```
Wizard → wallet sign TX-1 (deploy keeper-wallet) → backend registers session key
→ wallet sign TX-2 (fund vault) → account ACTIVE
```

**AI Chat (AG-UI):**
```
Chat input → HttpAgent (@ag-ui/client) → POST /agui/{graph_id} SSE
→ agent streams events → debounced React state → rendered messages
```

**Automated rebalancing:**
```
Cron: pool discovery → weight calc → drift check (>5%)
→ bot signs Soroban TX via session key → deposit/withdraw contracts
→ position sync → dashboard update
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Vault Dashboard** | Real-time balance, APY, allocation breakdown per protocol and asset |
| **AI Chat** | 13 specialized agents — yields, swaps, research in natural language |
| **Onboarding Wizard** | Connect wallet → choose risk preset → fund vault |
| **Strategy Browser** | Live yield pool explorer: Blend, Soroswap, Aquarius |
| **Multi-Asset Vaults** | Deploy USDC and XLM with independent allocations |
| **Portfolio History** | Full activity log: deposits, withdrawals, rebalances, harvests |
| **Referral Program** | On-chain tracking and reward distribution |
| **Quest System** | User engagement rewards |
| **Admin Panel** | Whitelist management, top-ups, user oversight |
| **Session Keys** | Non-custodial — no signing prompts after setup |

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18 |
| pnpm | >= 9 (`npm install -g pnpm`) |
| Backend | Running on port 6756 |
| AI agents | Running on port 8001 (optional) |

### Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (`http://localhost:6756`) |
| `NEXT_PUBLIC_AI_URL` | No | AI agents URL (`http://localhost:8001`) |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | `mainnet` or `testnet` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Yes | Stellar network passphrase |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | No | Custom Soroban RPC |
| `NEXT_PUBLIC_HORIZON_URL` | No | Custom Horizon endpoint |

See `.env.example` for the full list.

### Common Setup Issues

| Issue | Fix |
|-------|-----|
| API calls failing | `NEXT_PUBLIC_API_URL` must point to port `6756` |
| Wallet not connecting | Install [Freighter](https://www.freighter.app/) |
| AI chat silent | `poetry run uvicorn api.server:app --port 8001` |
| Type errors after pull | `pnpm generate:api` |
| Hydration mismatch | `rm -rf .next && pnpm dev` |

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server with Turbopack on port 3000 |
| `pnpm build` | Production build |
| `pnpm lint` | Biome linter |
| `pnpm check:fix` | Lint + auto-fix |
| `pnpm test` | Jest unit tests |
| `pnpm test:e2e` | Playwright E2E tests |
| `pnpm type-check` | TypeScript check |
| `pnpm generate:api` | Regenerate API client from OpenAPI spec |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 App Router | SSR/SSG, routing, API routes |
| UI | React 19, TailwindCSS 4 | Rendering, styling |
| Components | Radix UI, shadcn | Accessible primitives |
| Wallet | Stellar Wallets Kit | Freighter, xBull, WalletConnect |
| AI Streaming | `@ag-ui/client` | SSE agent communication |
| Server State | TanStack Query v5 | Data fetching and caching |
| Client State | Zustand | Auth + wallet (persisted) |
| API Client | Kubb | Type-safe hooks from OpenAPI |
| Testing | Jest, Playwright | Unit + E2E |
| Linting | Biome | Formatting + linting |

---

## Product Screens

**Vault Dashboard** — Portfolio value, strategy allocations with APY, rebalance status, quick actions: deposit, withdraw, configure preset.

**Onboarding Wizard** — (1) Connect wallet (2) Choose base asset + risk preset (3) Sign two Soroban TXs: deploy keeper-wallet, fund vault.

**AI Chat** — Natural-language DeFi: yield queries, portfolio analysis, swap execution, protocol research.

**Strategy Browser** — Live pool table: protocol, asset, APY, TVL, risk score, vault allocation.

---

## Development Guide

### Code Conventions

- 2-space indent, line width 100 — enforced by Biome
- Double quotes, `import type` for type-only imports
- No `any`, no `console.log` (use `console.warn` / `console.error`)
- Features never import from other features — use `shared/` or props
- Import from feature root (`@/features/chat`), not deep paths
- Default to Server Components; `"use client"` only when needed

### Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `src/*` |
| `@/features/*` | `src/features/*` |
| `@/shared/*` | `src/shared/*` |

### Adding a Feature

1. `src/features/<name>/` with `index.ts` barrel
2. All state, hooks, components scoped inside
3. `@/shared/` imports only — no cross-feature imports
4. Routes under `src/app/(dashboard)/`

### Regenerating the API Client

```bash
pnpm generate:api   # requires backend on port 6756
```

Never edit `src/gen-backend/` or `src/gen-ai/` manually.

### Git Workflow

```
feat/<desc>  fix/<desc>  chore/<desc>  docs/<desc>

feat: add quest leaderboard
fix: wallet disconnect on mobile
```

Husky hooks: `lint-staged` on commit · `type-check + test:ci` on push.

---

## Contributing

1. Fork, branch from `main`
2. `pnpm lint` and `pnpm type-check` must pass
3. Write tests for changed behaviour
4. PR with clear description — open an issue first for big changes

---

## Related Repositories

| Repository | Description |
|------------|-------------|
| [user-docs](https://github.com/Tasmil-Finance/user-docs) | User-facing documentation |
