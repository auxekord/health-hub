# Menu/catalog validation results

## Final automated runs

- `npm test -- --reporter=line --output=/tmp/hh-catalog-acceptance-results`: **138 passed**, 1.7 minutes. 100 preserved application/security/food-search/Phase 2 cases plus 38 menu/catalog cases, across desktop and mobile Chromium projects.
- `npm run test:preview -- --reporter=line --output=/tmp/hh-catalog-preview-final-results`: **27 passed**, 1.0 minute. Existing 21 preview cases plus six directory/custom-order cases across desktop, mobile and emulated tablet.
- `npm run build:preview`: **12 build privacy/integrity checks passed**, including unchanged original 139-recipe JSON, no working import reader, no production namespace/hostname, no known original medical wording/default demographics, no common credential patterns, no test menu fixtures and no menu items in unverified directory entries.
- JavaScript syntax checks, original inline CSS/CSP directive comparison, ZIP hash/allowlist verification and `git diff --check` completed.

Browser: Chromium 154.0.8037.57 on Debian Linux. Runtime: Node 24.19.0. Playwright desktop/mobile and 800×1280 tablet emulation are not physical Android testing.

## Menu/catalog regression coverage

19 scenarios run on both application projects: directory vs live-search labeling; apostrophe/location matching; source/ID/URL validation; historical menu freshness; nutrient-specific priorities and goal explanations; allergens, may-contain and restrictions; standard portions vs substitutions; source cards/categories; partial unknown totals; profile preferences and favorite provenance; plan/consumption/grocery/duplicate protection; modified item names; invalid-state recovery; inert malicious text/no external health-data requests; offline custom entry/tablet width; malformed-catalog fallback; legacy fields/preferences through goal edits; serving-basis/manual nutrient changes; and browsable sourced menu items with unknown nutrition.

Actual source-verified menu coverage is **zero**, not 38 menu items. Synthetic test fixtures represent a fictional test kitchen and are excluded from runtime/demo assets. Tests demonstrate code behavior, not real menu accuracy, live provider availability or official source access.

## Failures found and fixed during validation

An earlier preview run caught newly blank nutrient fields being added to unchanged legacy components. The editor now preserves absent legacy fields; original exact-state assertions pass without weakening them. A security regression test could finish before its invalid-import alert was accepted; it now waits for the alert, acceptance and input reset before checking unchanged records. An initial new test used a CSS type attribute selector on an input whose default type is text; it now uses the accessible label. A screenshot health probe left its HTTP body unread under Node; it now consumes the response before browser capture.

The passing final runs above followed these fixes. No tests were skipped, disabled or replaced by trivial assertions.

## Privacy and visual review

The allowlisted 19-file build excludes Git history, backups, tests/fixtures, screenshots, reports, dependency directories and development-only files. All generated import readers are absent, legacy callbacks reject without reading, import inputs remain disabled after rendering, and demo storage is separate from production. Source-path inspection supplements automated scans; scanning alone cannot guarantee that every possible sensitive string is absent.

`node scripts/capture-demo.cjs` captured 14 fresh fictional-context screenshots, with no page errors or page-width overflow. Original eight workflows and a phone screen are retained; four brand profiles deliberately show unavailable/unverified menus, and a custom order shows unknown nutrition. See `artifacts/SCREENSHOTS.md`. Images were inspected for content/layout; no real browser records were used. Menu screenshots are not evidence of verified menu browsing.

## Remaining verification

21 candidate source sites were blocked by the environment proxy; two requested identities need source clarification. Official menu/nutrition research, reproduction permissions and actual branded recommendations remain incomplete. Current provider prices/terms were not independently verified. No real-device, hosted Cloudflare or live Open Food Facts success is claimed. Production, existing hosted preview and Cloudflare settings were not changed.
