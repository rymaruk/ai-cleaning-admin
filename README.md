# AI Cleaning Admin

Admin UI for semantic product search: describe a cleaning problem and get product recommendations via AI embeddings and Supabase vector search.

## Stack

- **Next.js** (App Router, TypeScript)
- **shadcn/ui** for components
- **OpenAI** `text-embedding-3-large` for embeddings
- **Supabase** RPC `match_products` for vector search

## Install

```bash
cd ai-cleaning-admin
yarn install
```

**If the build fails with “Module not found” (e.g. `class-variance-authority`, `clsx`):**  
This usually happens when using Yarn PnP. The project includes `.yarnrc.yml` with `nodeLinker: node-modules` so dependencies are installed into `node_modules` and Webpack can resolve them. If you still use PnP (no `node_modules`), run:

```bash
yarn install
```

If your lockfile is immutable, run once: `yarn config set enableImmutableInstalls false`, then `yarn install` again. After that, `yarn build` should succeed.

## Environment

Copy the example env and set values (server-side only; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client):

```bash
cp .env.example .env
```

Edit `.env`:

- `OPENAI_API_KEY` — OpenAI API key (for embeddings)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (bypasses RLS)

## Run dev

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

**Note:** If you see a Turbopack “workspace root” or “Next.js package not found” error when running `yarn build`, the build script uses `next build --webpack` so production builds use Webpack instead of Turbopack. If `yarn dev` fails with the same Turbopack error, run `yarn dev -- --webpack` to use Webpack for development too.

## Flow

1. **UI** — User enters a “cleaning problem” (e.g. “жирна пляма на стільниці” or “чим прибирати після ремонту”) and clicks “Знайти рішення”.
2. **Next.js API** — `POST /api/match-products` receives `{ query, matchCount?, minSimilarity? }`.
3. **2-stage LLM pipeline** (see below) runs on the server.
4. **Response** — API returns `{ query, rewritten?, matches, recommendation? }`; the UI shows “Рекомендовано” (1–3 top picks with reasoning), “Усі результати”, and an optional accordion with the rewritten query for debugging.

All secrets stay on the server; the client only talks to the Next.js API.

## 2-stage LLM pipeline (AND-like relevance + recommendations)

To get **AND-like** behaviour (query parts like “після ремонту” and “прибирати” must all be reflected) and **1–3 recommended products with reasoning**, the API uses two LLM steps:

### Stage 1: Query rewriter (before embedding)

- **Input:** raw `user_query`.
- **Output:** structured JSON: `intent`, `surfaces`, `dirt`, `context`, `constraints`, `rewritten_query` (Ukrainian text that encodes all constraints).
- **Behaviour:** Same query string is cached in memory for 5 minutes to avoid repeated calls.
- **Fallback:** If Stage 1 fails (timeout, parse error), the server embeds the **raw query** and continues.

### Stage 2: Candidate reranker (after RPC)

- **Input:** original query, Stage 1 JSON, and the list of candidates returned by `match_products` (default 30, `min_similarity` 0.25).
- **Output:** 1–3 `top_picks` with `id`, `reason`, `usage_tip`, `confidence`; optional `notes`.
- **Rules:** Only IDs from the candidate list are allowed; preference for products that satisfy multiple constraints (AND-like).
- **Fallback:** If Stage 2 fails, the API still returns `matches` and `recommendation: null`.

### Defaults and reliability

- Pipeline defaults: `match_count = 30`, `min_similarity = 0.25` (can be overridden by request body).
- Models: `gpt-4o-mini` for both stages (cost and latency).
- Timeouts: Stage 1 ~15s, Stage 2 ~20s; errors are caught and fallbacks applied.
