# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local development

```
npx serve .
```

No build step, no package.json, no node_modules. The output **is** the source.

## Architecture

This is a **zero-dependency static PWA**. All logic lives in two files loaded directly by the browser:

- `data/program.js` — declares `PROGRAM` as a global `const`. Single source of truth for all 12-week program data: mesocycles, rep/load schemes, lift days (mon/wed/fri/sat), zone 2 protocol, and all superset exercises per mesocycle variant (m1/m2/m3).
- `app.js` — single file split into four layers, in order:
  1. **Storage layer** — all `localStorage` access through wrapper functions only (`getMeta`, `saveMeta`, `getLogs`, `saveLogs`, `addLog`, `deleteLog`). Never call `localStorage` directly elsewhere.
  2. **Automation engine** — `getCurrentWeek()` (date math from `programStartDate`), `getMesoId()`, `getCompoundScheme()`, `getSuggestedWeight()` (last log → auto +5 if all reps hit top → 1RM%), `estimateMax()` (Epley), `detectPRs()`, `savePRs()`.
  3. **Hash router** — `VIEWS` registry object, `navigate(hash)`, `renderCurrentView()` which guards to `#onboarding` if no `lift_meta` key exists.
  4. **Views** — each view is a function `VIEWS['name'] = function(app) {}` that renders into the `#app` container. Views: `onboarding`, `dashboard`, `log`, `history`, `progress`, `program`, `settings`.

`data/program.js` is loaded before `app.js` in `index.html`.

## localStorage schema

- `lift_meta` — `{ programStartDate, maxes: { [exerciseName]: { weight, reps, date } }, bodyweight: [{ weight, date }] }`
- `lift_logs` — array of log entries:
  - Lift: `{ id, type:'lift', day, week, date, compound: { exercise, sets: [{setNum, weight, reps, completed}] }, supersets: { [ssIdx]: { [exIdx]: { exercise, sets } } }, rpe, notes, duration }`
  - Zone 2: `{ id, type:'zone2', day, week, date, activity, duration, notes }`

## Key conventions

- **`program.js` is read-only reference data** — never modified at runtime. Views and automation engine read from it directly.
- All superset exercises are keyed by mesocycle variant (`m1`, `m2`, `m3`) inside each superset object. Access via `PROGRAM.days[day].supersets[n][mesoId]`.
- Deload weeks are 4, 8, 12 — `isDeload(week)` returns true for these.
- The `VIEWS` object is populated after all view functions are defined; do not reference it before `app.js` finishes executing.
- To force a cache refresh on installed PWAs after deploying changes, bump `CACHE = 'lift-v2'` (etc.) in `sw.js`.

## Deploy

Netlify auto-deploys on push to `main`. The `netlify.toml` contains a single SPA redirect rule.
Custom domain: `lift.ddumont.dev` via CNAME to the Netlify site.
