# Sanitized Phase 2 menu/order preview

## Release scope

This build adds the catalog/order/recommendation foundation but **contains zero verified restaurant menus and zero actual menu items**. The five requested names are explicitly labeled unverified research entries, not live results. Official-source access was denied by the environment policy. See RESTAURANT_COVERAGE.md and MENU_SOURCES.md. Do not use this preview as evidence that actual restaurant menus or personalized branded suggestions have been completed.

## Architecture and isolation

Build with `npm run build:preview`. Output directory: `/workspace/health-hub/dist/health-hub-demo`. New archive: `/workspace/health-hub/artifacts/health-hub-phase2-demo.zip`.

All household profiles, goals, records and restaurant estimates are fictional. The visible HEALTH HUB — DEMO PREVIEW notice tells users not to enter real health information. Storage remains `healthhub-demo-phase2-hybrid-v2` on an intended separate HTTPS origin. Never host this build on production's origin. No production namespace or hostname is present in generated files.

Both backup import paths remain blocked: modern file-reading code is removed, legacy callbacks reject without reading, file inputs remain disabled after render. Production imports are unaffected. External food search uses fictional local fixtures. Catalog data is local; recommendations never transmit profiles, preferences or journals. CSP permits connections only to self. Explicit map/menu navigation opens separate sites with noopener/noreferrer. No API credential, paid service, backend or analytics is added.

The exact previously reviewed `dc46faf` archive is preserved at `artifacts/health-hub-phase2-demo-dc46faf.zip`, SHA-256 `45d4aec289902f71fa4af4a35f442a1fd5c64bdd144532ceaca8b62daa08a6b2`. This newer archive is not deployment-approved and has not replaced an existing hosted preview.

## Exact upload contents

| File | Bytes |
| --- | ---: |
| `index.html` | 122943 |
| `manifest.webmanifest` | 376 |
| `sw.js` | 1320 |
| `icon.svg` | 313 |
| `app/model.js` | 14243 |
| `app/data-safety.js` | 8433 |
| `app/privacy-ui.js` | 10621 |
| `app/privacy.css` | 931 |
| `app/phase2.js` | 53573 |
| `app/phase2.css` | 6242 |
| `app/restaurants.js` | 15208 |
| `app/catalog-data.js` | 1539 |
| `app/catalog.js` | 10313 |
| `app/catalog-ui.js` | 13713 |
| `app/demo.js` | 5896 |
| `app/bootstrap.js` | 1465 |
| `app/demo.css` | 362 |
| `_headers` | 595 |
| `robots.txt` | 26 |

**19 files**, **268112 bytes** uncompressed. ZIP size: **73451 bytes**.

ZIP SHA-256: `e5cc17f8a425be2ab32517d802a7bc1a2e114a208f28821402382ae8b84e888b`.

`artifacts/preview-verification.json` records every file hash, build checks and explicit catalog coverage. Upload only these files after approval, never the repository. No history, backups, development/test fixtures, reports, screenshots or dependencies are bundled.

## Validation and manual review

138 application tests and 27 preview tests passed. All 12 build checks passed; source-path review confirms disabled modern/legacy imports and local-only fictional storage. Original recipe JSON and instructions are unchanged. 14 screenshots were captured with fictional data; new brand screens show unavailable menus rather than fabricated listings. Synthetic test menu publications are absent from assets. Automated scans and manual inspection provide evidence, not a guarantee against every sensitive string.

## Future separate-origin hosting — no upload performed

Proposed free Cloudflare Pages Direct Upload URL: `https://<available-project-name>.pages.dev/`; no name is reserved. The static app/source would be public. Cloudflare receives normal hosting metadata; browser-entered data remains on that preview origin. Noindex/robots headers discourage indexing but are not access control. Explicit external links disclose deliberate navigation/search information to their destinations.

After separate approval, sign in to a free Cloudflare account, choose Workers & Pages → Pages → Direct Upload (dashboard labels may vary), choose an available project name and upload only this ZIP or its extracted static directory. Review the asset list first. Android Chrome landscape/Desktop site may help; use a computer for upload if the tablet file picker cannot handle the ZIP. Do not connect the repository, replace the current preview, change GitHub Pages, add health-data service keys or upload the whole checkout. Free-tier limits must be checked at approval time.

No Cloudflare account/project, upload or setting change was made. No production deployment or PR merge was performed.

## Limitations and next step

Enable official-source network access or supply official publications, verify identity/region/serving/nutrition/allergens and reproduction rights, populate a small reviewed catalog, then rerun tests and rebuild for review. Current menu/recommendation success criteria remain blocked. Browser storage has no authentication, encryption or cross-device sync and may be evicted. Physical Android install/offline and hosted behavior remain unverified. Use fictional information only.
