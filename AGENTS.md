# Repository Guidelines

## Project Structure

This repository is a React 19, TypeScript, and Vite client for the Maechuri 2D game. Application code lives in `src/`:

- `components/`: screens, modals, shared UI, and `GameScreen` ECS renderers
- `components/GameScreen/{hooks,systems,utils}/`: game-loop behavior and controls
- `contexts/`, `hooks/`: shared React state and reusable behavior
- `services/`, `config/`: backend API calls and endpoint configuration
- `types/`: domain and API contracts
- `assets/` and `public/`: bundled and public static files

Keep implementation notes in `docs/`. Generated output belongs in `dist/` and must not be committed.

## Development Commands

- `npm ci`: install exact lockfile dependencies; preferred for clean environments and CI.
- `npm run dev`: start the Vite development server.
- `npm run lint`: run ESLint, including TypeScript, React Hooks, and React Refresh rules.
- `npm run build`: run TypeScript project checks, then create the production bundle.
- `npm run preview`: serve the built `dist/` output locally.

No automated test runner is configured. Until one is added, every change must pass `npm run lint` and `npm run build`; manually exercise affected game or UI flows.

## Coding Style

Follow existing TypeScript and React patterns. Use two-space indentation, single quotes, `PascalCase` for components and types, `camelCase` for functions and values, and `useX` for hooks. Keep component-specific CSS beside its component. Prefer explicit types, small focused functions, early returns, and immutable updates. Keep engine-frame state outside React state when frequent updates would cause unnecessary renders.

## Workflow, Commits, and Pull Requests

Read [project context](.agents/docs/project.md) before non-trivial work and follow the [development workflow](.agents/docs/workflow.md). Non-trivial changes require an issue, `<type>/<issue-number>` branch, and concise plan.

Use Conventional Commits, matching repository history: `fix: handle map fetch failure`, `perf: skip idle movement updates`, or `refactor(game): isolate controls`. Keep PRs focused. Include why, changed behavior, validation evidence, risks, rollback notes, and linked issue. Add screenshots or recordings for visible UI changes.

Never discard user changes, commit secrets, or rewrite shared history without explicit approval.
