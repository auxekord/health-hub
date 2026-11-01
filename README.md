# Health Hub

Mobile-first, browser-local nutrition, meal planning, food journaling, and grocery
management PWA. **Plan it. Live it. Track it.**

The recovered v16 application and all 139 original recipes are retained. Phase 2
adds Today, Plan, Journal and Progress, with the existing food discovery and
Kitchen cooking cards accessible from Plan.

## Develop and test

Requirements: Node.js, npm, Python 3, and Chromium. No backend, API key, or
production build is required.

```sh
npm ci --ignore-scripts
npm test
npm start
```

`npm test` manages its own static server on port 8000; stop any `npm start` server
first. The development server serves the parent checkout directory so the app
is exercised at the GitHub Pages project path `/health-hub/`. Do not expose this
server publicly. Playwright uses `/usr/bin/chromium`; set `CHROMIUM_PATH` if yours
is elsewhere. Tests cover desktop/mobile Chromium and tablet dimensions; these
are emulations, not real-device certification. External food API tests are mocked.

## Daily workflows

- **Today:** choose a household profile, review actual versus planned nutrition,
  quick-log a plate, or open the next planned meal.
- **Plan:** add meals to any of seven dates, choose original recipes or saved
  meals, edit components and each person's portions, move/duplicate/replace,
  reuse last week, and shop from the displayed week's grocery list. Food
  discovery and the original Kitchen scratchpad remain available below.
- **Journal:** log a restaurant, home-cooked, packaged or custom meal, or reuse a
  favorite. Every plate is editable. Restaurant names may be entered manually;
  saved names are searchable without a third-party restaurant database.
- **Progress:** review per-profile planned versus actual nutrition, protein
  consistency, weight records and existing step/weight history.

Plans never count as eaten. **Log as eaten** opens an editable snapshot for one
household profile; the original plan stays unchanged. Log the other household
member separately. Duplicate taps reopen the existing linked entry for that
profile/date. If you intentionally ate the same dish again, use Journal repeat.

Each component has its own amount, unit, source, estimate status and optional
per-unit nutrition. For nutrition listed per 100 g, divide the label's values by
100 to enter per 1 g. Unknown amounts/nutrients stay unknown. Recipe nutrition is
not fabricated. Compatible weight/volume units convert; incompatible unit
changes clear quantities/nutrients for review. Restaurant nutrition must be
entered from a named source or left unknown. Estimates are never labeled official.

Grocery quantities come from the displayed week's non-restaurant meals and both
profiles' portions. Compatible units combine. Checkoffs, on-hand status and edits
are stored per ingredient/week; manual items carry forward. Edited quantities
remain overrides until **Use plan amount** is selected. Previous-week reuse skips
matching name/category/date entries to avoid duplicates.

## Data and privacy

All health data stays in this browser's localStorage. No cloud backend,
authentication, analytics, or health-data transfer was introduced. Existing
Open Food Facts search sends your search query when you choose to use it.
There is no cross-device synchronization or server recovery. Clearing site data,
private browsing, storage eviction, or switching origins can lose local records.
Keep private export backups; they contain personal journal data. Never commit
personal backups to this public repository. Import validates Phase 2 records
before changing current data. Old v16 data and backups remain supported.

See [AUDIT.md](AUDIT.md) for the v16 audit and [PHASE2.md](PHASE2.md) for architecture,
validation, remaining limitations, and the Phase 2 change record. No deployment
or merge is authorized by development/test commands.

## Integrated Phase 2 review

See [integration report](PHASE2_INTEGRATION_REPORT.md), [restaurant implementation](RESTAURANT_IMPLEMENTATION.md), [test results](TEST_RESULTS.md), and [sanitized preview instructions](PREVIEW_BUILD.md). The existing Phase 2 draft PR includes production security and pending food-search repair changes; no deployment is authorized.
