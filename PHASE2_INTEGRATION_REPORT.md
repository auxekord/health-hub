# Phase 2 integration report

## Production reconciliation

Production main at review baseline is `2554aba3e4ec77561eeea2bd87cf7e32ad9fcd01`. PR #3 is merged. PR #4 remains open and draft, not assumed deployed. Existing draft PR #2 and its `feature/phase-2-connected-health` branch are retained; no competing implementation was created.

Merge commit `070db82` brings current production security into Phase 2. Commit `35a1e0a` carries the pending PR #4 repair onto this branch without merging PR #4 or changing main. Review PR #4 first if desired; reconcile any subsequent changes there before approving Phase 2. Neither pull request has been merged by this work.

## Security and data compatibility

The production safe renderer, validated identifiers/imports, neutral defaults, recovery UI and CSP remain. Phase 2 writes through the same guarded store, preserving `healthhub-v5`, stale-tab detection and non-destructive invalid-state recovery. Invalid nested Phase 2 data also blocks writes; recovery exports raw data rather than silently resetting it. CSP directives are retained with refreshed inline-script hashes. Restaurant controls use safe DOM construction; saved links require HTTPS and open with noopener/noreferrer.

Existing root profiles and records are retained. Phase 2 uses saved goals when available and neutral unset defaults otherwise. Profile edits synchronize supported profile fields between the existing and Phase 2 views without clearing history. Legacy backups remain supported; nested Phase 2 backups are validated and merged by stable identity, retaining current profiles and conflicting existing IDs. Restore remains an explicit separate action. Minimal legacy restaurant records remain readable. No storage clearing or history rewriting is introduced.

All 139 recipes and their original instructions remain intact. Original inline design CSS is preserved; supporting scoped styles retain the four destinations Today, Plan, Journal and Progress. Kitchen, discovery and recipes remain reachable through supporting actions.

## Food search

The carried PR #4 implementation retains Open Food Facts free-text search and the existing permitted endpoint. The timeout covers response headers and body; offline, HTTP, rate-limit, malformed-response and connection failures have distinct messages. Stale selections are cleared. Requests omit credentials and referrers; no proxy or TLS bypass is introduced. Mocked tests establish request and UI behavior, not live provider availability.

## Connected workflow

Saved/local restaurant search and manual entry are available from Plan and Journal. External map/menu links require deliberate navigation. Independent components support quantities, serving basis, consumed fraction, preparation and nutrition provenance. Planned meals never become consumption automatically. Household logs are separate snapshots; changing a logged entry to another profile creates a new instance and preserves the original. Favorites and repeats require confirmation; linked-plan duplicate logging is blocked.

Groceries include home-prepared meals or explicitly opted-in custom/packaged meals. Restaurant meals never contribute automatically, even when an inclusion flag is supplied. Users may deliberately convert a meal to home-prepared before including its components.

## Changed file groups

- `index.html`, `sw.js`, `app/model.js`, `app/phase2.js`, `app/phase2.css`: connected interface, model, offline shell and navigation.
- `app/data-safety.js`, `app/privacy-ui.js`: shared recovery/import/profile compatibility.
- `app/restaurants.js`: local discovery adapter, saved restaurants and link handling.
- `tests/`: preserved production/security/food-search coverage plus hybrid and preview regressions.
- `preview/`, preview scripts/config and package scripts: isolated fictional build and screenshot tooling.
- Integration, implementation, test and preview reports: review evidence and boundaries.

## Remaining risks and manual review

Browser-local storage has no cross-device synchronization, account isolation or encryption. Profile selection is not authentication. Clearing site storage, browser eviction or device loss can lose records; private backups remain important. Stale-write detection is best effort, not a transactional multi-device database. Older records without reliable profile/date attribution require user review; raw legacy data is preserved.

Nutrition provenance is user-entered, not independently authenticated. Unknowns and partial totals are explicitly displayed. No official Campestre menu, serving sizes, prices or nutrition are asserted. No automatic restaurant/menu provider is enabled. External links disclose the entered name/city or navigation metadata to their destination only after a deliberate click; never journal contents.

Review the fictional tablet screenshots and core workflows, backup recovery on disposable fixtures, and provider dependency before merging. Real-device, live-provider and hosted Cloudflare checks remain unverified. No production deployment, Pages setting change, Cloudflare upload or merge was performed. Merging into main can trigger existing Pages deployment and requires separate approval.

## Menu/recommendation extension — source verification blocked

The same Phase 2 branch now includes `app/catalog-data.js`, `app/catalog.js` and `app/catalog-ui.js`: an offline research-directory/catalog boundary, safe menu cards, local preference-aware comparisons and a custom order basket. No current menus could be verified through this environment; actual verified coverage is zero. Five requested names are explicitly unverified directory entries, never live search results. See RESTAURANT_COVERAGE.md, MENU_SOURCES.md, RESTAURANT_DATA_PROVIDERS.md and RECOMMENDATION_ENGINE.md.

Optional sodium, saturated fat, sugar and added sugar fields preserve legacy records with absent values. Editing an unchanged old component does not add empty fields. Profile preferences are optional, validated, backed up and preserved by ordinary goal edits. Sourced item metadata is validated; standard-item name/unit/preparation/basis changes clear inherited nutrition. Manual nutrient edits are labeled estimates. Catalog/order actions still save through the guarded production store and existing confirmation editor. Restaurant grocery exclusion and plan/actual separation are unchanged.

A new demo replaces only local generated artifacts. The earlier reviewed `dc46faf` ZIP is preserved separately at `artifacts/health-hub-phase2-demo-dc46faf.zip`. Existing hosted previews and production remain untouched. Current data access is blocked, so this is a foundation for sourced menus rather than completion of the verified-menu success criterion.

## Published-source follow-up — November 1, 2026

The earlier source-access blocker is resolved for public sites. The current catalog replaces the empty-menu foundation with five reviewed restaurants, 291 published item names and 41 linked publications. Seventeen items have some directly published nutrition; all other values remain unknown. Source evidence includes retrieval hashes. Dunkin' still denies access and remains a clearly unverified directory entry. See the current RESTAURANT_COVERAGE.md and MENU_SOURCES.md; earlier zero-coverage paragraphs describe the previous foundation build, not this release.

The UI initially offers Higher protein comparisons using sufficiently known standard-item facts. Independent menus can be browsed with unknown nutrition. No broad discovery API, new backend, health-data transfer, paid service or production deployment was introduced. Original storage/security protections, 139 recipes, profile separation, backups and import-disabled separate-origin demo remain.

## Source-aware meal replacement

Plan replacement now asks home versus restaurant first, uses the existing recipe/catalog workflows, and preserves the original entry until explicit confirmation. Restaurant suggestions consider the original slot and selected profile; unknown nutrition is retained. See [replacement workflow](REPLACEMENT_WORKFLOW.md) for behavior, tests and limitations. No deployment or merge was performed.
