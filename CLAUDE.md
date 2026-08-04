# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**restora / CircularAQP** — waste-management platform for tourist restaurants in Arequipa (TURISTÓN 2026). A monorepo of **three independently-run pieces**:

1. **Backend** (repo root) — Next.js 16 App Router used **as an API only** (no server-rendered UI). Port `:3000`.
2. **Frontend** (`frontend/`) — separate Vite + TanStack Start + React app, the actual UI. Port `:8080`.
3. **Predictor** (`predictor/`) — Python / scikit-learn RandomForest, invoked as a subprocess.

The frontend and backend are **two separate npm projects** with their own `package.json`, `node_modules`, and lockfile. `tsconfig.json` at the root excludes `frontend/`.

## Commands

Backend (run from repo root):
```bash
npm run dev                 # Next.js API on :3000
npm run build               # next build
npm run lint                # eslint
npx prisma generate         # regenerate client into src/generated/prisma (NOT node_modules)
npx prisma migrate dev      # apply/create SQLite migrations
npx prisma db seed          # tsx prisma/seed.ts — demo data
```

Frontend (run from `frontend/`):
```bash
npm run dev                 # Vite dev server on :8080 (proxies /api → :3000)
npm run build               # vite build
npm run lint                # eslint
npm run format              # prettier --write .
```

Predictor (`predictor/` is a **do-not-touch** directory — a challenge requirement): `pip install -r predictor/requirements.txt`. Never invoke Python directly; it is always driven through `src/lib/pythonBridge.ts`.

There is **no test suite** in this project.

Full dev loop needs both servers running plus `prisma generate/migrate/seed` first. Open http://localhost:8080. Demo login: `demo@circularaqp.pe` / `demo1234`.

## Architecture essentials

**Two-server, same-origin-via-proxy design.** The browser only ever talks to `:8080`. Vite's dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to `:3000`. This keeps the browser same-origin so the **httpOnly `session` cookie works without CORS**. Don't try to "fix" CORS by adding headers — the proxy is the mechanism. In production the two apps must still be served under one origin (or the proxy replicated).

**Auth is per-handler, not middleware.** Every protected route handler calls `requireSession(request, id)` from `src/lib/auth.ts`. It verifies the JWT (jose, HS256, `AUTH_SECRET`) **and** that the session's `restauranteId` matches the route's tenant. There is no Next.js middleware auth gate — do not assume one. Multi-tenancy is enforced entirely by this check plus `restauranteId` filters in every Prisma query. When adding a route, always call it and always scope queries by `restauranteId`.

**Standard API route shape** (see `src/app/api/restaurantes/[id]/operaciones/route.ts`):
- `export const dynamic = "force-dynamic";`
- `params` is a `Promise` — `const { id } = await params;`
- Parse/validate input with a Zod schema from `src/lib/validation/`
- Wrap the body in `try/catch` and return `handleRouteError(error)` (`src/lib/api-helpers.ts`), which maps `AuthError` → 401/403, `ZodError` → 400, `NotFoundError` → 404.

**Prisma client is generated to `src/generated/prisma`**, not `node_modules`. Import `db` from `src/lib/db.ts` (a global singleton using the better-sqlite3 adapter) — never instantiate `PrismaClient` directly. After changing `prisma/schema.prisma`, run `npx prisma generate`.

**AI assistant is a resilient cascade** (`src/lib/ai/`): `provider.ts` tries Gemini → Groq → returns null, and `dialogo.ts` is a deterministic guided fallback so the assistant **works with no API keys at all**. Conversational flows are defined in `flujos.ts`; assistant output is validated against the same Zod flow schema before use. Keep this fallback intact — don't make the assistant hard-depend on an external LLM.

**Python bridge** (`src/lib/pythonBridge.ts`): spawns `PYTHON_BIN` (default `python`), passes input as JSON on stdin, parses JSON from stdout. Models are saved per-restaurant as `.joblib` under `predictor/models/` (gitignored).

**Language:** the domain, comments, enums, UI strings, and identifiers are in **Spanish** (`restaurante`, `residuo`, `entrega`, `colaborador`, `turno`). Match this convention in new code.

## Layout

- `src/app/api/` — REST routes. Tenant routes live under `restaurantes/[id]/`; auth under `auth/`.
- `src/lib/` — `auth.ts`, `db.ts`, `pythonBridge.ts`, `api-helpers.ts`, business logic (`estadisticas.ts`, `recomendaciones.ts` R1–R10 rules, `costo.ts` kg→S/, `reporte.ts`), `ai/`, and `validation/` (shared Zod schemas).
- `@/*` path alias → `src/*` (backend only).
- `frontend/src/routes/` — TanStack file-based routes (`routeTree.gen.ts` is generated). `frontend/src/lib/api.ts` is the typed HTTP client.
- `prisma/schema.prisma` — SQLite schema; `seed.ts` demo data.
