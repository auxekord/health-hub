const {test,expect}=require('@playwright/test');
const nav=async(page,id)=>{if(id==='nutrition'){await page.locator('.nav [data-go="plan"]').click();await page.locator('#plan [data-go="nutrition"]').first().click();}else await page.locator(`.nav [data-go="${id}"]`).click();};
test.beforeEach(async({page})=>{await page.goto('./');});
test('navigation, discovery filters and all original recipe cards render',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['nutrition','plan','progress','home']){await nav(page,id);await expect(page.locator('main>section:not(.hidden)')).toHaveAttribute('id',id);}
 await nav(page,'nutrition');await page.locator('[data-mealpick="Dinner"]').click();
 await page.locator('#query').fill('chicken');await expect(page.locator('#results')).toContainText('Chicken');
 await page.locator('[data-filter="cook"]').click();await expect(page.locator('#results')).not.toContainText('GRAB IT');
 // Seed every original selection to audit rendering branches, not invented recipes.
 const count=await page.evaluate(()=>{const r=JSON.parse(document.querySelector('#recipes').textContent);const s=JSON.parse(localStorage.getItem('healthhub-v5')||'{}');s.selected=r.map(x=>x.id);s.logs=[];localStorage.setItem('healthhub-v5',JSON.stringify(s));return r.length;});
 await page.reload();await nav(page,'plan');await expect(page.locator('.recipe-fold')).toHaveCount(count);expect(errors).toEqual([]);
});
test('recipe selection, portions, batch weights, logging, persistence and removals',async({page})=>{
 await nav(page,'nutrition');await page.locator('#query').fill('Chicken fajita bowl');await page.locator('[data-add="fajita"]').click();
 const card=page.locator('[data-fold="recipe-fajita"]');await expect(card).toBeVisible();
 const initial=await card.locator('.totals b').first().textContent();await page.locator('#myScale').fill('150');await expect(card.locator('.totals b').first()).not.toHaveText(initial);
 await card.locator('[data-batch]').first().fill('400');await card.locator('[data-batch]').first().press('Tab');await expect(card.locator('.ingredient').first()).toContainText('ACTUAL PLATE');const plated=await card.locator('.ingredient').first().locator('.ingredientline').last().locator('b').allTextContents();expect(plated.reduce((sum,x)=>sum+parseInt(x),0)).toBe(400);
 await card.locator('[data-step]').first().check();await page.reload();await nav(page,'plan');await expect(page.locator('#myScale')).toHaveValue('150');await expect(card.locator('[data-batch]').first()).toHaveValue('400');await expect(card.locator('[data-step]').first()).toBeChecked();
 await card.locator('[data-log]').click();await nav(page,'nutrition');await expect(page.locator('#foodLog')).toContainText('Chicken fajita bowl');await page.reload();await nav(page,'nutrition');await expect(page.locator('#foodLog')).toContainText('Chicken fajita bowl');await page.locator('[data-delete]').click();await expect(page.locator('#foodLog')).not.toContainText('Chicken fajita bowl');
 await nav(page,'plan');await card.locator('[data-remove]').click();await expect(card).toHaveCount(0);await page.reload();await nav(page,'plan');await expect(card).toHaveCount(0);
});
async function searchFood(page){
 await page.route('https://world.openfoodfacts.org/**',r=>r.fulfill({json:{products:[{code:'123',product_name:'Test yogurt',brands:'Fixture',nutriments:{'energy-kcal_100g':100,proteins_100g:10}},{code:'456',product_name:'Unknown food',nutriments:{'energy-kcal_100g':null,proteins_100g:''}}]}}));
 await nav(page,'nutrition');await page.locator('#liveQuery').fill('yogurt');await page.locator('#liveSearchBtn').click();await expect(page.locator('[data-live-select]')).toHaveCount(2);
}
test('online food selection, Kitchen transfer, adjusted portions, nutrition and removal persist',async({page})=>{
 await searchFood(page);await page.locator('[data-live-select="0"]').click();await page.locator('#liveMyGrams').fill('200');await expect(page.locator('#livePreview')).toContainText('200 kcal');await page.locator('#liveAddKitchenBtn').click();
 const food=page.locator('#recipeCards article');await expect(food).toContainText('Test yogurt');await food.locator('[data-kitchen-grams="my"]').fill('250');await food.locator('[data-kitchen-grams="my"]').press('Tab');await page.reload();await nav(page,'plan');await expect(food.locator('[data-kitchen-grams="my"]')).toHaveValue('250');await food.locator('[data-kitchen-log]').click();await expect(page.locator('#liveLog')).toContainText('250 g yours');await page.reload();await nav(page,'nutrition');await expect(page.locator('#liveLog')).toContainText('250 g yours');await nav(page,'home');await expect(page.locator('#liveSummary')).toContainText('250 kcal');await nav(page,'nutrition');await page.locator('[data-live-delete]').click();await expect(page.locator('#liveLog')).toBeEmpty();await nav(page,'plan');await food.locator('[data-kitchen-remove]').click();await page.reload();await nav(page,'plan');await expect(food).toHaveCount(0);
});
test('missing nutrients stay unknown and direct food logging rejects zero portions',async({page})=>{
 await searchFood(page);await expect(page.locator('#liveResults .live-product').nth(1)).toContainText('Calories unavailable');await page.locator('[data-live-select="1"]').click();await page.locator('#liveMyGrams').fill('0');await page.locator('#liveWifeGrams').fill('0');page.once('dialog',d=>d.accept());await page.locator('#liveLogBtn').click();await expect(page.locator('#liveLog')).toBeEmpty();await page.locator('#liveMyGrams').fill('50');await page.locator('#liveLogBtn').click();await expect(page.locator('#liveLog')).toContainText('kcal unknown');
});
test('online failure recovers and curated discovery still works',async({page})=>{
 await page.route('https://world.openfoodfacts.org/**',r=>r.fulfill({status:503,body:'Unavailable'}));await nav(page,'nutrition');await page.locator('#liveQuery').fill('rice');await page.locator('#liveSearchBtn').click();await expect(page.locator('#liveStatus')).toContainText('unavailable');await expect(page.locator('#liveSearchBtn')).toBeEnabled();await page.locator('#query').fill('rice');await expect(page.locator('[data-add]').first()).toBeVisible();
});
test('invalid Kitchen edits cannot silently log previous portions',async({page})=>{
 await searchFood(page);await page.locator('[data-live-select="0"]').click();await page.locator('#liveAddKitchenBtn').click();const input=page.locator('[data-kitchen-grams="my"]');await input.fill('-1');await input.press('Tab');page.once('dialog',d=>d.accept());await page.locator('[data-kitchen-log]').click();await expect(page.locator('#plan')).toBeVisible();await nav(page,'nutrition');await expect(page.locator('#liveLog')).toBeEmpty();
});
test('backup export/import preserves data and malformed imports cannot break navigation',async({page})=>{
 await nav(page,'progress');await page.locator('#stepsInput').fill('4321');await page.locator('#stepsForm button').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const fs=require('node:fs');const backup=fs.readFileSync(await download.path());expect(JSON.parse(backup).steps[0].value).toBe(4321);
 await page.evaluate(()=>localStorage.clear());await page.reload();await nav(page,'progress');
 page.once('dialog',d=>d.accept());await page.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});await expect(page.locator('#history')).toContainText('4321');
 page.once('dialog',d=>d.accept());await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({selected:[],logs:[],steps:null}))});await expect(page.locator('#history')).toContainText('4321');await nav(page,'home');await expect(page.locator('#stepsCount')).toHaveText('4,321');
});
