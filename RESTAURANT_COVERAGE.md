# Restaurant coverage — published offline catalog

Reviewed November 1, 2026. The environment now has unrestricted public-source access. Earlier blanket network denials are resolved; individual sites may still restrict access. No access control or TLS verification was bypassed.

## Actual implemented coverage

**23 searchable identities: five reviewed restaurants with 291 published items, plus 18 explicitly unverified research entries.** These are offline snapshots, not live place search, universal coverage or guarantees of local stock. McDonald's coverage spans breakfast, burgers, chicken/fish, nuggets/strips, wraps, sides, desserts, coffee, drinks and sauces. Independent restaurant entries are curated factual subsets rather than a promise that every current menu item is included.

| Reviewed restaurant | Scope | Published items | Items with some published nutrition |
| --- | --- | ---: | ---: |
| McDonald's | US national menu; no individual location promised | 117 | 7 |
| Fixins Soul Kitchen | Detroit, Michigan | 38 | 0 |
| Sexy Steak | Detroit, Michigan | 47 | 0 |
| Chick-fil-A | US national menu; no individual location promised | 29 | 10 |
| Zukin's Rib Shack | Lincoln Park, Michigan | 60 | 0 |

17 items contain some published nutrition. Ten Chick-fil-A fixed sandwiches have eight directly published nutrient fields; added sugar remains unknown. Seven McDonald's standard products retain only facts explicitly stated in prose or image alt labels. Two have confirmed calorie/protein pairs. No additional numbers are inferred. Variable-size/choice Chick-fil-A pages are names-only because their displayed default nutrition cannot safely establish the user's size/order.

Fixins, Sexy Steak and Zukin's have published item names/categories with unknown nutrition. Their menus remain browsable and selectable. No reference estimates are automatically invented, and user-provided Campestre components remain separate from official menu claims.

## Source identity corrections and restrictions

- McDonald's national menu and selected public product pages returned HTTP 200.
- Fixins official homepage links a Detroit Main Menu PDF, which confirms Detroit identity and named items.
- Sexy Steak's usable official site is `https://www.sexysteakdetroit.com/menu`. The initially guessed `sexysteak.com` address returned a redirect-only landing page and is excluded from the catalog.
- Chick-fil-A official menu/category/product pages returned HTTP 200. Only clearly fixed sandwich servings receive numeric values; variable/default choice tables are not copied into meal nutrition.
- Zukin's official menu identifies Lincoln Park, Michigan. Prices, hours and marketing descriptions are not reproduced.
- Dunkin's menu and nutrition PDF still return site-level HTTP 403. It remains unverified with no fabricated menu. Raising Cane's, Five Guys and Taco Bell candidate pages also denied the requests; no bypass attempted.
- Wendy's candidate menu paths returned 404; Panera's shell loaded but structured items were not verified; Mercury returned 406; Mi Pueblo returned 403. These are research limitations, not proof menus are unavailable to customers.

## Remaining research directory

Dunkin', Campestre Chicken, Wendy's, Burger King, Taco Bell, Chipotle, Subway, Starbucks, Panera Bread, Popeyes, KFC, Raising Cane's, Five Guys, Shake Shack, Taqueria Mi Pueblo, Mercury Burger & Bar, Pita To Go, Taqueria Los Charros.

Directory names and local city queries come from the user's requested coverage. They are not live results or independently verified locations. Pita To Go and Taqueria Los Charros still require unambiguous identity/location confirmation. Other unresearched chains are not assigned invented source URLs.

## Expansion and maintenance

Keep adding small source-reviewed menus across chains and Detroit/Downriver, then South Florida. Do not require screenshots: public HTML/PDF sources can be reviewed directly where allowed. Record exact URL, publisher, serving basis, source hash and review date. Check factual selections and permissions; do not copy restricted databases, images or full menu prose. A 90-day editorial freshness gate prevents old snapshots being recommended as current; it does not prove availability has not changed. No runtime third-party discovery API or paid service is enabled.

See MENU_SOURCES.md for all 41 reviewed publications and RECOMMENDATION_ENGINE.md for suggestion eligibility and missing-data handling.
