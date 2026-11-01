/* Safe DOM menu browsing and a transient order basket; household data never leaves the browser. */
(() => {
  'use strict';
  const M = window.HHModel, C = window.HHCatalog;
  const el = (tag, text, attrs = {}) => {
    const n = document.createElement(tag);
    if (text !== null) n.textContent = text;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const button = (text, action) => { const b = el('button', text, { type: 'button', class: 'btn alt sm' }); b.addEventListener('click', action); return b; };
  const link = (text, url) => el('a', text, { href: M.safeURL(url), target: '_blank', rel: 'noopener noreferrer', class: 'catalog-source' });
  function field(parent, label, tag, attrs = {}) { const l = el('label', label, { class: 'phase-label' }), n = el(tag, null, attrs); l.append(n); parent.append(l); return n; }
  function totals(components) {
    const t = M.total({ profile: 'you', components }, 'you');
    return M.NUTRIENTS.map(k => `${({ kcal: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fiber: 'Fiber', sodium: 'Sodium', saturatedFat: 'Saturated fat', sugar: 'Sugar', addedSugar: 'Added sugar' })[k]}: ${t.values[k] == null ? 'unknown' : Math.round(t.values[k] * 10) / 10 + (k === 'kcal' ? ' kcal' : k === 'sodium' ? ' mg' : ' g')}${t.partial[k] ? ' (partial)' : ''}`).join(' · ');
  }
  function render(area, r, context) {
    const engine = C.catalog;
    area.replaceChildren();
    const matches = engine?.search(r.name, r.location) || [];
    const record = matches.find(x => x.id === r.catalogId) || matches.find(x => x.name.toLowerCase() === r.name.toLowerCase());
    if (!record) return;
    const freshItems = record.items.filter(i => engine.itemCurrent(record, i)), staleItems = record.items.filter(i => !engine.itemCurrent(record, i));
    area.className = 'catalog-panel';
    area.append(el('h3', record.name + ' — menu & orders'), el('h3', context.replacement ? 'Suggested Meal' : 'Recommended for You'), el('p', record.category + ' · ' + (record.status === 'verified' ? 'Reviewed catalog; not live search or a location availability guarantee.' : 'Research directory — unverified, not a live search result.'), { class: 'notice' }));
    const controls = el('div', null, { class: 'phase-fields' });
    const profile = field(controls, 'Household member for this order', 'select', { 'data-catalog': 'profile' });
    for (const k of ['you', 'wife']) profile.append(el('option', context.profiles()[k].name, { value: k }));
    profile.value = context.activeProfile || 'you';
    const priority = field(controls, 'Recommendation priority', 'select', { 'data-catalog': 'priority' });
    for (const [k, v] of Object.entries(C.PRIORITIES)) priority.append(el('option', v, { value: k }));
    priority.value = 'protein';
    const share = field(controls, 'Daily-goal share for this meal (%)', 'input', { 'data-catalog': 'share', type: 'number', min: '10', max: '100', step: '1', value: '30' });
    const recs = el('div', null, { 'data-catalog': 'recommendations', 'aria-live': 'polite' });
    const preferenceBox = el('details', null, { class: 'catalog-preferences' }); preferenceBox.append(el('summary', 'Dietary preferences and optional limits (stored privately on this device)'));
    const preferenceForm = el('form', null, { 'data-catalog': 'preferences', class: 'phase-fields' });
    const allergies = el('fieldset'), restrictions = el('fieldset'); allergies.append(el('legend', 'Avoid these allergens')); restrictions.append(el('legend', 'Dietary restrictions'));
    for (const [parent, list, name] of [[allergies, C.ALLERGENS, 'allergens'], [restrictions, C.RESTRICTIONS, 'restrictions']]) for (const value of list) {
      const label = el('label', null, { class: 'catalog-check' }), input = el('input', null, { type: 'checkbox', name, value }); label.append(input, document.createTextNode(value)); parent.append(label);
    }
    preferenceForm.append(allergies, restrictions);
    const other = field(preferenceForm, 'Other restrictions (requires manual review)', 'input', { name: 'other', maxlength: '500' });
    const limits = {};
    for (const [k, label] of [['sodium', 'Optional daily sodium limit (mg)'], ['addedSugar', 'Optional daily added sugar limit (g)'], ['saturatedFat', 'Optional daily saturated fat limit (g)']]) limits[k] = field(preferenceForm, label, 'input', { name: k, type: 'number', min: '0', max: '100000', step: 'any', placeholder: 'Not set' });
    const preferenceStatus = el('p', '', { role: 'status', class: 'notice phase-wide' });
    preferenceForm.append(el('button', 'Save preferences for selected member', { type: 'submit', class: 'btn' }), preferenceStatus); preferenceBox.append(preferenceForm);
    function loadPreferences() {
      const p = context.profiles()[profile.value].preferences || { allergens: [], restrictions: [] };
      for (const i of preferenceForm.querySelectorAll('[type=checkbox]')) i.checked = p[i.name].includes(i.value);
      other.value = p.other || '';
      for (const k in limits) limits[k].value = p[k] ?? '';
      preferenceStatus.textContent = '';
    }
    preferenceForm.addEventListener('submit', e => {
      e.preventDefault();
      const p = { allergens: [], restrictions: [], other: other.value.trim() };
      for (const i of preferenceForm.querySelectorAll('[type=checkbox]:checked')) p[i.name].push(i.value);
      for (const k in limits) p[k] = limits[k].value === '' ? null : Number(limits[k].value);
      if (!C.preferences(p)) { preferenceStatus.textContent = 'Check dietary preferences and limits.'; return; }
      const ok = context.commit(() => { context.profiles()[profile.value].preferences = p; }, 'Dietary preferences saved locally.');
      preferenceStatus.textContent = ok ? 'Saved for ' + context.profiles()[profile.value].name + '.' : 'Could not save; review storage recovery.';
      recommend();
    });
    area.append(controls, preferenceBox, button('Suggest meals', recommend), recs, el('h3', 'Explore Menu / Build My Meal'));
    if (record.status !== 'verified') area.append(el('p', 'No source-verified menu is available in this build. You can build a manual plate; no menu items or official nutrition have been invented.', { class: 'notice', 'data-catalog': 'unavailable' }));
    if (record.sourceId && engine.sources.has(record.sourceId)) { const s = engine.sources.get(record.sourceId); area.append(link('Reviewed restaurant/menu source', s.url), el('p', 'Last reviewed: ' + s.verifiedAt + '. Location availability may differ.', { class: 'mini' })); }
    if (staleItems.length) {
      const history = el('details'); history.append(el('summary', 'Outdated menu data — unavailable for recommendations'));
      for (const i of staleItems) history.append(el('p', i.name + ' · historical listing only; confirm with the restaurant.'));
      area.append(history);
    }
    let cart = [], comparison = null;
    const categories = field(area, 'Menu category', 'select', { 'data-catalog': 'category' }); categories.append(el('option', 'All reviewed categories', { value: '' }));
    for (const c of new Set(freshItems.map(i => i.category))) categories.append(el('option', c, { value: c }));
    const menu = el('div', null, { 'data-catalog': 'menu', class: 'catalog-grid' }), basket = el('div', null, { 'data-catalog': 'basket' });
    area.append(menu, el('h4', 'Your custom order'), el('p', 'Published nutrition applies only to the named standard serving. Quantities scale that serving; a substitution or preparation change makes nutrition unknown until re-sourced.', { class: 'notice' }), basket);
    const customForm = el('form', null, { class: 'phase-fields', 'data-catalog': 'custom' });
    const customName = field(customForm, 'Custom component name', 'input', { required: '', name: 'name', maxlength: '150' });
    const customQuantity = field(customForm, 'Custom quantity (leave blank if unknown)', 'input', { name: 'quantity', type: 'number', min: '0', max: '100000', step: 'any' });
    const customUnit = field(customForm, 'Custom measurement unit', 'select', { name: 'unit' }); for (const u of M.UNITS) customUnit.append(el('option', u, { value: u }));
    customForm.append(el('button', 'Add custom component', { type: 'submit', class: 'btn alt' }));
    customForm.addEventListener('submit', e => { e.preventDefault(); const c = M.blankComponent(customName.value.trim()); if (!c.name) return; c.quantity = customQuantity.value === '' ? null : Number(customQuantity.value); c.unit = customUnit.value; cart.push({ custom: c }); customForm.reset(); drawCart(); });
    const total = el('p', '', { 'data-catalog': 'totals', role: 'status', class: 'notice' });
    const compare = el('div', null, { 'data-catalog': 'comparison', class: 'notice' });
    const review = button(context.mode === 'plan' ? (context.replacement ? 'Customize replacement order' : 'Review order before planning') : 'Review order before logging', () => {
      if ([...basket.querySelectorAll('input')].some(input => !input.reportValidity())) return;
      if (!cart.length) { total.textContent = 'Add at least one item or custom component.'; return; }
      context.onOrder(components(), profile.value); // Confirmation opens existing editor; never saves consumption here.
    });
    area.append(customForm, total, button('Keep order for comparison', () => { comparison = { label: cart.map(x => x.item?.name || x.custom.name).join(' + '), totals: totals(components()) }; drawCart(); }), compare, review);
    function components() { return cart.map(x => x.custom ? M.clone(x.custom) : engine.component(record, x.item, x.quantity, x.modification)); }
    function drawMenu() {
      menu.replaceChildren();
      for (const i of freshItems.filter(i => !categories.value || i.category === categories.value)) {
        const card = el('article', null, { class: 'entry catalog-menu-item' }), s = engine.sources.get(i.menuSourceId);
        card.append(el('h4', i.name), el('p', i.serving), el('p', totals([engine.component(record, i)]), { class: 'mini' }), link('Published menu source', s.url), el('small', 'Reviewed ' + s.verifiedAt + '. Standard item; location availability may vary.'), el('p', !i.allergens.complete ? 'Allergen information incomplete; safety is not established.' : 'Published allergens: ' + (i.allergens.contains.join(', ') || 'none listed') + '. Cross-contact remains possible.', { class: 'notice' }));
        const n = engine.sources.get(i.nutritionSourceId); if (n) card.append(link(n.type === 'reference' ? 'Reference-food estimate source' : 'Published standard-item nutrition source', n.url));
        card.append(button('Add ' + i.name, () => { const existing = cart.find(x => x.item?.id === i.id && !x.modification); if (existing) existing.quantity += 1; else cart.push({ item: i, quantity: 1, modification: '' }); drawCart(); })); menu.append(card);
      }
      if (!freshItems.length) menu.append(el('p', 'No current reviewed menu items. Manual components remain available.', { class: 'empty' }));
    }
    function drawCart() {
      basket.replaceChildren();
      for (const [index, x] of cart.entries()) {
        const row = el('article', null, { class: 'entry catalog-order-item' }); row.append(el('strong', x.item?.name || x.custom.name));
        const qty = field(row, x.item ? 'Number of published servings' : 'Custom quantity', 'input', { type: 'number', min: '0', max: '100000', step: 'any', value: x.quantity ?? x.custom?.quantity ?? '' });
        qty.addEventListener('input', () => { const value = qty.value === '' ? null : Number(qty.value); if (x.custom) x.custom.quantity = value; else x.quantity = value; updateTotals(); });
        if (x.item) {
          const modification = field(row, 'Substitution / preparation change (nutrition becomes unknown)', 'input', { maxlength: '500', value: x.modification });
          modification.addEventListener('input', () => { x.modification = modification.value.trim(); updateTotals(); });
        }
        row.append(button('Remove ' + (x.item?.name || x.custom.name), () => { cart.splice(index, 1); drawCart(); })); basket.append(row);
      }
      updateTotals();
    }
    function updateTotals() {
      total.textContent = cart.length ? totals(components()) : 'No items selected. Nothing is planned or logged.';
      compare.replaceChildren();
      if (comparison) compare.append(el('h4', 'Saved comparison: ' + comparison.label), el('p', comparison.totals), el('h4', 'Current order'), el('p', cart.length ? totals(components()) : 'Empty'));
    }
    function recommend() {
      const p = context.profiles()[profile.value], result = engine.recommend(record, p, priority.value, Number(share.value) / 100, undefined, context.category);
      recs.replaceChildren(el('p', p.name + ' · ' + result.message, { class: 'notice' }));
      for (const m of result.meals) {
        const card = el('article', null, { class: 'entry', 'data-catalog': 'suggestion' }); card.append(el('h4', m.items.map(i => i.name).join(' + ')), el('strong', m.personalized ? 'Compared with your saved goals' : 'General comparison — not personalized'), el('p', totals(m.items.map(i => engine.component(record, i)))));
        for (const reason of [...m.reasons, ...m.tradeoffs]) card.append(el('p', reason, { class: 'mini' }));
        card.append(button('Customize this suggestion', () => { cart = m.items.map(item => ({ item, quantity: 1, modification: '' })); drawCart(); basket.scrollIntoView({ block: 'nearest' }); })); recs.append(card);
      }
    }
    profile.addEventListener('change', () => { loadPreferences(); recommend(); });
    priority.addEventListener('change', recommend); share.addEventListener('input', recommend); categories.addEventListener('change', drawMenu);
    loadPreferences(); drawMenu(); drawCart(); recommend();
  }
  window.HHCatalogUI = { render };
})();
