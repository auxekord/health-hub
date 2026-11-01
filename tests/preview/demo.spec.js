const { test, expect } = require("@playwright/test");
const KEY = "healthhub-demo-phase2-hybrid-v2";
const nav = (p, id) => p.locator(`.nav [data-go="${id}"]`).click();
const editor = (p) => p.locator("#meal-editor");
const data = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
test("fictional-only origin storage, strict headers, no external requests or production key access", async ({
  page,
  context,
  request,
}) => {
  const errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await context.addInitScript(() => {
    window.__demoStorage = [];
    for (const method of ["getItem", "setItem", "removeItem", "clear"]) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        window.__demoStorage.push([method, args[0] || ""]);
        if (args[0] === "healthhub-v5" || method === "clear")
          throw Error("Forbidden production namespace access");
        return original.apply(this, args);
      };
    }
  });
  const response = await page.goto("./");
  await expect(page.locator(".demo-banner")).toContainText(
    "HEALTH HUB — DEMO PREVIEW",
  );
  await expect(page.locator(".demo-banner")).toContainText("fictional");
  const s = await data(page);
  expect(s.phase2.profiles.you.name).toBe("Rowan Demo");
  expect(s.phase2.profiles.wife.name).toBe("Casey Demo");
  expect(s.phase2.plans.length).toBeGreaterThanOrEqual(28);
  expect(s.phase2.weights.length).toBe(8);
  expect(Object.keys(s.wifeProfile)).not.toContain("age");
  expect(Object.keys(s.wifeProfile)).not.toContain("heightCm");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("connect-src 'self'");
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["x-robots-tag"]).toContain("noindex");
  await nav(page, "plan");
  await page.locator('#plan [data-go="nutrition"]').first().click();
  await page.locator("#liveQuery").fill("yogurt");
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveResults")).toContainText("Demo yogurt");
  await expect(page.locator("#liveStatus")).toContainText(
    "Fictional local demo",
  );
  await nav(page, "progress");
  await page.locator("#export").click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__demoStorage.filter(
            (x) => x[1] === "healthhub-v5" || x[0] === "clear",
          ).length,
      ),
    )
    .toBe(0);
  expect(
    requests.every(
      (u) => u.startsWith("http://127.0.0.1:8001/") || u.startsWith("blob:"),
    ),
  ).toBeTruthy();
  await nav(page,'journal');await page.locator('#journal-connected [data-p=restaurant]').click();await page.locator('#restaurant-results button').click();await expect(page.locator('#restaurant-browser')).toContainText('Menu information unavailable');expect(requests.every(u=>u.startsWith('http://127.0.0.1:8001/')||u.startsWith('blob:'))).toBeTruthy();
  expect(errors).toEqual([]);
  const missing = await request.get(".git/config");
  expect(missing.status()).toBe(404);
});
test("all 139 recipes and exact cooking directions preserved, independent portions and full week visible", async ({
  page,
}) => {
  await page.goto("./");
  await nav(page, "plan");
  await expect(page.locator(".week-day")).toHaveCount(7);
  const s = await data(page);
  expect(new Set(s.phase2.plans.map((m) => m.date)).size).toBe(7);
  expect(s.phase2.plans[0].portions.you).not.toBe(
    s.phase2.plans[0].portions.wife,
  );
  expect(
    await page.evaluate(
      () => JSON.parse(document.getElementById("recipes").textContent).length,
    ),
  ).toBe(139);
  await expect(page.locator('[data-fold="recipe-fajita"]')).toContainText(
    "Season chicken with paprika, cumin, garlic and pepper.",
  );
  await expect(page.locator('[data-fold="recipe-salmon"]')).toBeVisible();
  const check = await page.evaluate(() => {
    const r = JSON.parse(document.getElementById("recipes").textContent);
    return r.every((x) => Array.isArray(x.steps) && x.steps.length > 0);
  });
  expect(check).toBeTruthy();
});
test("Campestre fictional estimate components edit, remove, add, save, repeat and persist", async ({
  page,
}) => {
  await page.goto("./");
  await nav(page, "journal");
  const plate = page
    .locator("[data-journal-id]")
    .filter({ hasText: "Campestre Chicken" });
  await plate.locator('[data-p="edit-journal"]').click();
  await expect(editor(page).locator("[data-component]")).toHaveCount(4);
  await expect(editor(page)).toContainText("Not official restaurant");
  const quantities = await editor(page)
    .locator('[data-field="quantity"]')
    .evaluateAll((nodes) => nodes.map((n) => n.value));
  for (let i = 0; i < 4; i++) {
    const fields = editor(page).locator('[data-field="quantity"]');
    await fields.nth(i).fill(String(Number(quantities[i]) + 1));
    const changed = await fields.evaluateAll((nodes) =>
      nodes.map((n) => n.value),
    );
    expect(changed.filter((v, j) => v !== quantities[j])).toHaveLength(1);
    await fields.nth(i).fill(quantities[i]);
  }
  const before = await page.locator("#editor-totals").innerText();
  const rows = editor(page).locator("[data-component]");
  await rows.nth(1).locator('[data-field="quantity"]').fill("120");
  await expect(page.locator("#editor-totals")).not.toHaveText(before);
  await rows.nth(3).locator('[data-p="remove-component"]').click();
  await editor(page).locator('[data-p="add-component"]').click();
  const newRow = editor(page).locator("[data-component]").last();
  await newRow.locator('[data-field="name"]').fill("Demo extra side");
  await newRow.locator('[data-field="quantity"]').fill("25");
  await page.locator("#save-meal").click();
  await expect(plate).toContainText("Demo extra side");
  await plate.locator('[data-p="repeat-journal"]').click();
  await editor(page).locator('[name="date"]').fill("2027-02-15");
  await page.locator("#save-meal").click();
  await page.reload();
  await nav(page, "journal");
  await page.locator("#journal-date").fill("2027-02-15");
  await expect(page.locator("[data-journal-id]")).toContainText(
    "Demo extra side",
  );
});
test("planned versus consumed isolation, grocery updates and unknown nutrient handling", async ({
  page,
}) => {
  await page.goto("./");
  await nav(page, "plan");
  let s = await data(page);
  const today = new Date().toLocaleDateString("en-CA");
  const meal = s.phase2.plans.find(
    (m) => m.date === today && m.category === "Dinner",
  );
  const original = structuredClone(meal);
  const card = page.locator(`#week-connected [data-plan-id="${meal.id}"]`);
  const beforeGrocery = await page
    .locator('[data-shop-id="salmon|g"] [data-shop="quantity"]')
    .inputValue();
  await card.locator('[data-p="edit-plan"]').click();
  await editor(page).locator('[name="you"]').fill("1.5");
  await page.locator("#save-meal").click();
  await expect(
    page.locator('[data-shop-id="salmon|g"] [data-shop="quantity"]'),
  ).not.toHaveValue(beforeGrocery);
  await page.locator('[data-shop-id="salmon|g"] [data-shop="checked"]').check();
  await card.locator('[data-p="eat"]:not([data-profile])').click();
  await editor(page).locator('[data-field="quantity"]').first().fill("70");
  await page.locator("#save-meal").click();
  s = await data(page);
  expect(s.phase2.plans.find((m) => m.id === meal.id).components).toEqual(
    original.components,
  );
  expect(
    s.phase2.journal.find((m) => m.plannedId === meal.id).components[0]
      .quantity,
  ).toBe(70);
  await nav(page, "plan");
  await card.locator('[data-p="eat"]:not([data-profile])').click();
  await page.locator("#save-meal").click();
  expect(
    (await data(page)).phase2.journal.filter((m) => m.plannedId === meal.id),
  ).toHaveLength(1);
  await nav(page, "plan");
  await expect(
    page.locator('[data-shop-id="salmon|g"] [data-shop="checked"]'),
  ).toBeChecked();
  await page.locator('#week-connected [data-p="add-plan"]').first().click();
  await page.locator("#recipe-picker").selectOption("fajita");
  await expect(page.locator("#editor-totals")).toContainText("Unknown kcal");
});
test("personal backup imports cannot read files; fictional export and demo reset remain isolated", async ({
  page,
}) => {
  await page.goto("./");
  await nav(page, "progress");
  await expect(page.locator("#import")).toBeDisabled();
  const before = await data(page);
  const read = await page.evaluate(() => {
    const input = document.getElementById("import");
    window.__backupRead = false;
    const fake = {
      text() {
        window.__backupRead = true;
        return Promise.resolve('{"selected":[],"logs":[]}');
      },
    };
    Object.defineProperty(input, "files", { value: [fake] });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return window.__backupRead;
  }); // App handler rejects the event without reading the file.
  expect(read).toBe(false);
  await expect(page.locator("#privacy-status")).toContainText("disabled");
  expect(await data(page)).toEqual(before);
  const promise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await promise;
  expect(download.suggestedFilename()).toContain("demo");
  const fs = require("node:fs");
  const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  expect(exported.phase2.profiles.you.name).toBe("Rowan Demo");
  page.once("dialog", (d) => d.accept());
  await page.locator("#reset-demo").click();
  await expect(page.locator(".demo-banner")).toBeVisible();
  expect((await data(page)).phase2.profiles.wife.name).toBe("Casey Demo");
});
test("offline reload, fictional journal persistence, touch and tablet layout", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await nav(page, "journal");
  await page.locator('#journal-connected [data-p="quick-log"]').click();
  await editor(page).locator('[name="name"]').fill("Fictional offline snack");
  await editor(page).locator('[data-field="name"]').fill("Demo food");
  await editor(page).locator('[data-field="quantity"]').fill("1");
  await page.locator("#save-meal").click();
  await page.reload();
  await nav(page, "journal");
  await expect(page.locator("#journal-connected")).toContainText(
    "Fictional offline snack",
  );
  for (const dest of ["home", "plan", "journal", "progress"]) {
    await nav(page, dest);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await context.setOffline(false);
});

test("separate browser origins preserve a synthetic production-storage canary through demo reset", async ({
  page,
  context,
}) => {
  await context.route("https://production-storage-canary.invalid/**", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Synthetic storage check</title>",
    }),
  );
  const canary = await context.newPage();
  await canary.goto("https://production-storage-canary.invalid/");
  await canary.evaluate(() =>
    localStorage.setItem("healthhub-v5", "synthetic-canary-not-health-data"),
  );
  await page.goto("./");
  page.once("dialog", (d) => d.accept());
  await page.locator("#reset-demo").click();
  await expect(page.locator(".demo-banner")).toBeVisible();
  expect(
    await canary.evaluate(() => localStorage.getItem("healthhub-v5")),
  ).toBe("synthetic-canary-not-health-data");
  expect(
    await page.evaluate(() => localStorage.getItem("healthhub-v5")),
  ).toBeNull();
  await canary.close();
});
test('requested restaurant profiles disclose missing verified menus without fabricating food cards',async({page})=>{
  await page.goto('./');await nav(page,'journal');
  for (const name of ["Dunkin'","McDonald's",'Fixins Soul Kitchen','Sexy Steak','Campestre Chicken']) {
    await page.locator('#journal-connected [data-p=restaurant]').click();
    await page.locator('#restaurant-search-form [name=name]').fill(name);
    await page.locator('#restaurant-browser').getByRole('button',{name:'Search saved restaurants',exact:true}).click();
    await page.locator('#restaurant-browser').getByRole('button',{name:'Explore '+name,exact:true}).click();
    await expect(page.locator('#restaurant-catalog')).toContainText('No source-verified menu');
    await expect(page.locator('#restaurant-catalog .catalog-menu-item')).toHaveCount(0);
    await expect(page.locator('#restaurant-catalog [data-catalog=suggestion]')).toHaveCount(0);
    await page.locator('#restaurant-browser').getByRole('button',{name:'Close',exact:true}).click();
  }
  expect(await page.evaluate(()=>HHRestaurantCatalogData.sources.length)).toBe(0);
});
test('manual unknown custom orders remain local and profile-specific in the demo',async({page})=>{
  await page.goto('./');await nav(page,'journal');await page.locator('#journal-connected [data-p=restaurant]').click();await page.locator('#restaurant-browser').getByRole('button',{name:"Explore Dunkin'",exact:true}).click();
  const c=page.locator('#restaurant-catalog');await c.locator('[data-catalog=profile]').selectOption('wife');await c.locator('[data-catalog=custom] [name=name]').fill('Fictional custom item — not a published menu item');await c.getByRole('button',{name:'Add custom component',exact:true}).click();await expect(c.locator('[data-catalog=totals]')).toContainText('unknown');
  await c.getByRole('button',{name:'Review order before logging'}).click();await expect(editor(page).locator('[name=profile]')).toHaveValue('wife');await page.locator('#save-meal').click();await page.reload();
  const s=await data(page);expect(s.phase2.journal.find(x=>x.name==="Dunkin' custom order").components[0].nutrients.kcal).toBeNull();expect(s.phase2.journal.find(x=>x.name==="Dunkin' custom order").profile).toBe('wife');expect(await page.locator('#import').isDisabled()).toBe(true);
});
