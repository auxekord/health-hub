# Sanitized Phase 2 preview build

## Architecture and boundaries

Build from the updated Phase 2 branch using `npm run build:preview`. Output: `/workspace/health-hub/dist/health-hub-demo`. Archive: `/workspace/health-hub/artifacts/health-hub-phase2-demo.zip`.

The preview uses fictional profiles, targets, history, plans, journals, restaurant estimates and groceries. A persistent HEALTH HUB — DEMO PREVIEW notice warns against entering real health information. Storage uses `healthhub-demo-phase2-hybrid-v2`; production namespace and hostname are absent. A distinct Pages origin provides browser storage isolation. Never serve this build under production's origin.

Personal backup imports are disabled: generated modern reader code is removed, legacy import callbacks reject without reading, and file inputs remain disabled. Production backup functionality is unchanged. Food discovery uses local fictional fixtures, not live Open Food Facts. CSP connects only to self. User-initiated external map/menu navigation remains possible with noopener/noreferrer; no automatic third-party health-data request is introduced.

## Exact upload allowlist

| File | Bytes |
| --- | ---: |
| `index.html` | 122821 |
| `manifest.webmanifest` | 376 |
| `sw.js` | 1251 |
| `icon.svg` | 313 |
| `app/model.js` | 13262 |
| `app/data-safety.js` | 8433 |
| `app/privacy-ui.js` | 10621 |
| `app/privacy.css` | 931 |
| `app/phase2.js` | 51800 |
| `app/phase2.css` | 5485 |
| `app/restaurants.js` | 13545 |
| `app/demo.js` | 5896 |
| `app/bootstrap.js` | 1465 |
| `app/demo.css` | 362 |
| `_headers` | 595 |
| `robots.txt` | 26 |

Total static files: **16**. Uncompressed: **237182 bytes**. ZIP: **63040 bytes**.

ZIP SHA-256: `45d4aec289902f71fa4af4a35f442a1fd5c64bdd144532ceaca8b62daa08a6b2`.

Only these static files are uploaded after approval. No repository history, backup files, reports, screenshots, tests, dependency directories or development-only files are bundled. `artifacts/preview-verification.json` records individual hashes.

## Validation

100 application tests and 21 preview tests passed. All ten build privacy/integrity checks passed. Manual source-path review supplements scans: generated backup file readers are absent, both import entry points are blocked, fictional seeding uses only its namespace, restaurant controls validate links, and screenshots use fresh fictional contexts. All 139 recipes and original instructions are retained. Automated scanning cannot guarantee absence of all sensitive information. This build supersedes the earlier preview ZIP, which is not deployment-approved.

## Free separate-origin hosting, after approval only

Proposed Cloudflare Pages Direct Upload free-tier project URL: `https://<available-project-name>.pages.dev/`. A project name must first be available; no exact hostname has been reserved. The preview is public unless separately protected; fictional local state stays in the reviewing browser, while the static source is publicly downloadable. Noindex headers/robots discourage indexing but are not access control. Cloudflare receives normal hosting request metadata. External links reveal deliberate search/navigation information to the destination.

After explicit approval: create/sign in to a free Cloudflare account on the Android tablet, open Workers & Pages, choose Pages Direct Upload/Create using uploaded assets (dashboard wording may vary), select an unused project name, and upload only this generated ZIP or its extracted allowlisted directory. Inspect the asset list before deploying. Do not connect the Git repository, change GitHub Pages settings, select production, or upload the whole repository. If the tablet browser cannot select/upload the ZIP reliably, use a desktop browser for upload and open the resulting HTTPS URL on the tablet.

No Cloudflare account/project or upload has been created. Free-tier limits and dashboard availability should be checked at approval time. No paid service is authorized.

## Known limitations and approval checklist

Discovery is local/manual plus explicitly opened external web searches, not an integrated restaurant API. No verified Campestre menu, official nutrition or prices are supplied. Demo estimates are fictional. Live provider availability and physical tablet installability remain unverified. Browser storage can be cleared or evicted and has no synchronization or account isolation. Do not import or enter personal data.

Review the eight workflow screenshots, component portions and basis, profile separation, grocery behavior, import restrictions, artifact inventory and privacy implications. Deployment, production remediation, PR merge and production release each remain separately gated; none is performed by preparing this archive.
