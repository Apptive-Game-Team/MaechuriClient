# Project Context

Agents must verify commands against repository configuration before running them.

## Overview

- Product: Maechuri browser-based 2D mystery game client
- Primary users: players selecting scenarios, exploring maps, interviewing characters, and submitting solutions
- Core domain: scenario-driven tile maps, ECS game interaction, records, dialogue, and solution attempts
- Runtime environment: React 19 in modern browsers, built with Vite 7 and TypeScript 5.9

## Architecture

- Entry points: `index.html`, `src/main.tsx`, and `src/App.tsx`
- Main modules: screens and modals under `src/components/`; game hooks, systems, renderers, and utilities under `src/components/GameScreen/`
- Dependency direction: UI and hooks consume domain types and `src/services/api.ts`; services use endpoint config and `apiFetch`
- External systems: backend HTTP API selected by environment in `src/config/api.ts`
- Persistent data: browser local storage and backend-managed scenario, interaction, record, and solve data

## Commands

| Purpose | Command |
|---|---|
| Install dependencies | `npm ci` |
| Run locally | `npm run dev` |
| Format | Not configured |
| Lint | `npm run lint` |
| Type-check | `npx tsc -b` |
| Unit tests | Not configured |
| Integration tests | Not configured |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## Constraints

- Supported platforms: modern browsers; CI uses Node.js 20
- Compatibility requirements: preserve strict TypeScript and React Hooks rules
- Performance constraints: avoid React renders on every game-engine frame; preserve stable entities and bounded animation work
- Security or privacy requirements: do not commit credentials; keep API configuration environment-aware

## Ownership

- Maintainers: TODO
- Sensitive modules: `src/components/GameScreen/`, `src/services/`, `src/utils/apiFetch.ts`
- Changes requiring explicit review: API contract changes, game-loop behavior, deployment configuration, and new persistent client data
