# Menu/catalog validation results

## Final automated runs

The latest meal-replacement validation is recorded below. The preserved baseline comprised 144 application tests and 27 preview tests; eight desktop/mobile replacement scenarios and one scenario across three preview viewports extend it to 160/30.

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

## Meal replacement validation

Commands: `npm test -- --reporter=line --output=/tmp/hh-replace-final` and `npm run test:preview -- --reporter=line --output=/tmp/hh-replace-preview-final`. Final outcomes: **160 passed (2.0m)** and **30 passed (1.0m)**, respectively. The first full run already passed 160 application cases and 30 preview cases. Visual review then caught scoped label styles overriding the browser's hidden attribute and unstyled recipe-search inputs. The dialogs now explicitly honor hidden controls, use existing dark form styles and hide inapplicable grocery toggles during replacement; visibility assertions were added. No security assertions were weakened.

Eight replacement scenarios run on both application viewports. They cover source/cancel, 139 searchable original recipes/instructions, custom home cancellation, reviewed restaurant and slot-relevant suggestions, household context/portions, unknown independent-menu nutrition, atomic favorites, no journal/duplicate/grocery regressions, stale-original protection and tablet width. The preview scenario covers both paths, confirmation/persistence and disabled imports on desktop/mobile/tablet.

22 fictional-household screenshots include preparation choice, recipe search, home confirmation, restaurant selection, suggested meal, restaurant confirmation and insufficient-nutrition fallback. Physical Android and hosted preview checks remain unverified. All source catalog/recipe/security/backup coverage is retained.
