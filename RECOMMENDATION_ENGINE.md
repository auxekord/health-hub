# Explainable local meal comparisons

## Current release boundary

The real verified catalog is empty because source access is blocked. No actual Dunkin', McDonald's or independent restaurant recommendation is shipped. Synthetic regression fixtures validate the engine but are not uploaded in the demo. The interface explains insufficient information and retains manual meal building.

## Inputs and provenance

The engine uses the selected browser-local household profile, optional allergen/restriction settings and a user-selected meal share (default 30%, adjustable 10–100%). A daily goal is not a prescribed meal target. Existing goals are not overwritten. Optional sodium, saturated-fat and added-sugar limits are user-entered; no clinical limits are invented. Missing old fields remain valid.

Reviewed catalog sources require publisher, HTTPS URL, review date, evidence description, attribution/permission notes and official/authorized/reference identity. Restaurant identity and menu entries require official/authorized sources. Nutrition and dietary declarations have separate source IDs. Current data means a review within 90 days, with no future review date beyond timezone tolerance. This is a conservative editorial freshness rule, not proof a menu has not changed.

## Eligibility and sorting

Only current standard items with known values required for a priority are candidates. At most one main plus one sourced side/drink is considered, capped at 120 combinations. No cross-restaurant order or unsupported substitution is invented. Published/authorized nutrition is required for suggestions; reference estimates remain available to the editor but do not qualify here.

- Balanced: requires all nine supported nutrient fields; orders within the selected calorie budget are sorted by distance from its energy target plus relative protein shortfall. This ordering is explained, not displayed as a health score.
- Higher protein: known calories/protein, sorted by protein within the chosen calorie budget when goals exist.
- Lighter: known calories/protein, sorted by calories, explicitly without equating low calories to health.
- Lower sodium: known calories/protein/sodium; never infer sodium from energy.
- Lower added sugar: known calories/protein/added sugar; total sugar never substitutes for added sugar.

With positive calorie/protein goals, explanations show the selected meal budget and protein share. Without goals, results are explicitly general comparisons rather than personalized. Up to three candidate orders are shown; selecting one opens an editable basket, never a log action.

## Allergens and restrictions

Explicit allergens reject matching contains/may-contain disclosures; incomplete or outdated dietary data disqualifies an item when an allergy is recorded. Vegetarian, vegan and no-pork require explicit current sourced declarations. Other restrictions suppress suggestions for manual review. Allergen completeness is never represented as protection from cross-contact; users must confirm with the restaurant. The app does not diagnose allergies or certify safety.

## Calculations and customization

Standard serving quantity scales published numbers. A substitution/preparation change makes all inherited nutrient values unknown. The existing journal editor also invalidates inherited values when a sourced component name, preparation or measurement unit changes. Manual re-sourcing remains possible. Unknown is not zero; totals show known subtotals and missing values. Supported nutrients: calories, protein, carbohydrates, total fat, fiber, sodium, saturated fat, sugar and added sugar.

Tradeoffs disclose known/unknown sodium, saturated fat, added sugar and fiber, protein shortfalls, and any comparison to a user-entered limit. No weight-loss prediction or arbitrary health score is produced. The engine does not infer how much remains to eat from an incomplete journal.

## Next steps

Verify actual publications and licensing, populate a small reviewed catalog, and have the user assess suggestions against real preferences. Broader meal combinations, medical diets, automatic menu updates and external providers are not activated.
