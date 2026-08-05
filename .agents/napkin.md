# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-08-05] `tsc --noEmit` is a no-op in this repo**
   Do instead: validate with `npm run build` (runs `tsc -b && vite build`) or `npx tsc -b --force`. The root tsconfig is a solution file (`files: []` + references), so plain `--noEmit` checks nothing.
2. **[2026-08-05] CSS errors only surface at build time**
   Do instead: after editing App.css/index.css run `npm run build`; lightningcss throws on syntax errors tsc never sees.
3. **[2026-08-05] oxlint exits 0 with warnings — accepted**
   Do instead: treat only `npm run build` failure as blocking; pre-existing warnings (fast-refresh, exhaustive-deps, settings.ts/sw.js unused) are tolerated.

## Domain Behavior Guardrails
1. **[2026-08-05] UI copy in Spanish, code identifiers in English**
   Do instead: user-facing strings es-AR ("Agregar al carrito", "Eliminar seleccionadas"), identifiers/comments English. Use `import type` for type-only imports.
2. **[2026-08-05] supabase `.select("*")` returns untyped rows**
   Do instead: cast results explicitly (`data as GarmentRow[]`) or filter callbacks get `implicit any` under `tsc -b`.

## Shell & Command Reliability
1. **[2026-08-05] PowerShell 5.1 — no `&&`**
   Do instead: chain with `cmd1; if ($?) { cmd2 }`, and use `workdir` instead of `cd`.

## User Directives
1. **[2026-08-05] Work directly on `main`**
   Do instead: commit and implement on main; no feature branches unless user asks.
