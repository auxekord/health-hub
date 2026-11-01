# Menu and nutrition provider comparison

This is an integration assessment, not a live provider/price verification. Public menu access is now available and the source register records reviewed restaurant publications. Current vendor API pricing/terms were not independently verified. No exact current price, coverage count, licensing grant or refresh SLA is claimed. All third-party API use remains inactive.

| Source | Suitable role | Credentials/cost considerations | Reliability, coverage and restrictions |
| --- | --- | --- | --- |
| Official restaurant menu pages/PDFs | Identity, menu names, sizes; published nutrition/allergens only where supplied | Public viewing often needs no key. Reproduction permission must be checked separately; no paid service enabled | Location, region, time and customization differences matter. No assumed update cadence; document publisher, date and serving basis. Restricted sites must not be scraped |
| Official chain nutrition calculators/publications | Standard-item nutrition and supported variants | Public documents may be usable without credentials; an internal website endpoint is not automatically a licensed API | Calculators may depend on size/location/recipe. Do not reuse standard numbers for unsupported substitutions |
| Authorized menu/nutrition vendors (e.g. Nutritionix, Edamam or Spoonacular) | Potential structured catalog/provider adapter | Credentials and terms typically apply; free evaluation/production cost, quotas and menu rights require a current vendor review and approval | Coverage of independent Detroit/Downriver restaurants cannot be assumed. Match item, location and serving; attribution/caching and redistribution terms require review |
| USDA FoodData Central | Reference-food estimates only, never official restaurant nutrition | API normally requires a data.gov key; downloadable datasets may permit an offline approach. Confirm current terms/rate limits before use; not enabled | Reference ingredients rarely establish a restaurant's recipe, sauce, oil, portion or allergens. Explicit editable assumptions remain necessary |
| Open Food Facts | Existing packaged-food search | Existing public search, no new credential or proxy introduced | Community/package data is not a verified restaurant menu. Availability/rate limits can affect search; no restaurant coverage claims |
| Future place-search provider (Google Places or alternatives) | Identity/location/official website candidates | Usually credentials, quotas and/or licensing restrictions; no paid API approved | Place results do not establish menu content or nutrition. Do not send profile goals/journals; menu rights and freshness are separate |
| Manual user entry | Any restaurant when authoritative data is missing | Offline, no credentials or service charge | Label user-entered identity and unknown nutrition. User-declared published values are not independently verified by the app |

The shipped adapter is browser-local and versioned. Searches, profiles, dietary restrictions and meal calculations do not trigger external requests. Explicit map/menu links open a separate site with noopener/noreferrer. Static catalog updates are reviewed code/data changes. Future broader discovery needs separately approved provider terms, costs, privacy review and credential handling.

## Live documentation check — November 1, 2026

Public documentation is now accessible for several providers:

- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide.html): confirms API-key access, a default 1,000 requests/hour/IP limit and CC0 public-domain data, with attribution requested. This is suitable for explicitly labeled reference-food estimates, not proof of restaurant recipes or portions. No API/key was activated.
- [Nutritionix developer site](https://developer.nutritionix.com/): explicitly says there is no longer a public free-access tier and directs prospective users to sales for a tailored limited trial. Do not plan this application around an assumed free Nutritionix restaurant API. No account request or contact was sent.
- [Edamam Nutrition Analysis API](https://developer.edamam.com/edamam-nutrition-api): displays an Enterprise Basic Multilingual plan at $29/month with a 10-day trial, and a Core plan at $299/month without a trial. These are displayed nutrition-analysis plans, not a quote or guaranteed restaurant-menu license/coverage for Health Hub. Nothing was subscribed to or enabled.
- Spoonacular's candidate pricing page returned HTTP 403; current pricing/rights remain unverified and were not bypassed.

Prices and terms can change. These checks do not imply authorization to use a paid service or transmit household data. The shipped menu snapshots and local recommendation engine require no provider account, API credential or runtime third-party lookup.
