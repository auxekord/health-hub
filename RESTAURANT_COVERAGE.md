# Restaurant coverage and source-access audit

## Outcome and scope

**No current restaurant menu or nutrition publication could be verified in this environment. Actual implemented verified restaurants: 0; verified menu items: 0.** Do not treat the research directory as a sourced menu catalog or live restaurant discovery.

21 candidate HTTPS sites were requested with normal TLS verification and each returned `Tunnel connection failed: 403 Forbidden` from the environment proxy. This is a network-policy denial, not evidence the restaurant or its public menu is unavailable. No access control or TLS verification was bypassed. Two other names require unambiguous identity/source confirmation. No downloaded content was used to infer items, prices, servings or nutrition.

The five requested priority identities are accessible as **unverified research-directory entries**: Dunkin', McDonald's, Fixins Soul Kitchen (user-supplied Detroit location), Sexy Steak (user-supplied Detroit location) and Campestre Chicken (user-supplied Lincoln Park location). Chains do not imply a particular branch or availability. These entries contain no menu items, official nutrition, prices, addresses or purported verification date. Existing local saved restaurants remain separate.

## Coverage matrix

All source addresses below are **candidate research starting points, not verified official menu sources**. Independent restaurant domain/identity matches are especially unresolved. No restaurant location has been independently verified in this audit.

| Requested restaurant | Candidate starting point | Evidence/result | Implemented menu |
| --- | --- | --- | --- |
| McDonald's | https://www.mcdonalds.com/us/en-us/full-menu.html | Environment proxy denied HTTPS tunnel (403) | None |
| Dunkin' | https://www.dunkindonuts.com/en/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Wendy's | https://www.wendys.com/en-us/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Burger King | https://www.bk.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Taco Bell | https://www.tacobell.com/food | Environment proxy denied HTTPS tunnel (403) | None |
| Chick-fil-A | https://www.chick-fil-a.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Chipotle | https://www.chipotle.com/nutrition-calculator | Environment proxy denied HTTPS tunnel (403) | None |
| Subway | https://www.subway.com/en-us/menunutrition | Environment proxy denied HTTPS tunnel (403) | None |
| Starbucks | https://www.starbucks.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Panera Bread | https://www.panerabread.com/en-us/menu.html | Environment proxy denied HTTPS tunnel (403) | None |
| Popeyes | https://www.popeyes.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| KFC | https://www.kfc.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Raising Cane's | https://www.raisingcanes.com/menu/ | Environment proxy denied HTTPS tunnel (403) | None |
| Five Guys | https://www.fiveguys.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Shake Shack | https://shakeshack.com/menu | Environment proxy denied HTTPS tunnel (403) | None |
| Fixins Soul Kitchen | https://fixinssoulkitchen.com | Environment proxy denied HTTPS tunnel (403) | None |
| Sexy Steak | https://sexysteak.com | Environment proxy denied HTTPS tunnel (403) | None |
| Taqueria Mi Pueblo | https://www.mipueblorestaurant.com | Environment proxy denied HTTPS tunnel (403) | None |
| Mercury Burger & Bar | https://mercuryburgerbar.com | Environment proxy denied HTTPS tunnel (403) | None |
| Campestre Chicken | https://campestrechicken.com | Environment proxy denied HTTPS tunnel (403) | None |
| Pita To Go | Not identified | Identity/source needs clarification | None |
| Taqueria Los Charros | Not identified | Identity/source needs clarification | None |
| Zukin's Rib Shack | https://zukinsribshack.com | Environment proxy denied HTTPS tunnel (403) | None |

## Verified source list

Empty. `app/catalog-data.js` has no source publications and no menu items. Candidate URLs above are not seeded as official website/menu links. The existing user-entered links remain labeled as user-provided.

## Safe completion sequence

1. Enable required official domains in environment network settings or supply actual official menu/nutrition documents. Confirm identity/location, publisher and document date before entry. Do not send personal household records.
2. Check permission to reproduce factual selections, attribution, region/location applicability, supported serving sizes, actual allergens and published nutrient basis. Do not copy restricted menu databases or entire copyrighted publications blindly.
3. Add a small reviewed menu to the versioned data module with restaurant identity source, menu source, separate nutrition/dietary sources where applicable, review date, evidence description and permission/attribution notes. Source updates require review; they are not a runtime fetch.
4. Prioritize Dunkin' and McDonald's breakfast/main/beverage examples only after documents support them, then independent restaurant entries with unknown nutrition where no publication exists. Preserve the user-provided Campestre plate separately from official menu claims.
5. Re-run all tests, privacy checks and preview screenshots. Current brand screenshots deliberately show unavailable/unverified menus rather than fabricated food cards.

## What was implemented despite the blocker

Searchable offline directory, reviewed-catalog schema/provider boundary, source/freshness gates, menu category cards, local explainable comparisons, profile-specific dietary preferences, standard-serving order quantities, custom components, substitutions with unknown nutrition, order comparisons and confirmation through the existing plan/journal editor. Synthetic menu fixtures exercise these paths only in tests; they are not application or preview data.
