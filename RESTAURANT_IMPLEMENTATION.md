# Hybrid restaurant implementation

## Workflow

Plan and Journal expose Find restaurants without adding a primary tab. Search is explicitly local: saved name and city matches, loading, empty, offline and error states. Users may enter a restaurant once, reuse it, save an official website/menu link, inspect matching saved plates, repeat a plate or edit its original journal entry. Missing menu information is stated explicitly. A separate external Maps search link opens a web search; it is not an integrated place-search service.

URLs must be HTTPS without embedded credentials, nonstandard ports, local hostnames or the application origin. Links open in a separate tab with noopener/noreferrer. Saving a URL does not establish that its contents are genuine or current. Source and last-checked metadata reflect the user's declaration; checking is never fabricated.

## Adapter boundary

`HHRestaurantAdapter.search({name, city, signal})` returns local normalized restaurants. Metadata supports stable local ID, provider identity, provider place ID, name, location/address, official website/menu URL, source and last checked. Legacy name/location-only records are normalized without a forced storage rewrite. Future automatic providers must implement this boundary and explicit loading/error/offline semantics.

No Google Places, Nominatim, commercial menu API, account, key, paid service, proxy or backend is activated. Future provider approval must assess credentials, terms, cost, rate limits, privacy and authoritative menu coverage. External search results are not fabricated or fetched into the app.

## Components and nutrition

Components retain stable IDs, food name, quantity/unit, optional preparation, independent per-profile planned quantities, actual consumed fraction, nutrition basis and nullable calories/protein/carbohydrate/fat. Nutrition categories are Restaurant-published nutrition, Reference-food estimate and Unknown; legacy underlying codes remain compatible. Published data must be entered from a genuinely matching source with serving basis. The application does not independently verify that claim.

For each known nutrient: `quantity × consumed fraction ÷ nutrition basis × supplied nutrient`. Basis defaults to one for legacy entries, must be positive and is independently editable. A basis of 100 supports label values per 100 units without manual division. Unknown quantities/nutrients remain unknown, not zero. Zero explicitly consumed contributes zero; partial totals identify missing data. Invalid bases cannot produce Infinity or be saved through the editor.

The Campestre Chicken, Lincoln Park, Michigan example uses the four user-supplied component names: quarter chicken, mixed vegetables, black beans and green sauce. These are not represented as a verified menu. Each may be edited, removed or supplemented independently. Fictional preview nutrient examples are visibly estimates with fictional provenance, never official restaurant nutrition or assumed serving sizes.

## Integrity and reuse

Plans and actual journal entries occupy separate collections. Log as eaten opens an editable confirmation and creates profile-specific snapshots. Repeated taps on the same linked plan/profile do not create duplicate logs. Repeating a favorite or past meal creates a new dated draft with new identity and retained provenance. Existing entries survive repeat and other-profile edits. Restaurant records and favorites persist through refresh and backup merge.

Restaurant meals are excluded from groceries. Deliberate conversion to a home-cooked meal permits ingredient shopping. Local restaurant/journal editing works offline after the application shell has been cached; external websites and live food search require connectivity.

## Limitations

No automatic menus, prices, official nutrition, place verification, geolocation or provider availability claims. No authentication or device sync. User-entered URLs may still lead to untrustworthy sites; HTTPS is transport validation, not content certification. No private journal information is sent to a search provider. Android tablet screenshots use Chromium emulation, not a physical tablet.

## Menu/catalog extension

The local saved-restaurant provider remains intact. `HHCatalog.catalog.search(name, city)` supplies a separately labeled offline directory/reviewed catalog from versioned source data, not an activated external provider. Name matching handles straight/curly apostrophes; national-chain matches do not assert a location. Local entries require matching location text. Catalog identities, item IDs, menu/nutrition/dietary sources and review dates are validated. Sources older than the 90-day editorial review window are not eligible for current menu ordering/recommendations.

Menu cards support categories and named standard serving/size descriptions. The transient basket supports multiple items, independent quantities, removal, custom unknown components, recorded substitutions and a saved order comparison. Unsupported modifications never inherit standard nutrition. Review opens the existing plan/journal editor; it does not automatically save consumption. A chosen profile is retained for logging and initially receives the planned portion, with the other member editable in confirmation. Favorites preserve provenance; repeats remain reviewable snapshots.

Optional per-profile allergy/restriction settings and limits remain browser-local. Current recommendation eligibility, ordering and uncertainty are documented in RECOMMENDATION_ENGINE.md. The shipped data contains no verified menu items because official-source access failed. Synthetic test menu fixtures are not shipped. Brand preview screens display unavailable menus rather than invented listings. See MENU_SOURCES.md for the empty verified source register and RESTAURANT_COVERAGE.md for unblock steps.

## Published-source follow-up — November 1, 2026

The earlier source-access blocker is resolved for public sites. The current catalog replaces the empty-menu foundation with five reviewed restaurants, 291 published item names and 41 linked publications. Seventeen items have some directly published nutrition; all other values remain unknown. Source evidence includes retrieval hashes. Dunkin' still denies access and remains a clearly unverified directory entry. See the current RESTAURANT_COVERAGE.md and MENU_SOURCES.md; earlier zero-coverage paragraphs describe the previous foundation build, not this release.

The UI initially offers Higher protein comparisons using sufficiently known standard-item facts. Independent menus can be browsed with unknown nutrition. No broad discovery API, new backend, health-data transfer, paid service or production deployment was introduced. Original storage/security protections, 139 recipes, profile separation, backups and import-disabled separate-origin demo remain.

## Source-aware meal replacement

Plan replacement now asks home versus restaurant first, uses the existing recipe/catalog workflows, and preserves the original entry until explicit confirmation. Restaurant suggestions consider the original slot and selected profile; unknown nutrition is retained. See [replacement workflow](REPLACEMENT_WORKFLOW.md) for behavior, tests and limitations. No deployment or merge was performed.
