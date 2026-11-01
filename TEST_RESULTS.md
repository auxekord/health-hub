# Validation results

## Completed automated suites

- `npm test -- --reporter=line`: **100 passed**, 1.6 minutes. Chromium desktop and mobile projects cover original recipe/navigation/Kitchen flows, production security, food-search response/error handling, Phase 2 workflows, migration, recovery, backup and hybrid restaurant regressions.
- `npm run test:preview -- --reporter=line`: **21 passed**, 45.5 seconds. Covers isolated fictional storage, disabled legacy and modern backup imports, recipe preservation, offline behavior, demo persistence and mobile/tablet interactions.
- `npm run build:preview`: all ten build privacy/integrity checks passed; 139 recipe definitions match the original source.

Hybrid coverage includes local creation/search/reuse; URL safety; missing menus; Campestre independent quantities, consumed fractions, component removal/addition, serving basis and partial/unknown totals; household independence; plan/journal separation; favorites/repeat; duplicate protection; refresh; restaurant grocery exclusion and explicit home conversion; safe imports; invalid-state recovery; offline states; and layout assertions.

Provider responses are mocked where necessary. These results do not prove current Open Food Facts availability. No real health records or production browser storage were used. Fictional malicious identifiers/text are used for injection regressions. Existing production backup behavior remains covered; preview imports are intentionally unavailable.

## Visual review

`node scripts/capture-demo.cjs` captures a fresh fictional-only preview on an emulated 800×1280 tablet and 390×844 phone, traversing Today, Plan, local restaurant search/details, Campestre component editor, Journal, groceries and Progress. The gallery is generated at `artifacts/SCREENSHOTS.md`. Screenshots are excluded from deployment assets. No physical Android device or hosted Cloudflare origin was tested.

## Privacy inspection and limits

The build allowlist excludes Git history, private backups, test reports, screenshots and development source. Automated checks cover known original medical wording, demographic defaults, credential patterns, production namespace/hostname, unsafe legacy renderer and backup file reader. Source/code-path review additionally verifies that preview backup readers are removed, legacy callbacks reject without reading, and the demo loads only fictional fixtures through its own namespace. Privacy scanning is evidence, not a guarantee against every possible sensitive string.

## Remaining verification

A user should review tablet ergonomics, external menu links and actual device install/offline behavior after separately approving HTTPS preview hosting. Production and Cloudflare were not changed. No real-device or live-provider success is claimed.
