# Health Hub v16 technical audit

Audited the recovered application from main commit `d93b287`. The import contains
`index.html`, `manifest.webmanifest`, `sw.js`, and `icon.svg`. The previously
mentioned PNG icons are not present. No application was reconstructed, no CSS or
visual layout was changed, and no deployment was performed.

## Findings and fixes

| Finding | Cause and correction |
| --- | --- |
| Recipes break Kitchen rendering and make later navigation/actions appear broken | `guidedInstructions()` referenced undefined `safetyLine`, `grain`, and `veg`. Use the existing safety text and derive sides from the original ingredient categories. Existing recipes and directions are retained. |
| Completing ingredient prep collapses the entire recipe | The completion handler used the nearest `details`, including the outer recipe. Limit automatic advancement to cooking step details. Ignore toggle events from detached cards after rendering. |
| Unknown nutrients can show as zero | `Number(null)` and `Number('')` are zero. Preserve null/blank/missing nutrition as unknown. |
| Invalid Kitchen edits can log an older quantity | The change handler rejected edits without invalidating the log operation. Validate current visible inputs before logging; only persist valid edits. |
| Malformed backups can break rendering | Import only checked two arrays before replacing other fields. Validate the shapes and values used by renderers before accepting stored or imported data. Invalid imports leave current data unchanged. Update the backup filename to v16. |
| PWA activation deletes other apps' caches | Cache Storage is shared across an origin, including GitHub Pages projects. Delete only old Health Hub cache names. Restrict interception to the worker scope and use the app shell as an offline navigation fallback. Bump the cache version. |
| Manifest identity/scope implicit | Declare relative scope and identity explicitly; retain relative asset and start URLs for GitHub Pages. Reference the existing SVG as favicon. |

## Automated validation

Run from `/workspace/health-hub`:

```sh
npm_config_cache=/tmp/health-hub-npm npm ci --ignore-scripts
npm test
```

Playwright uses system Chromium at `/usr/bin/chromium`; override with
`CHROMIUM_PATH` on other machines. Python 3 serves the static app. No application
build or backend is required. `npm start` serves the parent directory on port
8000 so tests exercise `/health-hub/`, as on a GitHub Pages project site. Do not
use this development server as a public deployment server.

The suite runs eight scenarios at desktop and mobile viewport sizes (16 tests):

- Navigation, discovery search/filtering, and rendering all 139 original recipes.
- Recipe selection, portion scaling, measured batch allocation, prep completion,
  logging, reload persistence, and removal.
- Online food selection, Kitchen transfer, adjusted portions, nutrition totals,
  reload persistence, and removal of logged and Kitchen foods.
- Missing nutrients and rejection of zero direct-log portions.
- Online service failure recovery and continued curated discovery.
- Rejection of invalid Kitchen edits without logging stale amounts.
- Backup export/import and rejection of malformed backups.
- Manifest/icon loading, project-subpath URLs, service worker activation,
  preservation of other apps' caches, and offline navigation/discovery.

The initial run reproduced recipe failures in both viewport sizes. After fixes,
all 16 tests passed. API responses are mocked for repeatability. This establishes
application handling of online food results, not availability of the live API.

## Remaining issues and limits

- A real Open Food Facts request was denied by the cloud egress proxy (CONNECT
  403). `world.openfoodfacts.org` was added to the saved environment draft;
  runtime access and browser CORS behavior must be rechecked after the setting
  is applied. The app reports search failure and retains curated discovery.
- Only Chromium was executed, with mobile viewport/touch emulation. Real iOS,
  Safari, Firefox, and OS-level installation/update prompts remain untested.
- The manifest currently uses the recovered SVG. The original `icon-192.png`
  and `icon-512.png` were not imported; restore original assets for broader
  installer support rather than inventing replacements.
- Local storage is browser/origin-specific; there is no account sync. An origin
  change will not migrate data automatically. Export/import provides backup.
- Curated recipe logs intentionally have no verified nutrition values. Home
  meal counts track curated meal logs; weighed-product entries have their own
  log and calorie summary. Those summaries are partial intake, as labeled.
- Some existing header/backup-era branding is older than v16. The header is
  preserved to avoid changing the requested visual design.
- Recipe directions include existing generated cook-along guidance; automated
  UI coverage does not establish nutritional or culinary accuracy.
- GitHub Pages compatibility is verified locally at the project path. Repository
  Pages settings, a public deployment, and production behavior were not changed
  or tested. No CI deployment workflow was added.

Changes are local for review. Publishing the cloud environment snapshot is
separate from deploying the website; no website deployment is authorized.
