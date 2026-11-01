# Phase 2: connected health workflows

## Architecture audit and implementation plan

Baseline: main `3d7b2e5`, including the v16 audit fixes. The 139 recipes and their
specific directions remain the source of cooking cards. Existing Kitchen and
online food discovery stay available. No production deployment is authorized.

Existing limitations:
- Kitchen selection IDs represent a scratchpad, not dated meal plans.
- Actual food data is split between `logs` and per-100g `foodEntries`.
- The inline script closes over one mutable state object and re-renders whole
  card lists; adding another independent storage system would cause drift.
- No recipe has verified calorie/protein totals. Raw ingredient grams cannot
  establish nutrition. Unknown amounts and nutrition must remain explicit.
- Backups have no schema version for connected features; imports previously
  merged arbitrary root fields. New nested state needs validation and atomic saves.
- Browser-local storage has no cross-device synchronization, authentication,
  encryption, or server recovery; another tab can overwrite unsaved changes.

Implementation increments:
1. Versioned component/meal model and validation; keep the existing storage key,
   original data, and backup format, extending it with a validated `phase2` field.
2. Four primary destinations; dated week planner; reusable meal editor; original
   discovery and Kitchen beneath Plan. Preserve dark/lime styles.
3. Editable journal, manual restaurant plates, favorites, and explicit conversion
   from plan to actual. Stable IDs, independent portions, and duplicate protection.
4. Unit-aware, plan-derived groceries and profile-specific summaries/trends.
5. Browser regression tests, offline shell update, docs, and a review branch/PR.

## Data and nutrition contract

Planned meals are independent snapshots with stable meal and component IDs.
Journal entries are separate snapshots, linked to a plan only by `plannedId`.
Logging never mutates a plan. Favorites are reusable snapshots, not consumed data.
Each component records quantity/unit and optional per-unit calories, protein,
carbohydrate, fat and fiber with a source and estimate/verified/unknown status.
Recipe imports use the original raw ingredient weights with unknown nutrients.
Do not infer nutrients from recipe titles or silently convert cups into grams.

Existing logs remain in their original arrays; the Journal adapts them at read
time. Editing one explicitly replaces it with an editable journal snapshot.
No bulk migration discards original logs or Kitchen selections.

All health records stay in localStorage or user-initiated backup downloads.
No backend, login, telemetry, or third-party health transfer is added. Existing
Open Food Facts search sends only the user's search query when invoked.
Export backups regularly, especially before changing device/origin or clearing
browser storage. Backups contain personal data and should be kept private.

## Implemented features and changed files

- `app/model.js`: version 2 validation, stable IDs, meal/component snapshots,
  household quantities, explicit unknown nutrients, compatible unit aggregation,
  independent planned-to-consumed conversion, favorites and weight records.
- `app/phase2.js`: Today/Plan/Journal/Progress workflows, seven-day planning,
  meal replacement/moving/duplication/previous-week reuse, original recipe picker,
  original cooking-card access, shared meal editor, manual restaurant names and
  locations, editable plates, actual logging, favorites, profile goals and weight
  records, weekly comparisons, shopping state, confirmation and deletion undo.
- `app/phase2.css`: responsive extensions to the existing charcoal/lime system,
  accessible dialogs, seven-day grid, tablet layout and touch targets.
- `index.html`: minimal legacy bridge and Phase 2 mounts. Four primary navigation
  buttons; original discovery is a secondary destination reachable from Plan and
  Journal. Original dashboard is retained behind a disclosure. Root backups
  validate the new nested state before import. All original recipe JSON and
  original inline visual styles are preserved.
- `sw.js`: new versioned offline shell including all three new app assets.
- `tests/phase2.spec.js`: connected workflow, migration, source integrity, unit,
  household, cross-tab, invalid import and tablet interaction coverage.
- `tests/workflows.spec.js`, `tests/pwa.spec.js`, `playwright.config.js`: retain
  original regression assertions with the new discovery access route; exercise
  new offline journal functionality. Test runner configuration is reformatted.
- `README.md`: update stale pre-import status, development commands, workflows,
  unit/nutrition conventions, shopping overrides and privacy limitations.

## Validation and review

The pre-change baseline passed all 16 tests. The extended suite passed all
38 tests across desktop and mobile Chromium, including tablet dimensions. Final full run: `npm test -- --reporter=line` —
38 passed (34.6s). `git diff --check` and JavaScript syntax checks also passed.
The suite covers all 139 recipe cards, a whole week of meal planning, editing,
move/replace/duplicate/reuse, separate household portions, grocery recalculation,
manual Campestre Chicken test plates, four independently editable components,
clearly labeled estimate totals, favorites/repeat, planned-to-actual separation,
duplicate protection, household goals and weight data, undo, v16 migration,
backup round trips, invalid imports, unit assumptions and offline journal saves.
Restaurant quantities and nutrition in tests are fictional reference assumptions,
not seeded production data or claimed Campestre menu/official nutrition.
Screenshots of tablet planning and the mobile restaurant dialog were inspected
locally. Real Android/iOS devices and live food APIs were not verified.

## Remaining limitations and approval boundaries

- No reliable Campestre menu feed or verified restaurant nutrition is provided.
  Restaurant names, components, assumed amounts and nutrition sources can be
  entered manually; data may be left unknown. There is no automatic restaurant
  nutrition estimation engine. User-entered reference estimates are labeled.
- Original recipes contain raw weights but no verified nutrient database. Planned
  totals for those ingredients stay partial until the user supplies sources.
  This prevents invented precision, but means a recipe-only week initially lacks
  calorie/protein forecasts.
- Recipe and favorite selectors are native accessible lists. There is no remote
  restaurant/menu search service. Saved restaurant names have local autocomplete.
  Existing online food discovery remains available and its API tests are mocked.
- Logging a shared meal is explicit per profile. Repeated taps on a linked plan
  reopen its entry for the same person/date; intentional second servings can be
  added through Journal repeat. Leftovers are a note; entered component amounts
  always represent what was actually eaten, not an automatic subtraction.
- Original logs did not store a household member or exact time in a standard
  format. They are shown under You with a review note; the user can correct the
  profile and time. Original weighed foods are adapted separately for each person.
  Editing a legacy entry replaces only that entry/profile, preserving other data.
- Checked/on-hand groceries are scoped to ingredient/week. Manual items carry
  forward. Quantity overrides remain fixed until reset to the plan amount;
  changing the plan does not silently overwrite a user's shopping edit.
- Original Kitchen selections remain a scratchpad, not a dated plan. The new
  dated plan is the authoritative source for the smart grocery list. Original
  Kitchen prep totals are retained as a separate legacy tool.
- LocalStorage remains synchronous and origin-specific. No cross-device sync,
  encrypted storage, backend, account or cloud backup was added. New Phase 2
  writes detect another tab's storage event and require refresh; simultaneous
  legacy-tool edits across tabs remain a limitation. Quota failures retain the
  previous saved state and report an error. Large histories may require a future
  approved IndexedDB migration; no data was moved to another service.
- No arbitrary health score or weight-loss prediction is added. Protein
  consistency counts fully recorded days meeting the chosen target, not assumed
  adherence when data is incomplete. New weight records are profile-specific;
  existing weight/step records remain available.
- Original SVG manifest support is retained; missing original PNG icons, real
  install prompts, Safari/Firefox and real-device behavior remain unverified.
- Any backend, health-data transfer, restaurant API integration, deployment or
  feature removal requires separate approval. This branch must be reviewed
  before merging. No merge or production deployment is part of this work.

## Integration update

This earlier implementation record is superseded by PHASE2_INTEGRATION_REPORT.md for current storage/security behavior and RESTAURANT_IMPLEMENTATION.md for hybrid discovery.
