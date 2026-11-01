const { test, expect } = require('@playwright/test');
const fixture = require('./fixtures/catalog.cjs');
const dialog = p => p.locator('#restaurant-browser');
const ui = p => p.locator('#restaurant-catalog');
async function open(p, name = 'Fictional Test Kitchen', mode = 'journal') {
  await p.goto('./');
  await p.locator(`.nav [data-go=${mode === 'plan' ? 'plan' : 'journal'}]`).click();
  await p.locator(mode === 'plan' ? '#week-connected [data-p=browse-plan-restaurants]' : '#journal-connected [data-p=restaurant]').click();
  await p.locator('#restaurant-search-form [name=name]').fill(name);
  await dialog(p).getByRole('button',{name:'Search saved restaurants',exact:true}).click();
  await dialog(p).getByRole('button',{name:'Explore '+name,exact:true}).click();
}
async function mock(p,data=fixture()) {
  await p.route('**/app/catalog-data.js', r => r.fulfill({contentType:'application/javascript',body:'window.HHRestaurantCatalogData='+JSON.stringify(data)+';'}));
}
async function evaluate(p,fn,data=fixture()) {
  await p.goto('./');
  return p.evaluate(fn,data);
}
function state(p) { return p.evaluate(()=>window.HealthHub.state); }

test('unverified research directory is searchable without pretending to offer a live menu',async({page})=>{
  await open(page,"Dunkin'");
  await expect(ui(page)).toContainText('Research directory — unverified');
  await expect(ui(page)).toContainText('No source-verified menu');
  await expect(ui(page).locator('[data-catalog=suggestion]')).toHaveCount(0);
  await expect(ui(page).locator('.catalog-menu-item')).toHaveCount(0);
  await expect(ui(page).getByRole('button',{name:'Review order before logging'})).toBeVisible();
});
test('name punctuation and location matching respects chain scope and local cities',async({page})=>{
  const result=await evaluate(page,()=>({d:HHCatalog.catalog.search('dunkin','Detroit').length,m:HHCatalog.catalog.search('McDonald’s','Miami').length,no:HHCatalog.catalog.search('Fixins','Miami').length,yes:HHCatalog.catalog.search('Fixins','Detroit').length}));
  expect(result).toEqual({d:1,m:1,no:0,yes:1});
});
test('source review is mandatory for menu and nutrition; malicious identifiers and URLs reject',async({page})=>{
  const result=await evaluate(page,data=>{
    const edits=[d=>d.sources.splice(0),d=>d.restaurants[0].items[0].id='" onerror=alert(1)',d=>d.sources[0].url='javascript:alert(1)',d=>d.restaurants[0].items[0].nutritionSourceId='missing',d=>d.restaurants[0].items[0].dietarySourceId='missing',d=>d.restaurants[0].status='unverified'];
    return edits.map(edit=>{const d=structuredClone(data);edit(d);try{HHCatalog.create(d);return false;}catch{return true;}});
  });
  expect(result).toEqual([true,true,true,true,true,true]);
});
test('dated historical menu is not recommended or treated as current nutrition',async({page})=>{
  const data=fixture();data.sources.forEach(s=>s.verifiedAt='2020-01-01');await mock(page,data);await open(page);
  await expect(ui(page)).toContainText('Outdated menu data');
  await expect(ui(page).locator('.catalog-menu-item')).toHaveCount(0);
  await expect(ui(page).locator('[data-catalog=suggestion]')).toHaveCount(0);
});
test('priorities require their own published nutrient and explain selected goal share',async({page})=>{
  const result=await evaluate(page,data=>{
    const c=HHCatalog.create(data),r=c.search()[0],p={calories:2000,protein:100};
    const result=c.recommend(r,p,'protein',.3);
    return {names:result.meals.map(m=>m.items.map(i=>i.id)),reason:result.meals[0].reasons.join(' '),added:c.recommend(r,p,'addedSugar',.3).meals.flatMap(m=>m.items.map(i=>i.id)),general:c.recommend(r,{},'lighter').meals[0].personalized};
  });
  expect(result.names[0]).toContain('sandwich');expect(result.reason).toContain('600 kcal');expect(result.reason).toContain('30 g protein');expect(result.added).not.toContain('sandwich');expect(result.general).toBe(false);
});
test('allergies, may-contain, incomplete disclosure and restrictions suppress unsafe suggestions',async({page})=>{
  const result=await evaluate(page,data=>{
    const r=data.restaurants[0],p={calories:2000,protein:100,preferences:{allergens:['milk'],restrictions:[]}};
    r.items[0].allergens.contains=['milk'];r.items[1].allergens.complete=false;
    let c=HHCatalog.create(data);const blocked=c.recommend(c.search()[0],p,'protein').meals.length;
    r.items[0].allergens.contains=[];r.items[0].allergens.mayContain=['milk'];c=HHCatalog.create(data);const may=c.recommend(c.search()[0],p,'protein').meals.length;
    p.preferences={allergens:[],restrictions:['vegan']};r.items.forEach(i=>i.dietary={});c=HHCatalog.create(data);const vegan=c.recommend(c.search()[0],p,'protein').meals.length;
    p.preferences.other='Fictional unmodeled restriction';return {blocked,may,vegan,other:c.recommend(c.search()[0],p,'protein').meals.length};
  });expect(result).toEqual({blocked:0,may:0,vegan:0,other:0});
});
test('custom orders scale standard portions but substitutions invalidate nutrition',async({page})=>{
  await mock(page);await open(page);
  await ui(page).getByRole('button',{name:'Add Synthetic breakfast plate',exact:true}).click();
  await ui(page).locator('.catalog-order-item input[type=number]').fill('0.5');
  await expect(ui(page).locator('[data-catalog=totals]')).toContainText('Calories: 175 kcal');
  await ui(page).getByRole('button',{name:'Keep order for comparison'}).click();
  await ui(page).getByLabel('Substitution / preparation change (nutrition becomes unknown)',{exact:true}).fill('Synthetic substitution');
  await expect(ui(page).locator('[data-catalog=totals]')).toContainText('Calories: unknown');
  await expect(ui(page).locator('[data-catalog=comparison]')).toContainText('175 kcal');
  await ui(page).getByRole('button',{name:'Review order before logging'}).click();
  await expect(page.locator('#meal-editor')).toBeVisible();
  expect((await state(page)).phase2.journal).toHaveLength(0);
  await page.locator('#save-meal').click();
  const s=await state(page);expect(s.phase2.journal).toHaveLength(1);expect(s.phase2.journal[0].components[0].nutrients.kcal).toBeNull();expect(s.phase2.journal[0].components[0].catalog.modification).toContain('substitution');
});
test('menu source cards, categories and allergens are visible and safely linked',async({page})=>{
  await mock(page);await open(page);
  await expect(ui(page).locator('.catalog-menu-item')).toHaveCount(3);
  await ui(page).locator('[data-catalog=category]').selectOption('Breakfast');
  await expect(ui(page).locator('.catalog-menu-item')).toHaveCount(1);
  const link=ui(page).getByRole('link',{name:'Published menu source',exact:true});
  await expect(link).toHaveAttribute('href','https://example.org/fictional-test/menu');await expect(link).toHaveAttribute('rel','noopener noreferrer');
  await expect(ui(page)).toContainText('Standard item');
});
test('unknown modified components produce partial rather than false zero totals',async({page})=>{
  const result=await evaluate(page,data=>{const c=HHCatalog.create(data),r=c.search()[0];const a=c.component(r,r.items[0]),b=c.component(r,r.items[1],1,'custom');return HHModel.total({profile:'you',components:[a,b]},'you');});
  expect(result.values.kcal).toBe(350);expect(result.partial.kcal).toBe(true);expect(result.values.sodium).toBe(450);
});
test('selected household, preferences and favorite snapshots persist without cross-profile overwrite',async({page})=>{
  await mock(page);await open(page);await ui(page).locator('[data-catalog=profile]').selectOption('wife');
  await ui(page).locator('.catalog-preferences summary').click();await ui(page).locator('[name=allergens][value=milk]').check();await ui(page).getByRole('button',{name:'Save preferences for selected member'}).click();
  await expect(ui(page).locator('[data-catalog=preferences] [role=status]')).toContainText('Saved');
  const s=await state(page);expect(s.phase2.profiles.wife.preferences.allergens).toEqual(['milk']);expect(s.phase2.profiles.you.preferences).toBeUndefined();
  await ui(page).getByRole('button',{name:'Add Synthetic breakfast plate',exact:true}).click();await ui(page).getByRole('button',{name:'Review order before logging'}).click();
  await expect(page.locator('#meal-editor [name=profile]')).toHaveValue('wife');await page.locator('#save-meal').click();await page.reload();
  const after=await state(page);expect(after.phase2.profiles.wife.preferences.allergens).toEqual(['milk']);expect(after.phase2.journal[0].profile).toBe('wife');
  await page.locator('.nav [data-go=journal]').click();await page.locator('[data-p=favorite-journal]').first().click();
  expect((await state(page)).phase2.favorites[0].components[0].catalog.itemId).toBe('plate');
});
test('catalog plan remains separate, exclusions preserve groceries, and repeated log taps are guarded',async({page})=>{
  await mock(page);await open(page,'Fictional Test Kitchen','plan');await ui(page).getByRole('button',{name:'Add Synthetic breakfast plate',exact:true}).click();await ui(page).getByRole('button',{name:'Review order before planning'}).click();await page.locator('#save-meal').click();
  let s=await state(page);expect(s.phase2.plans).toHaveLength(1);expect(s.phase2.journal).toHaveLength(0);
  expect(await page.evaluate(()=>HHModel.groceries(HealthHub.state.phase2.plans))).toEqual([]);
  await page.locator('#week-connected [data-p=eat]').first().click();await page.locator('#save-meal').click();
  s=await state(page);expect(s.phase2.journal).toHaveLength(1);expect(s.phase2.plans).toHaveLength(1);
  await page.locator('.nav [data-go=plan]').click();await page.locator('#week-connected [data-p=eat]').first().click();expect((await state(page)).phase2.journal).toHaveLength(1);
});
test('editing standard menu names in the journal invalidates inherited published nutrition',async({page})=>{
  await mock(page);await open(page);await ui(page).getByRole('button',{name:'Add Synthetic breakfast plate',exact:true}).click();await ui(page).getByRole('button',{name:'Review order before logging'}).click();
  await page.locator('#component-list [data-field=name]').fill('Changed standard ingredient');
  await page.locator('#save-meal').click();const c=(await state(page)).phase2.journal[0].components[0];expect(c.status).toBe('unknown');expect(c.nutrients.kcal).toBeNull();
});
test('malicious saved preferences or catalog identifiers lock storage without overwriting raw records',async({page})=>{
  await page.goto('./');const raw=await page.evaluate(()=>{const s=HealthHub.state;s.phase2.profiles.you.preferences={allergens:['<script>'],restrictions:[]};const raw=JSON.stringify(s);localStorage.setItem('healthhub-v5',raw);return raw;});await page.reload();
  await expect(page.locator('#storage-warning')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('healthhub-v5'))).toBe(raw);
});
test('catalog text is inert and recommendations make no requests containing household data',async({page})=>{
  const data=fixture();data.restaurants[0].items[0].name='<img src=x onerror="window.catalogPwned=1">';await mock(page,data);const outside=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000/'))outside.push(r.url());});await open(page);
  await expect(ui(page).locator('.catalog-menu-item').first()).toContainText('<img src=x');expect(await page.evaluate(()=>window.catalogPwned)).toBeUndefined();expect(outside).toEqual([]);
});
test('offline menu browsing, custom unknown components and tablet width remain usable',async({page,context})=>{
  await mock(page);await open(page);await context.setOffline(true);
  await ui(page).locator('[data-catalog=custom] [name=name]').fill('Synthetic custom side');await ui(page).getByRole('button',{name:'Add custom component',exact:true}).click();
  await expect(ui(page).locator('[data-catalog=totals]')).toContainText('unknown');await page.setViewportSize({width:800,height:1280});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await ui(page).getByRole('button',{name:'Review order before logging'}).click();await page.locator('#save-meal').click();expect((await state(page)).phase2.journal).toHaveLength(1);
});
test('invalid catalog fails closed without breaking manual entry or recovery',async({page})=>{
  await mock(page,{version:99,sources:[],restaurants:[]});await page.goto('./');await page.locator('.nav [data-go=journal]').click();await page.locator('#journal-connected [data-p=restaurant]').click();
  await expect(page.locator('#restaurant-catalog-results')).toContainText('Catalog unavailable');await dialog(page).getByRole('button',{name:'Save a new restaurant',exact:true}).click();await page.locator('#restaurant-form [name=name]').fill('Fictional recovery restaurant');await dialog(page).getByRole('button',{name:'Build a restaurant plate',exact:true}).click();await expect(page.locator('#meal-editor')).toBeVisible();
});
test('legacy nutrients remain compatible and preferences survive ordinary goal editing and backup validation',async({page})=>{
  await mock(page);await open(page);await ui(page).locator('.catalog-preferences summary').click();await ui(page).locator('[name=allergens][value=sesame]').check();await ui(page).getByRole('button',{name:'Save preferences for selected member'}).click();await expect(ui(page).locator('[data-catalog=preferences] [role=status]')).toContainText('Saved');
  await dialog(page).getByRole('button',{name:'Close',exact:true}).click();await page.locator('.nav [data-go=plan]').click();await page.getByText('Household goals',{exact:true}).click();await page.locator('#profile-form [name=you-name]').fill('Fictional updated profile');await page.locator('#profile-form button[type=submit]').click();
  const result=await page.evaluate(()=>({allergens:HealthHub.state.phase2.profiles.you.preferences.allergens,valid:HHModel.valid(HealthHub.state.phase2)}));expect(result).toEqual({allergens:['sesame'],valid:true});
});
test('changing published serving basis clears inherited numbers and manual nutrient edits lose published status',async({page})=>{
  await mock(page);await open(page);await ui(page).getByRole('button',{name:'Add Synthetic breakfast plate',exact:true}).click();await ui(page).getByRole('button',{name:'Review order before logging'}).click();
  await page.locator('#component-list .phase-advanced summary').click();await page.locator('#component-list [data-nutrient=kcal]').fill('320');
  await expect(page.locator('#component-list [data-field=status]')).toHaveValue('estimate');await expect(page.locator('#component-list [data-field=source]')).toHaveValue(/User-edited estimate/);
  await page.locator('#component-list [data-field=nutritionBasis]').fill('100');await page.locator('#save-meal').click();
  const c=(await state(page)).phase2.journal[0].components[0];expect(c.nutrients.kcal).toBeNull();expect(c.status).toBe('unknown');
});
test('a reviewed menu without published nutrition remains browsable but cannot generate recommendations',async({page})=>{
  const data=fixture();data.restaurants[0].items.forEach(i=>{for(const k in i.nutrients)i.nutrients[k]=null;i.nutritionSourceId=null;});await mock(page,data);await open(page);await expect(ui(page).locator('.catalog-menu-item')).toHaveCount(3);await expect(ui(page).locator('[data-catalog=suggestion]')).toHaveCount(0);await expect(ui(page).locator('[data-catalog=recommendations]')).toContainText('Insufficient');
});
test('reviewed public catalog has five sourced restaurants and keeps unresolved identities separate',async({page})=>{
  const result=await evaluate(page,()=>{
    const all=HHRestaurantCatalogData.restaurants;
    return {verified:all.filter(r=>r.status==='verified').map(r=>[r.name,r.items.length]),count:all.reduce((a,r)=>a+r.items.length,0),unverifiedEmpty:all.filter(r=>r.status==='unverified').every(r=>!r.items.length),sources:HHRestaurantCatalogData.sources.every(s=>s.evidence.includes('SHA-256:'))};
  });
  expect(result.verified).toEqual([["McDonald's",117],['Fixins Soul Kitchen',38],['Sexy Steak',47],['Chick-fil-A',29],["Zukin's Rib Shack",60]]);expect(result.count).toBe(291);expect(result.unverifiedEmpty).toBe(true);expect(result.sources).toBe(true);
});
test('real published standard-item facts support comparisons without inventing independent-restaurant nutrition',async({page})=>{
  const result=await evaluate(page,()=>{
    const c=HHCatalog.catalog,p={calories:2000,protein:100},m=c.search("McDonald's")[0],f=c.search('Fixins')[0],ch=c.search('Chick-fil-A')[0];
    return {mc:c.recommend(m,p,'protein').meals.map(x=>x.items.map(i=>i.name)),fix:c.recommend(f,p,'protein').meals.length,cfa:c.recommend(ch,p,'protein').meals.length,added:c.recommend(ch,p,'addedSugar').meals.length,egg:m.items.find(i=>i.id==='mcd-egg-mcmuffin').nutrients,fixUnknown:f.items.every(i=>Object.values(i.nutrients).every(x=>x===null))};
  });expect(result.mc.flat().some(n=>n.includes('McDouble'))).toBe(true);expect(result.fix).toBe(0);expect(result.cfa).toBeGreaterThan(0);expect(result.added).toBe(0);expect(result.egg).toMatchObject({kcal:310,protein:17,sodium:null});expect(result.fixUnknown).toBe(true);
});
test('actual menu browsing and order confirmation retain provenance and unknown values',async({page})=>{
  await open(page,'Sexy Steak');await ui(page).locator('[data-catalog=category]').selectOption('Il Macellaio');await ui(page).getByRole('button',{name:'Add Filet Mignon',exact:true}).click();await expect(ui(page).locator('[data-catalog=totals]')).toContainText('Calories: unknown');await ui(page).getByRole('button',{name:'Review order before logging'}).click();await page.locator('#save-meal').click();const c=(await state(page)).phase2.journal[0].components[0];expect(c.catalog.sourceUrl).toBe('https://www.sexysteakdetroit.com/menu');expect(c.nutrients.kcal).toBeNull();expect(c.status).toBe('unknown');
});
