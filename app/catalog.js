/* Offline curated catalog, explicit provenance, and local explainable comparisons. */
(() => {
  'use strict';
  const M = window.HHModel;
  const ALLERGENS = ['milk', 'egg', 'fish', 'shellfish', 'tree-nut', 'peanut', 'wheat', 'soy', 'sesame'];
  const RESTRICTIONS = ['vegetarian', 'vegan', 'no-pork'];
  const PRIORITIES = { balanced: 'Balanced meal', protein: 'Higher protein', lighter: 'Lighter option', sodium: 'Lower sodium', addedSugar: 'Lower added sugar' };
  const fold = s => s.normalize('NFKD').replace(/[\u0300-\u036f'’]/g, '').toLowerCase().trim();
  const text = x => typeof x === 'string' && x.length <= 2000;
  const id = x => typeof x === 'string' && /^[a-zA-Z0-9:_-]{1,150}$/.test(x);
  const nullable = x => x == null || M.num(x);
  function preferences(p) {
    return p === undefined || (p && typeof p === 'object' && !Array.isArray(p) &&
      ['allergens', 'restrictions'].every(k => Array.isArray(p[k]) && p[k].length <= 20 && p[k].every(x => (k === 'allergens' ? ALLERGENS : RESTRICTIONS).includes(x))) &&
      text(p.other || '') && ['sodium', 'addedSugar', 'saturatedFat'].every(k => nullable(p[k])));
  }
  function create(data) {
    if (data?.version !== 1 || !Array.isArray(data.sources) || !Array.isArray(data.restaurants)) throw Error('Catalog format unavailable');
    const copy = M.clone(data), sources = new Map();
    for (const s of copy.sources) {
      if (!id(s.id) || sources.has(s.id) || !text(s.publisher) || !s.publisher || !M.safeURL(s.url) || !M.date(s.verifiedAt) || !text(s.evidence) || !s.evidence || !text(s.permission) || !s.permission || !['official', 'authorized', 'reference'].includes(s.type)) throw Error('Unreviewed source');
      sources.set(s.id, s);
    }
    const unique = new Set();
    for (const r of copy.restaurants) {
      if (!id(r.id) || unique.has(r.id) || !text(r.name) || !r.name || !text(r.location) || !text(r.category) || !['national', 'local'].includes(r.scope) || !['verified', 'unverified'].includes(r.status) || !Array.isArray(r.items) || r.items.length > 200 || (r.status === 'unverified' && r.items.length)) throw Error('Unreviewed restaurant');
      unique.add(r.id);
      if (r.status === 'verified' && (!sources.has(r.sourceId) || sources.get(r.sourceId).type === 'reference')) throw Error('Missing restaurant identity source');
      const ids = new Set();
      for (const i of r.items) {
        if (!id(i.id) || ids.has(i.id) || !text(i.name) || !i.name || !text(i.category) || !text(i.serving) || !i.serving || !['main', 'side', 'drink', 'dessert'].includes(i.role) || !sources.has(i.menuSourceId) || sources.get(i.menuSourceId).type === 'reference') throw Error('Unreviewed menu item');
        ids.add(i.id);
        if (!i.nutrients || !M.NUTRIENTS.every(k => nullable(i.nutrients[k]))) throw Error('Invalid nutrition');
        if (M.NUTRIENTS.some(k => i.nutrients[k] != null) && (!sources.has(i.nutritionSourceId) || !['official', 'authorized', 'reference'].includes(sources.get(i.nutritionSourceId).type))) throw Error('Nutrition source missing');
        if (!i.allergens || typeof i.allergens.complete !== 'boolean' || !Array.isArray(i.allergens.contains) || !i.allergens.contains.every(x => ALLERGENS.includes(x)) || !Array.isArray(i.allergens.mayContain) || !i.allergens.mayContain.every(x => ALLERGENS.includes(x)) || !i.dietary || Object.keys(i.dietary).some(k => !RESTRICTIONS.includes(k) || typeof i.dietary[k] !== 'boolean')) throw Error('Invalid dietary metadata');
        if ((i.allergens.complete || i.allergens.contains.length || i.allergens.mayContain.length || Object.keys(i.dietary).length) && (!sources.has(i.dietarySourceId) || sources.get(i.dietarySourceId).type === 'reference')) throw Error('Dietary source missing');
      }
    }
    const current = (sourceId, now = new Date()) => {
      const source = sources.get(sourceId);
      if (!source) return false;
      const age = (+now - Date.parse(source.verifiedAt + 'T00:00:00Z')) / 86400000;
      return age >= -1 && age <= 90;
    };
    function itemCurrent(r, i, now) { return r.status === 'verified' && current(r.sourceId, now) && current(i.menuSourceId, now); }
    function component(r, i, quantity = 1, modification = '', now) {
      const c = M.blankComponent(i.name), nutrition = sources.get(i.nutritionSourceId), fresh = itemCurrent(r, i, now) && current(i.nutritionSourceId, now);
      Object.assign(c, { quantity, unit: 'serving', nutritionBasis: 1, status: fresh && !modification ? (nutrition?.type === 'reference' ? 'estimate' : 'verified') : 'unknown', source: 'Menu: ' + sources.get(i.menuSourceId).url + '; serving: ' + i.serving + (nutrition ? '; Nutrition: ' + nutrition.url : '; nutrition unavailable') });
      for (const k of M.NUTRIENTS) c.nutrients[k] = fresh && !modification ? (i.nutrients[k] ?? null) : null;
      c.catalog = { restaurantId: r.id, itemId: i.id, sourceUrl: sources.get(i.menuSourceId).url, verifiedAt: sources.get(i.menuSourceId).verifiedAt, serving: i.serving, modification, allergenWarning: 'Standard-item information only. Confirm allergens and cross-contact with the restaurant.' };
      if (modification) { c.name += ' — customized'; c.preparation = modification; c.source += '; Customized: nutrition unknown until re-sourced.'; }
      return c;
    }
    function recommend(r, profile, priority = 'balanced', share = .3, now) {
      if (!Object.hasOwn(PRIORITIES, priority) || !Number.isFinite(share) || share < .1 || share > 1) return { meals: [], message: 'Choose a supported priority and meal share.' };
      const pref = profile?.preferences || { allergens: [], restrictions: [] };
      if (!preferences(profile?.preferences) || pref.other?.trim()) return { meals: [], message: 'Other dietary restrictions require manual review; no meal is recommended.' };
      const requirements = { balanced: M.NUTRIENTS, protein: ['kcal', 'protein'], lighter: ['kcal', 'protein'], sodium: ['kcal', 'protein', 'sodium'], addedSugar: ['kcal', 'protein', 'addedSugar'] }[priority];
      const safe = i => itemCurrent(r, i, now) && current(i.nutritionSourceId, now) && sources.get(i.nutritionSourceId)?.type !== 'reference' &&
        requirements.every(k => i.nutrients[k] != null) &&
        (!pref.allergens?.length || (i.allergens.complete && current(i.dietarySourceId, now) && !pref.allergens.some(x => i.allergens.contains.includes(x) || i.allergens.mayContain.includes(x)))) &&
        (!pref.restrictions?.length || (current(i.dietarySourceId, now) && pref.restrictions.every(x => i.dietary[x] === true)));
      const items = r.items.filter(safe), mains = items.filter(i => i.role === 'main');
      let combinations = mains.map(i => [i]);
      for (const main of mains) for (const side of items.filter(i => ['side', 'drink'].includes(i.role))) if (combinations.length < 120) combinations.push([main, side]);
      const personalized = profile?.calories > 0 && profile?.protein > 0;
      const budget = personalized ? profile.calories * share : null, protein = personalized ? profile.protein * share : null;
      let meals = combinations.map(order => {
        const totals = M.total({ profile: 'you', components: order.map(i => component(r, i, 1, '', now)) }, 'you');
        const v = totals.values;
        const reasons = personalized ? [`Compared with ${Math.round(share * 100)}% of your saved daily goals: ${Math.round(budget)} kcal and ${Math.round(protein)} g protein. This is a chosen meal budget, not a medical prescription.`] : ['General comparison, not personalized: set calorie and protein goals to compare with a meal budget.'];
        const tradeoffs = ['Standard published portions only; substitutions can invalidate nutrition. Confirm allergens and cross-contact with the restaurant.'];
        for (const [k, label] of [['sodium', 'Sodium'], ['saturatedFat', 'Saturated fat'], ['addedSugar', 'Added sugar'], ['fiber', 'Fiber']]) tradeoffs.push(`${label}: ${v[k] == null ? 'unknown' : Math.round(v[k] * 10) / 10 + (k === 'sodium' ? ' mg' : ' g')}.`);
        if (personalized && v.protein < protein) tradeoffs.push('Protein is below this meal share of your saved target.');
        for (const [k, label] of [['sodium', 'sodium'], ['addedSugar', 'added sugar'], ['saturatedFat', 'saturated fat']]) if (pref[k] > 0 && v[k] != null && v[k] > pref[k] * share) tradeoffs.push(`Above your chosen meal share of the saved ${label} limit.`);
        const score = priority === 'protein' ? -v.protein : priority === 'lighter' ? v.kcal : priority === 'sodium' ? v.sodium : priority === 'addedSugar' ? v.addedSugar : personalized ? Math.abs(v.kcal - budget) / budget + Math.max(0, protein - v.protein) / protein : 0;
        reasons.push({ balanced: 'Compares energy and protein with the chosen meal share; all listed nutrients must be known. This is not a health score.', protein: 'Sorted by protein among orders within the calorie meal budget when goals are set.', lighter: 'Sorted by calories, with protein shown; lower calories alone do not establish a healthier meal.', sodium: 'Sorted by published sodium; total sodium is not inferred from calories.', addedSugar: 'Sorted by published added sugar; total sugar is not used as a substitute.' }[priority]);
        return { items: order, totals, reasons, tradeoffs, personalized, score };
      });
      if (personalized) meals = meals.filter(m => m.totals.values.kcal <= budget);
      meals.sort((a, b) => a.score - b.score);
      return { meals: meals.slice(0, 3), message: meals.length ? 'Local comparison of currently reviewed standard items. Availability can change by location.' : 'Insufficient current published nutrition, serving, allergy/restriction information or meal-budget fit. No personalized recommendation is available.' };
    }
    return Object.freeze({ search(name = '', city = '') { return M.clone(copy.restaurants.filter(r => fold(r.name).includes(fold(name)) && (r.scope === 'national' || fold(r.location).includes(fold(city))))); }, sources, current, itemCurrent, component, recommend });
  }
  const api = { create, preferences, ALLERGENS, RESTRICTIONS, PRIORITIES };
  try { api.catalog = create(window.HHRestaurantCatalogData); } catch { api.error = 'Catalog unavailable. Saved restaurants and manual plates remain available.'; }
  window.HHCatalog = Object.freeze(api);
})();
