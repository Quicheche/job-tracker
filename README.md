# Job Tracker

A personal job discovery and tracking tool focused on backend/SDE roles.

## What it does

- Watches a list of companies on Greenhouse and surfaces jobs you haven't seen yet
- Filters for IC software/backend engineer roles — excludes managers, staff+, interns, and new grads
- Runs a rule-based backend relevance score on each job before you decide to import
- Lets you track jobs you're actively pursuing with status, score, and notes

## Features

### Watchlist (discovery)
- Add Greenhouse company slugs (e.g. `stripe`, `airbnb`)
- Click **Refresh Watchlist** to fetch new jobs from selected companies
- Only shows jobs not previously seen (tracked via `localStorage`)
- Filters: location, level, fresh window (unseen / last 24h / last 7d)
- Each job gets a backend relevance badge: ✅ proceed / 🟡 maybe / ❌ skip
- Import selected jobs into the tracker — or just browse and skip

### Job Tracker (tracking)
- Add jobs manually or import from Greenhouse/Lever board URLs
- Paste raw job text (LinkedIn post, email alert) and auto-parse it
- Track status: saved → applied → interviewing → rejected
- Add a personal score (1–10) and notes per job
- Filter and search the job table by status, company, or title

## Workflow

1. Add company slugs to the watchlist
2. Click **Refresh Watchlist**
3. Review fresh jobs — check relevance badges and source URLs
4. Optionally import selected jobs into the tracker
5. Update status and notes as you progress

## Why "unseen" instead of "last 24h"

Greenhouse's public API does not reliably expose `posted_at` or `updated_at` timestamps at the job list level. Instead of guessing recency, the app tracks which URLs you've already seen in `localStorage`. A job is "fresh" if you haven't seen it in a previous refresh session.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- TypeScript
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- `localStorage` for seen-job tracking and watchlist persistence

## Getting started

```bash
cd job-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database (`jobs.db`) is created automatically on first run.

## Limitations

- Watchlist only supports Greenhouse (`boards.greenhouse.io`)
- No reliable `posted_at` timestamps from Greenhouse
- Company list is maintained manually
- Role filtering is rule-based, not AI-powered

## Customizing filters

Edit `lib/importRules.ts` to adjust:

- `TITLE_KEYWORDS` — which titles count as relevant
- `DISCOVERY_TITLE_INCLUDE` / `DISCOVERY_TITLE_EXCLUDE` — watchlist role filter
- `LOCATION_KEYWORDS` — location matching per region
- `SPONSORSHIP_KEYWORDS` — H1B/visa signal detection
