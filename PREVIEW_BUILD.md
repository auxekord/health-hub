# Sanitized published-menu Phase 2 preview

## Scope

The current offline catalog contains **five reviewed restaurants, 291 factual menu listings and 41 source publications**: McDonald's, Fixins Detroit, Sexy Steak, Chick-fil-A and Zukin's Rib Shack. Seventeen items have some published nutrition. Unknown values stay unknown. Eighteen other requested identities remain unverified directory entries, including Dunkin' where requests are still denied. See RESTAURANT_COVERAGE.md and MENU_SOURCES.md; this is broad initial coverage, not a complete restaurant database or live availability service.

All household profiles, goals, journals, plans, progress and Campestre demonstration estimates are fictional. Public restaurant names/menu facts are real, attributed information, not invented demo menu data. Synthetic test menu fixtures are excluded.

## Build and storage isolation

Run `npm run build:preview`. Static output: `/workspace/health-hub/dist/health-hub-demo`. Archive: `/workspace/health-hub/artifacts/health-hub-phase2-demo.zip`.

The visible demo notice warns against entering real health information. Storage uses `healthhub-demo-phase2-hybrid-v2` on a required separate origin. No production namespace or hostname is present. Both modern and legacy backup import paths reject without reading; generated modern file-reading code is absent and inputs remain disabled after render. Production backup functionality is unchanged. Food-product discovery uses fictional local fixtures. Catalog searches and recommendations run locally with no provider API/credential/backend or health-data transmission.

CSP connects only to self. Explicit public source/map/menu links open separately with noopener/noreferrer. No images, price tables, history, backups, reports, screenshots, tests, dependency directories or development-only files are bundled. The service-worker version was advanced for the new static catalog.

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
| `app/phase2.css` | 6285 |
| `app/restaurants.js` | 15208 |
| `app/catalog-data.js` | 280606 |
| `app/catalog.js` | 10313 |
| `app/catalog-ui.js` | 13745 |
| `app/demo.js` | 5896 |
| `app/bootstrap.js` | 1465 |
| `app/demo.css` | 362 |
| `_headers` | 595 |
| `robots.txt` | 26 |

**19 files**, **547254 uncompressed bytes**, **86169 ZIP bytes**.

SHA-256: `3ac1543fe50d907c84eb11022de77bd9471a21f9994e2046d9f9db6f560da74a`.

`artifacts/preview-verification.json` records all file hashes, 12 checks and actual catalog coverage. The original `dc46faf` archive remains separately preserved as `artifacts/health-hub-phase2-demo-dc46faf.zip`; the new ZIP has not replaced any hosted preview.

## Validation and privacy review

144 application tests and 27 preview tests passed. All 12 privacy/integrity build checks passed. Original 139 recipes and instructions remain intact. Manual code-path review supplements scanning for disabled imports, namespace isolation and absence of real household data. Fifteen fictional-household screenshots include real menu cards, unknown-value customization and published-data suggestions. Automated checks are evidence, not a guarantee against every possible sensitive string.

## Future hosting — separate approval required

Proposed free Cloudflare Pages Direct Upload URL: `https://<available-project-name>.pages.dev/`. No project/name is reserved. Static sources and public menu facts would be publicly downloadable; fictional browser records remain on the preview origin. Cloudflare receives normal request metadata. Noindex/robots are not access control. Deliberate external navigation discloses that navigation to its destination, never app journal/profile contents.

After explicit approval: use a free Cloudflare account → Workers & Pages → Pages Direct Upload (labels may vary), choose an available project name and upload only this ZIP/extracted allowlisted assets. Review the asset list first. Tablet landscape/Desktop site can help; use a computer if its file picker cannot upload the ZIP. Do not connect the repository, replace the current preview, alter GitHub Pages or upload the whole checkout. Confirm current free-tier limits before deployment.

No project, upload, hosted-preview replacement, production deployment or PR merge was performed. Browser storage still lacks synchronization/authentication and can be evicted; use fictional data only. Physical Android and hosted install/offline behavior remain unverified. Continue source/rights review as coverage expands; site restrictions are respected.
