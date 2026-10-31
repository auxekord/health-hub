# Production external food-search investigation and bounded repair

Base: current production `main` commit `2554aba`, reported by GitHub as its latest
successful Pages build. Branch: `fix/external-food-search`. No merge, production
deployment, Cloudflare change, profile/storage migration or new service is included.

## Root cause: confirmed evidence versus remaining uncertainty

**The exact cause of the Android tablet's failed request is not yet proven.**
The user reports an unavailable message and a re-enabled Find food button. That
identifies the application's handled-error path; it does not by itself distinguish
HTTP service failure, a request timeout, JSON failure, CORS or certificate/network
errors. It does not match the separate indefinitely-stalled body bug reproduced
below. Do not describe that bug as the proven cause of the user's tablet failure.

Confirmed findings:

1. The production CSP explicitly permits `https://world.openfoodfacts.org` under
   `connect-src`. All inline-script hashes match the checked source. Successful
   mocked API requests run under the real policy without violations. No evidence
   of a PR #3 CSP regression was found; no CSP host or directive is broadened.
2. Verified HTTP requests to the current CGI endpoint intermittently received
   HTTP 503, then HTTP 200 with a complete valid JSON response containing two
   products and `Access-Control-Allow-Origin: *`, then another HTTP 503. These
   are real observed request outcomes using a non-personal food query, not mocked
   API results. The origin of the 503 (provider/load/rate limit versus an
   intermediary) was not established. Official provider docs identify global
   rate limits/load as possible reasons for 503, not proof of this specific case.
3. Native Chromium attempted the same request and failed with
   `net::ERR_CERT_AUTHORITY_INVALID`, with no CSP violation. This environment uses
   a network proxy and a separate trust configuration; this result is an
   environment limitation, **not evidence that the Android certificate failed**.
   Verified HTTP-client requests can reach the API. Live browser CORS/TLS success
   could not be established here.
4. The app previously hid all exceptions/status codes behind one generic message,
   preventing a device-specific diagnosis from the UI.
5. The app cleared its 12-second abort timer immediately after receiving headers,
   before `response.json()`. A body that stalls after headers can leave search
   busy indefinitely. A synthetic slow-body test reproduced this on both desktop
   and mobile against the unmodified production search function.
6. A new search retained an old selected food. If the new request failed, the old
   food could remain available for logging under a different query. The repair
   clears that unsaved selection, not any saved Kitchen/journal data.
7. The app service worker ignores cross-origin requests, so it does not intercept
   or cache Open Food Facts API responses. Old application HTML can remain on a
   device until its shell updates; that device state was not inspected.

Direct fetches of the public Pages HTML were proxy-blocked, so deployed response
bytes/headers and the actual Android failed-request details were not inspected.
GitHub deployment metadata and production source are verified; they are not a
substitute for a browser/network capture on the user's device.

## API choice: do not substitute an incompatible endpoint

Official Open Food Facts API documentation currently says full-text search uses
legacy `/cgi/search.pl`; `/api/v2/search` supports structured filters, not the
same free-text query. A comparison request with `search_terms` to v2 returned a
large unfiltered catalog rather than equivalent results. The repair therefore
keeps the existing documented free-text endpoint, not a misleading v2 fallback.

The official docs state 10 search requests/minute/IP and describe global limits
that can return 503. There is no autocomplete request on every keystroke. Reads
need no API key/account credential, but application identification/usage policy
requirements still apply. Browsers cannot reliably set a custom User-Agent;
missing application registration/identity is a policy follow-up, **not a proven
cause of this failure**. No contact identity, credentials or unsupported headers
were invented to bypass provider restrictions.

Reviewed the API index from the official repository at source revision
`a878cd7b3b42769cff4206eeeb6f46ddf9aa81f6` during this investigation:
[official source](https://github.com/openfoodfacts/openfoodfacts-server/blob/a878cd7b3b42769cff4206eeeb6f46ddf9aa81f6/docs/api/index.md).

## Minimal repair

Only the external search path and its offline-shell version change:

- Keep one active request, the CGI endpoint, field projection, result size and
  existing product-to-Kitchen flow.
- Apply a 20-second timeout to both headers **and body parsing**; clear the timer
  only after completion/failure. The button always returns to an enabled state.
- Distinguish HTTP status, timeout, invalid JSON/payload, offline and ambiguous
  connection/browser-security errors. Browser fetch cannot reliably distinguish
  CORS, TLS and network failures, so the message does not claim a specific one.
- Report 429; honor readable numeric/date `Retry-After` on 429/503. If a 429 header
  is missing or hidden by CORS, use a 60-second in-memory wait. Do not repeatedly
  retry or automatically hammer a rate-limited service. CORS exposure is controlled
  by the provider; the app cannot read unexposed headers.
- Validate the response's products array and skip null/malformed product rows.
  Unknown nutrients remain unknown; no replacement nutrition is invented.
- Clear stale unsaved results/selection at the start of a new valid search.
- Explicitly omit credentials and referrers, retain CORS mode/TLS verification,
  and send only the same user-entered food query and search parameters.
- Refresh the inline-script CSP hash and version the offline shell. The policy
  itself is unchanged, as are the PR #3 data-safety modules and storage namespace.

No proxy/backend, API switch, extra provider, persistent query cache, new credential
or health-data transfer is added. This repair **cannot make an unavailable external
service available** and is not a verified end-to-end cure on the Android device.

## Automated reproduction and validation

Before repair, four targeted tests failed (two scenarios in desktop/mobile):
full-body timeout recovery and HTTP-status reporting. They reproduce real app
behavior under controlled responses, not the tablet's unknown HTTP transaction.

Final full run:

```sh
npm test -- --reporter=line --output=/tmp/hh-food-final-results
```

**58 passed (39.7s)**: all 44 existing production/security checks plus 14 new
food-search checks in desktop and mobile Chromium. Coverage includes body stalls,
HTTP 503/retry, exposed/unexposed rate-limit headers, successful queries under
CSP, request-parameter/referrer checks, malformed response shapes, stale selection,
transport/offline failures, malformed product rows, unknown nutrition and Kitchen
transfer. External responses are mocked in these automated tests. Actual HTTP
observations and environment browser errors are documented separately above.

The 139 recipes, their specific directions, original inline styles, both household
profiles, stored records and PR #3 safety protections remain intact. No real
private records were opened, reset or seeded into tests. No real-device test or
production deployment success is claimed.

## Device confirmation and review steps

- To establish the tablet-specific cause, obtain the failed API request's HTTP
  status or Chrome network/security error, query timing and whether a response
  arrived. Redact private data; do not send a health backup or whole journal.
- With an approved future deployment, review the improved message on the tablet.
  A 503 points to the service path; a 429 calls for waiting; a timeout is distinct
  from a CORS/TLS/connection failure. Error-response CORS restrictions can still
  prevent JavaScript from reading a server's status.
- Do not clear site data/localStorage to test a search fix. Closing old app tabs
  and refreshing static assets after an approved rollout should preserve records.
- The Pages source is `main`; merging can trigger publication. Keep the repair
  unmerged until production deployment is separately approved.
- Restaurant discovery is a different feature. See
  `RESTAURANT_DISCOVERY_PROPOSAL.md`; no restaurant menu/nutrition result was
  fabricated or added to production.

## Browser verification blocker

Automatic approval review rejected adding the platform-provided proxy CA to the
existing shared browser trust database because it would broaden persistent TLS
trust beyond this API check. The action did not run; no certificate/trust changes
or verification bypasses were made. A separately approved isolated trust setup or
a real-device capture would be needed for additional live-browser verification.
This limitation does not invalidate the mocked regression results, but limits the
end-to-end readiness claim.
