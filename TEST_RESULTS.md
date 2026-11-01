# Menu/catalog validation results

## Final automated runs

- `npm test -- --reporter=line --output=/tmp/hh-published-acceptance-results`: **144 passed**, 1.8 minutes, desktop/mobile Chromium. Preserves 100 prior production/security/Phase 2 cases and 38 catalog-foundation cases, plus six published-source/catalog workflows.
- `npm run test:preview -- --reporter=line --output=/tmp/hh-published-preview-acceptance-results`: **27 passed**, 52.3 seconds, desktop/mobile/emulated tablet.
- `npm run build:preview`: **12 privacy/integrity checks passed**, 139 original recipe definitions unchanged. The unverified-directory entries still contain no menu items; actual reviewed menu data is separately attributed.
- JavaScript syntax, original inline CSS/CSP directive preservation, ZIP allowlist/hash and `git diff --check` verified.

Browser: Chromium on Debian Linux, with Playwright desktop/mobile and 800×1280 tablet emulation. Physical Android was not tested. Source access uses TLS-validating Python HTTPS; headless external navigation encountered a certificate-trust error and was not bypassed. This does not affect internal browser tests.

## Menu/catalog regression coverage

19 scenarios run on both application projects: directory vs live-search labeling; apostrophe/location matching; source/ID/URL validation; historical menu freshness; nutrient-specific priorities and goal explanations; allergens, may-contain and restrictions; standard portions vs substitutions; source cards/categories; partial unknown totals; profile preferences and favorite provenance; plan/consumption/grocery/duplicate protection; modified item names; invalid-state recovery; inert malicious text/no external health-data requests; offline custom entry/tablet width; malformed-catalog fallback; legacy fields/preferences through goal edits; serving-basis/manual nutrient changes; and browsable sourced menu items with unknown nutrition.

Actual published coverage is **five restaurants and 291 menu items**; 17 have some published nutrition. Six added test executions verify the real catalog counts, provenance/nutrition gates and a Sexy Steak unknown-nutrition order. Synthetic test fixtures represent a fictional test kitchen and are excluded from runtime/demo assets. Tests demonstrate code behavior, not real menu accuracy, live provider availability or official source access.

## Failures found and fixed during validation

An earlier preview run caught newly blank nutrient fields being added to unchanged legacy components. The editor now preserves absent legacy fields; original exact-state assertions pass without weakening them. A security regression test could finish before its invalid-import alert was accepted; it now waits for the alert, acceptance and input reset before checking unchanged records. An initial new test used a CSS type attribute selector on an input whose default type is text; it now uses the accessible label. A screenshot health probe left its HTTP body unread under Node; it now consumes the response before browser capture.

The passing final runs above followed these fixes. No tests were skipped, disabled or replaced by trivial assertions.

## Privacy and visual review

The allowlisted 19-file build excludes Git history, backups, tests/fixtures, screenshots, reports, dependency directories and development-only files. All generated import readers are absent, legacy callbacks reject without reading, import inputs remain disabled after rendering, and demo storage is separate from production. Source-path inspection supplements automated scans; scanning alone cannot guarantee that every possible sensitive string is absent.

`node scripts/capture-demo.cjs` captured fresh fictional-household screenshots, with no page errors or page-width overflow. Original eight workflows and a phone screen are retained; the earlier foundation brand profiles deliberately showed unavailable/unverified menus, and a custom order shows unknown nutrition. See `artifacts/SCREENSHOTS.md`. Images were inspected for content/layout; no real browser records were used. Screenshots show the interface; source verification is backed by the publication register and hashes, not screenshots alone.

## Public-source and visual review follow-up

41 public publications were retrieved and their hashes recorded. McDonald's national menu, Fixins Detroit PDF, Sexy Steak's confirmed Detroit website, Chick-fil-A menu/product pages and Zukin's Lincoln Park menu are accessible. Item names/categories and selected numeric facts were checked against the returned publications; no prices/images/full promotional prose are copied. Allergen completeness remains conservative and unsupported variants retain unknown nutrition. Live source access is evidence of retrieval, not guaranteed future availability or official API integration.

15 screenshots use fictional household records, with real public menu facts where available. Three updated brand screens show actual menu cards; Dunkin' shows missing verification; the new recommendation screen uses published Chick-fil-A data. No personal health records were used. The gallery is `artifacts/SCREENSHOTS.md`.

Dunkin' and several other sites still restrict requests. Eighteen identities remain explicitly unverified. Full comprehensive restaurant coverage, real-device ergonomics/installability and hosted preview behavior remain unverified. No Cloudflare deployment, production change or PR merge was performed.
