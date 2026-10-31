# Phase 2 restaurant discovery proposal — implementation not approved

This is separate from the production food-search repair. It adds no restaurant
integration, menu data, credentials, backend, third-party script or CSP host.
Do not merge or deploy either branch without approval. Before restaurant work,
reconcile Phase 2 with the approved production security/data-safety boundary;
do not reintroduce its old defaults or legacy unsafe import/rendering paths.

## What exists and what is missing

Open Food Facts is a community packaged-food catalog, not a restaurant directory
or a reliable local-restaurant menu/nutrition feed. Fixing its search cannot
supply restaurant discovery or Campestre's menu. Phase 2 already has manual
restaurant plates/components and favorites; production does not have the full
Phase 2 journal/planner. Keep those concerns separate.

No authoritative Campestre menu, prices or nutrition publication was verified in
this investigation. The requested business name/location and four components
below are **user-specified workflow inputs, not returned API/menu results**.
Do not label them as an official restaurant listing or publish invented values.

## Recommended implementation sequence

### A. Manual-first, no additional service required

- Keep restaurant name and city searchable in local saved restaurants. New names
  and locations can always be entered without a provider match.
- Offer an explicitly user-initiated external map/web search using only restaurant
  name and city. This is a search link, not a verified listing or menu result.
  Explain that the destination receives the query and normal browser metadata.
- Let the user save an actual official website/menu URL after checking the business
  and location. Validate HTTPS URLs and open external pages with `noopener` and
  `noreferrer`; never embed third-party pages/scripts inside the health origin.
- If no reliable menu source is available, say so and open the component editor.
  Do not synthesize search results, hours, prices or menu items.
- Preserve all existing recipes, cooking cards and the dark/lime interface. Add
  restaurant discovery within Journal/meal selection rather than a fifth primary
  destination or a redesign.

This option needs no API credentials or paid service. It is less automatic than
in-app place search, but remains usable for independent restaurants immediately.
It must not be advertised as an integrated restaurant/menu search engine.

### B. Approved place-search provider

Implement an adapter only after selecting the provider, confirming coverage and
terms, and approving any cost, identity/privacy changes or backend requirements.
The query should contain only a restaurant name and user-entered city. Do not
send profile identifiers, health records, notes, medication information, journals
or consumption history. Do not enable GPS/location permissions automatically.

Search results should identify the provider and show its returned business name,
address, website and stable place ID where available. Require location selection
when multiple businesses match. “No result” is a legitimate outcome; manual entry
must remain available. Place search does not establish menu or nutrition coverage.

Use explicit search/submit, cancellation, bounded timeouts, appropriate caching,
rate limits and offline/empty/error states. Do not call a public service on every
keystroke where its policy prohibits autocomplete. No fake fallback results.

### C. Menu selection with source provenance

- Prefer a location-matched official restaurant menu. Accept a licensed structured
  feed only if the actual restaurant/location is covered and terms permit use.
- Store the source URL/provider, business/location ID, retrieved/checked timestamp,
  any published serving basis and current availability status. Do not fake a
  verification timestamp when data has not actually been checked.
- If a source supplies only a menu link/PDF/image, offer opening it and manually
  entering components. Do not imply it is structured searchable menu data.
- Do not scrape login-protected sites, evade CORS, copy unlicensed menus or
  introduce OCR/photo uploads without a separately approved data-handling plan.
- Show item price only if it is actually returned/published for the selected
  location, with currency and checked time. A provider's price tier is not an
  item price. Otherwise show **Price unavailable**.
- Saving a plate takes a snapshot. Later menu/provider updates must not silently
  rewrite past journal entries or their assumptions.

### D. Editable actual meals, references and confidence

Each component needs a stable local ID, user-confirmed quantity/unit (nullable),
raw/cooked/edible basis when relevant, per-basis nutrients (nullable), provenance,
estimate flag and optional assumptions. Preserve independent portions for each
household member. Do not treat one menu serving as automatically consumed.

Use these labels:

1. **Restaurant-published nutrition** — actual matching official/authorized
   nutrition, with serving basis and source. Verification concerns provenance;
   actual consumed portions can still be estimates.
2. **Reference-food estimate** — identified reference food and preparation method,
   explicit editable amount/conversion assumptions, and source identifier/date.
   Never call this official restaurant nutrition.
3. **Unknown** — no usable value or portion basis. Unknown is not zero. Show known
   subtotals as partial and identify which components lack information.

Selecting a restaurant or menu item never logs food automatically. Let users add,
remove and adjust components, record leftovers, confirm the household profile,
and save one plate. A stable draft/save ID prevents double-tap duplication.
Favorites repeat a snapshot on a new date and prompt review of portions/sources.
Planned and consumed records stay separate. Restaurant meals do not add groceries
unless the user explicitly converts one into a home-prepared meal.

## Campestre Chicken example — no menu/nutrition claim

Name: Campestre Chicken. Location query: Lincoln Park, Michigan.

| User-specified component | Initial quantity/nutrition | Review needed |
| --- | --- | --- |
| Quarter chicken | Unknown until confirmed | Which cut, skin, bones versus edible portion, preparation, and amount actually eaten. “Quarter” does not establish edible grams. |
| Mixed vegetables | Unknown | Vegetable mixture, preparation, added oil/sauce and amount eaten. |
| Black beans | Unknown | Preparation, additions and actual portion. |
| Green sauce | Unknown | Ingredients and actual portion; color alone cannot establish nutrition. |

Flow: search/enter the restaurant → confirm the location or save it as a manual,
unverified business → select genuine menu data if available, otherwise add the
four user-specified components → adjust each independently → add/remove foods →
review partial nutrition and assumptions → save one journal plate → edit later →
save a favorite → repeat with a new date/profile and reviewed quantities.

If restaurant nutrition is unavailable, an approved reference-food search could
suggest a matching cooked chicken or beans entry. The user must confirm the
reference and portion. Mixed vegetables require an appropriate preparation match;
green sauce stays unknown unless a defensible recipe/reference is supplied.
This proposal intentionally gives no menu prices, weights or nutrient numbers.

## Data sources, costs, credentials and limitations

| Source | Useful data / limits | Cost model | Credentials / approval |
| --- | --- | --- | --- |
| Official restaurant website, menu or nutrition sheet | Best primary source when it matches the business/location. Menus may lack nutrition, be stale or inaccessible as structured data. No Campestre publication verified here. | Public viewing generally has no API fee; manual checking has an effort cost. No permission to bulk copy is implied. | Public viewing usually needs no credentials. Respect publication/access terms; no login scraping. |
| Local saved restaurants and user entry | Works offline and for any restaurant. User-supplied names/components are not verified menu facts. | No additional service fee. | None; records remain browser-local. |
| OpenStreetMap / Nominatim | Community business/place/address data where mapped, sometimes website tags. Not a menu or nutrient database; completeness is not guaranteed. | Public donated-capacity service has no per-query payment, strict limits and no commercial availability promise. Hosted alternatives/self-hosting have their own costs. | Public service has no API key, but requires an identifying Referer or User-Agent, attribution, caching and policy compliance. It is **not an approved default** for this app; see restrictions below. |
| Google Places API (New) | Restaurant/place discovery, addresses and website references. Place details do not promise local menu items, item prices or nutrition. | Metered commercial service; SKU-specific free allowances may apply. Billing, current prices, quotas and budget limits must be reviewed before use. No exact current price is quoted here. | Google Cloud project and API credentials. Never commit unrestricted/server keys. Any proxy/backend or third-party SDK needs explicit approval and privacy review. |
| USDA FoodData Central | Generic/reference foods and branded food nutrition, not Campestre's official portions/menu. Preparation and edible-portion matching remain necessary. | Public data/API offered without a per-query data charge, subject to service limits and current terms. | API access generally uses an api.data.gov key. Verify current limits and safe key handling before integrating; no key is requested or added now. |
| Licensed restaurant-nutrition provider, such as Nutritionix | May provide structured chain/menu nutrition for covered brands. Independent/local restaurant coverage and redistribution rights must be demonstrated, not assumed. | Commercial/account-dependent. Current quotes/terms and actual Campestre coverage are unverified. | Provider credentials/contract typically required. Not selected or integrated; no subscription or trial authorized. |
| Open Food Facts | Useful for packaged ingredients/products. User-contributed labels are not independently verified restaurant nutrition; not restaurant/menu discovery. | Public read API, no read-account/API-key requirement; rate limits, attribution/licensing and application identification requirements apply. | No secret added for the existing read integration. Browser identification and provider usage registration need review; do not invent a contact address or spoof credentials. |

**Public Nominatim restrictions are material, not optional.** Its published policy
requires a deliberate informed application-owner decision, at most one request
per second across the whole application, proper identity and attribution,
appropriate caching, no client-side autocomplete, service-switch capability, and
no personal/confidential submissions. The current app deliberately sends no
Referrer, and browsers cannot reliably set a custom User-Agent. Aggregate limits
also cannot be guaranteed independently by every user's client. Therefore it is
not a drop-in frontend endpoint under the existing security/privacy setup. Do
not silently loosen that setup. An approved compliant provider/proxy or a manual
external search link is the safer initial route. No generic geocoding service is
being built or offered by this proposal.

External map/search providers and restaurant websites receive queries and normal
request metadata when opened. Third-party SDKs running inside a health origin
would have broader code privileges; avoid them by default. No provider should
receive journal/profile data. Caching and attribution must follow the selected
provider's field-specific terms rather than storing entire API responses forever.

## Evidence and source verification

Reviewed current official Open Food Facts documentation and server source through
its public GitHub repository, including its API index and search guidance.
Reviewed the official Nominatim usage-policy source and Google's official Node
client README (which directs new Places integrations to API New). Other provider
links below are authoritative starting points, but their current pricing/limits,
account availability and specific restaurant coverage were not live-verified in
this environment; direct documentation-site requests were proxy-blocked. Do not
interpret the table as a verified vendor quote, menu result or coverage guarantee.

- [Open Food Facts API guide](https://openfoodfacts.github.io/openfoodfacts-server/api/)
  and [source](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md).
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
  and [policy source](https://github.com/openstreetmap/owg-website/blob/main/policies/nominatim.md).
- [Google Places API New](https://developers.google.com/maps/documentation/places/web-service/overview),
  [pricing](https://developers.google.com/maps/billing-and-pricing/pricing),
  [key security](https://developers.google.com/maps/api-security-best-practices), and
  [official client guidance](https://github.com/googlemaps/google-maps-services-js).
- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide).
- [Nutritionix developer information](https://developer.nutritionix.com/).

## Acceptance tests before any Phase 2 integration approval

Mock provider responses and verify live sources separately: exact name/location
selection; no matches/manual fallback; multiple matches; offline/timeout/rate
limits; genuine menu versus link-only versus unavailable menu; unknown prices;
source/serving-basis labels; independent edits/removals/additions for all four
Campestre components; partial and estimated totals; two household portions;
single plate save/edit/repeat/favorite; duplicate protection; plan/actual and
grocery separation; backup validation/migration; no health data sent to providers;
URLs/SDK safety and CSP; Android tablet layout. Mock results must be labeled as
test fixtures, never published as facts about a real restaurant.

Approval is needed for provider selection, credentials, any paid allowance or
billing account, backend/proxy, new network/CSP permissions, third-party SDKs,
and subsequent implementation/merge/deployment. No such approval is implied by
the production food-search repair.
