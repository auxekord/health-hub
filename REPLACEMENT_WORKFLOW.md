# Plan meal replacement

## Flow

Replace first asks “How will this meal be prepared?” Both paths stay in modal dialogs above Plan, retaining the existing four navigation destinations and dark/lime design.

1. Choose Cooked or prepared at home, or Prepared at a restaurant.
2. Home: search/filter the existing 139 recipes, inspect original ingredient amounts and cooking instructions, reuse Kitchen home-meal favorites, or create a custom home-prepared meal. Restaurant controls and menu selection are absent from this path.
3. Restaurant: search the existing catalog by name/city. The five reviewed profiles are sorted ahead of unverified directory entries within catalog results. Selecting a profile automatically opens Suggested Meal. It uses the chosen browser-local household profile, saved goals/preferences, meal-budget priority and original meal slot. Users may customize a suggestion, browse menu categories or build an order with unknown nutrition. Fixins/Sexy Steak do not receive invented personalized recommendations when published nutrition is insufficient.
4. Customize quantities/components in the existing editor. Alternate recipe/favorite choices are filtered by preparation source. The original date, time, category and independent household multipliers initialize the replacement and survive recipe/favorite selection. Users may deliberately edit these fields.
5. Confirm replacement explicitly. An optional checkbox saves the confirmed replacement as a favorite in the same guarded write.

Higher-protein comparisons remain the initial priority. Breakfast suggestions use breakfast/coffee/beverage categories; lunch/dinner exclude breakfast categories; snack suggestions use non-main items. This is a category relevance filter, not a statement of restaurant opening hours or real-time menu availability. Manual menu browsing remains available when suggestions cannot be supported. Existing allergen/restriction/source-freshness checks still apply.

## Data integrity

The original entry ID is retained. No new planned instance is appended when replacing an existing meal. Original plan data and restaurant details remain unmodified while choosing/customizing; cancel or Escape leaves the original intact. Restaurant details are staged until confirmation. A snapshot check rejects confirmation if the original entry changed or disappeared meanwhile; shared stale-tab/storage guards also remain active.

The selected household is the recommendation context; the shared plan's two existing portion multipliers remain independently editable and are not silently reset. An explicit profile change is retained as the active context after confirmation. This remains a shared-device profile selector, not authentication.

Plan replacements do not modify consumed entries. Logging as eaten still opens the separate actual-portion confirmation. Restaurant plans never add groceries; home-cooked replacements use the existing household ingredient aggregation. Conversion to home cooking remains available through the ordinary explicit meal editor outside the source-filtered replacement dialog.

No storage namespace/schema reset, cloud backend, paid API or health-data transfer is added. Existing backups, recovery, CSP, identifier validation, 139 recipes and 291 published catalog items remain. Optional missing legacy nutrients remain unknown rather than blocking unchanged records.

## Files

`app/replacement.js` owns the safe-DOM preparation/recipe picker and orchestration. `app/phase2.js` adds filtered confirmation, retained identity/context, atomic favorites and stale-original checks. `app/restaurants.js` stages replacement details and opens suggestions automatically. `app/catalog.js`/`app/catalog-ui.js` carry optional meal-slot relevance without changing normal browsing. `index.html`, `sw.js` and the preview allowlist load/cache the new module. Scoped CSS honors hidden controls and existing field styles.

## Validation and limits

The full application and isolated preview suites cover both sources, search, original instructions, filtered controls, standard/unknown restaurant nutrition, meal slots, household context, custom portions, favorites, cancel/confirm, stale-original protection, persistence, no duplicated plan, no automatic journal entry, groceries and tablet width. Existing security/backup/storage/catalog tests are retained. Browser emulation and screenshots do not establish physical Android verification. The catalog's existing source-coverage limitations remain; no menu/nutrition is invented for this change.

No PR merge, production deployment, Cloudflare upload or hosted-preview replacement is performed.
