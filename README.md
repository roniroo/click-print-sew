# Cut Sew Print

A free, open-source **sewing pattern studio** in your browser. Design patterns on
graph paper, set real-world dimensions, print them tiled across any paper size,
track your materials, and share patterns with the community — **no email or PII
required**, just a username and password.

> Repo: `click-print-sew` · App name: **Cut Sew Print**

## Features

- **Pattern Builder** — an SVG vector editor with snap-to-grid, hold-Shift 45°
  angle locking, layers, and named pattern pieces. Lines, multi-point paths,
  rectangles, and ellipses.
- **Real-world units** — work in inches, cm, mm, meters, or feet; dimensions
  update live.
- **Tiled PDF printing** — split a pattern across Letter / Legal / Tabloid / A4 /
  A3 / A5 pages with overlap, registration marks, and a scale test square.
- **Materials list** — assign fabrics per piece with yardage estimates, and pin
  notions (buttons, zippers, clasps) onto the pattern.
- **Pattern library** — save private patterns, publish public ones, browse the
  community gallery, and clone any public pattern.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — Postgres, Auth, Row Level Security
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** (editor state) · **jsPDF + svg2pdf.js** (PDF export) · **Vitest** (tests)
- Deploys to **Render** from GitHub.

## Local development

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values
(Project Settings → API):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database

The schema lives in `supabase/migrations/`. Apply it to your Supabase project
with the CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

(Or paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor.)

This creates `profiles`, `patterns`, and `pattern_likes`, the row-level security
policies, and a trigger that creates a profile from the username on signup.

### 4. Auth setting

Because accounts use a username (no real inbox), turn **off** email confirmation:
Supabase Dashboard → Authentication → **Email** → disable "Confirm email"
(equivalently, enable auto-confirm). Sign-ups then work immediately.

### 5. Run

```bash
npm run dev      # http://localhost:3000
```

### Scripts

| Command             | What it does          |
| ------------------- | --------------------- |
| `npm run dev`       | Start the dev server  |
| `npm run build`     | Production build      |
| `npm run start`     | Run the production build |
| `npm run lint`      | ESLint                |
| `npm run typecheck` | TypeScript, no emit   |
| `npm run test`      | Vitest (watch)        |
| `npm run test:run`  | Vitest (once)         |

## How username-only auth works

Supabase Auth is email-based, so each account maps to a deterministic internal
email derived from the username (`<username>@users.cutsewprint.app`). The UI only
ever shows the username; login converts it back to that internal email. Username
uniqueness is enforced by a `UNIQUE` constraint on `profiles.username` and by the
1:1 email mapping. See `src/lib/actions/auth.ts`.

## Deploying to Render

`render.yaml` is a Render Blueprint. Connect the GitHub repo in the Render
dashboard, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
in the service's environment. Pushes to `main` auto-deploy.

## License

MIT — free and open source. Contributions welcome.
