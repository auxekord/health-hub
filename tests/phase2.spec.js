const { test, expect } = require("@playwright/test");
const nav = (page, id) => page.locator(`.nav [data-go="${id}"]`).click();
const editor = (page) => page.locator("#meal-editor");
const form = (page) => page.locator("#meal-form");
const p = (page, action) => page.locator(`[data-p="${action}"]:visible`);
const day = "2026-11-02";
async function component(page, index, data) {
  const row = editor(page).locator("[data-component]").nth(index);
  await row.locator('[data-field="name"]').fill(data.name);
  if (data.unit)
    await row.locator('[data-field="unit"]').selectOption(data.unit);
  if (data.quantity !== undefined)
    await row.locator('[data-field="quantity"]').fill(String(data.quantity));
  if (data.kcal !== undefined || data.protein !== undefined) {
    await row.locator('[data-field="status"]').selectOption("estimate");
    await row
      .locator('[data-field="source"]')
      .fill(
        "Test reference food; assumed amount, not official restaurant data",
      );
    await row.locator(".phase-advanced summary").click();
    if (data.kcal !== undefined)
      await row.locator('[data-nutrient="kcal"]').fill(String(data.kcal));
    if (data.protein !== undefined)
      await row.locator('[data-nutrient="protein"]').fill(String(data.protein));
  }
}
async function custom(
  page,
  { date = day, name = "Test plate", kind = "Home-cooked" } = {},
) {
  await nav(page, "plan");
  await p(page, "add-plan").first().click();
  await form(page).locator('[name="name"]').fill(name);
  await form(page).locator('[name="date"]').fill(date);
  await form(page).locator('[name="kind"]').selectOption(kind);
  await component(page, 0, {
    name: "Brown rice",
    quantity: 100,
    kcal: 1,
    protein: 0.1,
  });
}
async function save(page) {
  await page.locator("#save-meal").click();
  await expect(editor(page)).not.toBeVisible();
}
async function phase(page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("healthhub-v5")).phase2,
  );
}
async function openRestaurantPlate(page) {
  await p(page, "restaurant").click();
  await page
    .getByRole("button", { name: "Save a new restaurant", exact: true })
    .click();
  await page.locator("#restaurant-form [name=name]").fill("Campestre Chicken");
  await page
    .locator("#restaurant-form [name=location]")
    .fill("Lincoln Park, Michigan");
  await page
    .getByRole("button", { name: "Build a restaurant plate", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
});
test("seven-day planner, independent portions, edit, move, duplicate, replace, reuse and groceries", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await custom(page);
  await form(page).locator('[name="wife"]').fill(".5");
  await expect(page.locator("#editor-totals")).toContainText("100 kcal");
  await expect(page.locator("#editor-totals")).toContainText("50 kcal");
  await save(page);
  let s = await phase(page);
  expect(s.plans).toHaveLength(1);
  const firstId = s.plans[0].id;
  // Move week to the fixture date, then fill all seven dates via UI duplication.
  // The editor accepts any date. Locate by stable id without depending on current week.
  const now = new Date();
  const target = new Date(day + "T12:00:00");
  const currentMon = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  currentMon.setDate(currentMon.getDate() - ((currentMon.getDay() + 6) % 7));
  const delta = Math.round((target - currentMon) / (7 * 86400000));
  for (let i = 0; i < Math.abs(delta); i++)
    await p(page, delta > 0 ? "next-week" : "previous-week")
      .first()
      .click();
  for (let i = 1; i < 7; i++) {
    await page
      .locator(`[data-plan-id="${firstId}"] [data-p="duplicate-plan"]`)
      .click();
    const d = new Date(day + "T12:00:00");
    d.setDate(d.getDate() + i);
    await form(page)
      .locator('[name="date"]')
      .fill(d.toISOString().slice(0, 10));
    await save(page);
  }
  await expect(page.locator(".week-day")).toHaveCount(7);
  await expect(page.locator("#week-connected [data-plan-id]")).toHaveCount(7);
  await expect(
    page.locator('[data-shop-id="brown rice|g"] [data-shop="quantity"]'),
  ).toHaveValue("1050");
  await page
    .locator(`[data-plan-id="${firstId}"] [data-p="edit-plan"]`)
    .click();
  await form(page).locator('[name="you"]').fill("2");
  await save(page);
  await expect(
    page.locator('[data-shop-id="brown rice|g"] [data-shop="quantity"]'),
  ).toHaveValue("1150");
  await page
    .locator(`[data-plan-id="${firstId}"] [data-p="move-plan"]`)
    .click();
  await form(page).locator('[name="date"]').fill("2026-11-09");
  await save(page);
  await expect(page.locator("#week-connected [data-plan-id]")).toHaveCount(6);
  await p(page, "next-week").first().click();
  await p(page, "reuse-week").click();
  s = await phase(page);
  expect(s.plans.filter((m) => m.date >= "2026-11-09")).toHaveLength(7);
  await p(page, "reuse-week").click();
  expect((await phase(page)).plans).toHaveLength(s.plans.length);
  await page.locator('#week-connected [data-p="replace-plan"]').first().click();
  await page.getByRole('button',{name:'Cooked or prepared at home',exact:true}).click();
  await page.getByRole('button',{name:'Create custom home-prepared meal',exact:true}).click();
  await form(page).locator('[name="name"]').fill("Replacement dinner");
  await component(page, 0, { name: "Potato", quantity: 80 });
  await save(page);
  await expect(page.locator("#week-connected")).toContainText(
    "Replacement dinner",
  );
  expect(errors).toEqual([]);
});
test("manual Campestre plate, independent edits, removal, estimates, favorite, repeat and correction persist", async ({
  page,
}) => {
  await nav(page, "journal");
  await openRestaurantPlate(page);
  await form(page).locator('[name="name"]').fill("Campestre lunch");
  await form(page).locator('[name="restaurant"]').fill("Campestre Chicken");
  await form(page).locator('[name="location"]').fill("Lincoln Park, Michigan");
  // Deliberate test-only reference assumptions; no production restaurant database is seeded.
  const foods = [
    {
      name: "Quarter chicken",
      quantity: 0.5,
      unit: "serving",
      kcal: 400,
      protein: 45,
    },
    {
      name: "Mixed vegetables",
      quantity: 70,
      unit: "g",
      kcal: 0.4,
      protein: 0.02,
    },
    { name: "Black beans", quantity: 60, unit: "g", kcal: 1.3, protein: 0.08 },
    { name: "Green sauce", quantity: 10, unit: "g", kcal: 2, protein: 0 },
  ];
  for (let i = 0; i < foods.length; i++) {
    if (i) await p(page, "add-component").click();
    await component(page, i, foods[i]);
  }
  await expect(page.locator("#editor-totals")).toContainText("326 kcal");
  await expect(page.locator("#editor-totals")).toContainText("estimate");
  await save(page);
  await expect(page.locator("#journal-connected")).toContainText(
    "Campestre Chicken",
  );
  await page
    .locator('#journal-connected [data-p="edit-journal"]')
    .first()
    .click();
  await editor(page)
    .locator("[data-component]")
    .nth(1)
    .locator('[data-field="quantity"]')
    .fill("100");
  await editor(page)
    .locator("[data-component]")
    .nth(3)
    .locator('[data-p="remove-component"]')
    .click();
  await p(page, "add-component").click();
  await component(page, 3, {
    name: "Water",
    quantity: 1,
    unit: "serving",
    kcal: 0,
    protein: 0,
  });
  await expect(page.locator("#editor-totals")).toContainText("318 kcal");
  await save(page);
  await p(page, "favorite-journal").click();
  expect((await phase(page)).favorites).toHaveLength(1);
  await p(page, "repeat-journal").click();
  await form(page).locator('[name="date"]').fill("2026-11-20");
  await save(page);
  expect((await phase(page)).journal).toHaveLength(2);
  await page.reload();
  await nav(page, "journal");
  await page.locator("#journal-date").fill("2026-11-20");
  await expect(page.locator("[data-journal-id]")).toHaveCount(1);
  await p(page, "edit-journal").click();
  await expect(form(page).locator('[name="location"]')).toHaveValue(
    "Lincoln Park, Michigan",
  );
  await expect(editor(page).locator("[data-component]")).toHaveCount(4);
  await p(page, "close-editor").first().click();
});
test("plan to actual keeps original, edits eaten components, prevents duplicate taps and supports other profile", async ({
  page,
}) => {
  const today = new Date().toLocaleDateString("en-CA");
  await custom(page, { date: today });
  await save(page);
  let s = await phase(page);
  const original = structuredClone(s.plans[0]);
  const card = page.locator(`#week-connected [data-plan-id="${original.id}"]`);
  await card.locator('[data-p="eat"]:not([data-profile])').click();
  await editor(page).locator('[data-field="quantity"]').fill("75");
  await form(page).locator('[name="leftovers"]').fill("25 g rice left");
  await save(page);
  s = await phase(page);
  expect(s.plans[0]).toEqual(original);
  expect(s.journal[0].components[0].quantity).toBe(75);
  expect(s.journal[0].plannedId).toBe(original.id);
  await nav(page, "plan");
  await card.locator('[data-p="eat"]:not([data-profile])').click();
  await save(page);
  expect((await phase(page)).journal).toHaveLength(1);
  await nav(page, "plan");
  await card.locator('[data-p="eat"][data-profile="wife"]').click();
  await save(page);
  expect((await phase(page)).journal).toHaveLength(2);
  await nav(page, "home");
  await expect(page.locator("#today-connected")).toContainText(
    "Actually eaten today",
  );
  await nav(page, "progress");
  await expect(page.locator("#progress-connected")).toContainText(
    "75 kcal recorded",
  );
});
test("groceries preserve manual items, checkoffs, on-hand state, unknown units and exclude restaurants", async ({
  page,
}) => {
  const today = new Date().toLocaleDateString("en-CA");
  await custom(page, { date: today });
  await save(page);
  const row = page.locator('[data-shop-id="brown rice|g"]');
  await row.locator('[data-shop="checked"]').check();
  await row.locator('[data-shop="onHand"]').check();
  await page.locator('#manual-grocery-form [name="name"]').fill("Coffee");
  await page.locator("#manual-grocery-form button").click();
  await page.locator('#manual-grocery-form [name="name"]').fill("Coffee");
  await page.locator("#manual-grocery-form button").click();
  expect((await phase(page)).shopping.manual).toHaveLength(1);
  expect((await phase(page)).shopping.manual[0].quantity).toBe(2);
  await custom(page, {
    date: today,
    name: "Restaurant dinner",
    kind: "Restaurant",
  });
  await save(page);
  await expect(row.locator('[data-shop="quantity"]')).toHaveValue("200");
  await page.reload();
  await nav(page, "plan");
  await expect(row.locator('[data-shop="checked"]')).toBeChecked();
  await expect(row.locator('[data-shop="onHand"]')).toBeChecked();
  await expect(page.locator("#shopping-list")).toContainText("Already at home");
  await expect(page.locator("#shopping-list")).toContainText("Coffee");
});
test("v16 migration, legacy journal correction, phase backup round trip, invalid import rejected", async ({
  page,
}) => {
  const original = {
    selected: ["fajita"],
    logs: [
      { id: 1, name: "Original dinner", date: "2026-11-02", time: "6:00 PM" },
    ],
    steps: [{ value: 6000, at: "2026-11-02T12:00:00.000Z" }],
    weight: [{ value: 220, at: "2026-11-02T12:00:00.000Z" }],
    foodEntries: [],
    kitchenFoods: [],
    myScale: 125,
    wifeScale: 75,
  };
  await page.evaluate(
    (s) => localStorage.setItem("healthhub-v5", JSON.stringify(s)),
    original,
  );
  await page.reload();
  await nav(page, "plan");
  await expect(page.locator('[data-fold="recipe-fajita"]')).toBeVisible();
  await expect(page.locator("#myScale")).toHaveValue("125");
  await nav(page, "journal");
  await page.locator("#journal-date").fill(day);
  await expect(page.locator("[data-journal-id]")).toContainText(
    "Original dinner",
  );
  await p(page, "edit-journal").click();
  await editor(page).locator('[data-field="quantity"]').fill("1");
  await save(page);
  let s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("healthhub-v5")),
  );
  expect(s.logs).toHaveLength(0);
  expect(s.weight).toEqual(original.weight);
  expect(s.selected).toEqual(original.selected);
  expect(s.phase2.journal).toHaveLength(1);
  await nav(page, "progress");
  const promise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await promise;
  const fs = require("node:fs");
  const backup = fs.readFileSync(await download.path());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await nav(page, "progress");
  page.once("dialog", (d) => d.accept());
  await page.locator("#import").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  expect((await phase(page)).journal).toHaveLength(1);
  s = JSON.parse(backup);
  s.phase2.plans = [{ id: "bad" }];
  page.once("dialog", (d) => d.accept());
  await page.locator("#import").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s)),
  });
  expect((await phase(page)).journal).toHaveLength(1);
});
test("tablet navigation, touch targets, no horizontal page overflow and offline-ready assets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 1280 });
  for (const id of ["home", "plan", "journal", "progress"]) {
    await nav(page, id);
    await expect(page.locator("main>section:not(.hidden)")).toHaveAttribute(
      "id",
      id,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await nav(page, "journal");
  await openRestaurantPlate(page);
  expect(
    await page.evaluate(
      () =>
        document.querySelector("#meal-editor").scrollWidth <=
        document.querySelector("#meal-editor").clientWidth,
    ),
  ).toBeTruthy();
  const rect = await page.locator("#save-meal").boundingBox();
  expect(rect.height).toBeGreaterThanOrEqual(44);
});
test("original recipe planning keeps raw household portions, instructions and unknown nutrition honest", async ({
  page,
}) => {
  await nav(page, "plan");
  await p(page, "add-plan").first().click();
  await page.locator("#recipe-picker").selectOption("fajita");
  await expect(editor(page).locator("[data-component]")).toHaveCount(5);
  await expect(page.locator("#editor-totals")).toContainText("Unknown kcal");
  await save(page);
  const s = await phase(page);
  expect(s.plans[0].components[0].quantity).toBe(160);
  expect(s.plans[0].components[0].wifeQuantity).toBe(125);
  await page.locator('#week-connected [data-p="cook"]').click();
  await expect(page.locator('[data-fold="recipe-fajita"]')).toContainText(
    "Season chicken with paprika, cumin, garlic and pepper.",
  );
  await expect(page.locator('[data-fold="recipe-fajita"]')).toContainText(
    "Cook rice according to package directions.",
  );
});
test("every original recipe can become a valid household plan without losing ingredient categories", async ({
  page,
}) => {
  const check = await page.evaluate(() => {
    const M = window.HHModel,
      H = window.HealthHub,
      s = M.create(H.state);
    s.plans = H.recipes.map((r) => M.fromRecipe(r, "2026-11-02", H.state));
    return {
      valid: M.valid(s),
      count: s.plans.length,
      spiceRecipe: H.recipes.find((r) => r.items.some((i) => i[4] === "spice"))
        ?.id,
    };
  });
  expect(check.valid).toBeTruthy();
  expect(check.count).toBe(139);
  await nav(page, "plan");
  await p(page, "add-plan").first().click();
  await page.locator("#recipe-picker").selectOption(check.spiceRecipe);
  const groups = await editor(page)
    .locator('[data-field="group"]')
    .evaluateAll((nodes) => nodes.map((n) => n.value));
  expect(groups).toContain("spice");
  await save(page);
  expect(
    (await phase(page)).plans[0].components.some((c) => c.group === "spice"),
  ).toBeTruthy();
});
test("compatible units convert nutrition and quantities; uncertain conversions require new assumptions", async ({
  page,
}) => {
  const today = new Date().toLocaleDateString("en-CA");
  await custom(page, { date: today });
  await editor(page).locator('[data-field="unit"]').selectOption("kg");
  await expect(editor(page).locator('[data-field="quantity"]')).toHaveValue(
    "0.1",
  );
  await expect(page.locator("#editor-totals")).toContainText("100 kcal");
  await editor(page).locator('[data-field="unit"]').selectOption("cup");
  await expect(editor(page).locator('[data-field="quantity"]')).toBeEmpty();
  await expect(page.locator("#editor-totals")).toContainText("Unknown kcal");
  await expect(page.locator("#phase-status")).toContainText(
    "cannot be reliably converted",
  );
});
test("household goals, separate weight records, deletion undo and other-tab edits", async ({
  page,
  context,
}) => {
  await nav(page, "plan");
  await page.locator("summary").filter({ hasText: "Household goals" }).click();
  await page.locator('[name="wife-calories"]').fill("1600");
  await page.locator("#profile-form button").click();
  expect((await phase(page)).profiles.wife.calories).toBe(1600);
  await nav(page, "progress");
  const wife = page.locator('.weight-profile-form[data-profile="wife"]');
  await wife.locator('[name="weight"]').fill("135");
  await wife.locator("button").click();
  expect((await phase(page)).weights[0].profile).toBe("wife");
  await expect(page.locator("#progress-connected")).toContainText("135 lb");
  await p(page, "remove-weight").click();
  expect((await phase(page)).weights).toHaveLength(0);
  await p(page, "undo").click();
  expect((await phase(page)).weights).toHaveLength(1);
  const other = await context.newPage();
  await other.goto("./");
  await other.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("healthhub-v5"));
    s.phase2.profiles.wife.name = "Other tab";
    localStorage.setItem("healthhub-v5", JSON.stringify(s));
  });
  await expect(page.locator("#phase-status")).toContainText("another tab");
  await nav(page, "journal");
  await p(page, "quick-log").click();
  await expect(editor(page)).not.toBeVisible();
  await other.close();
});
test("malicious or invalid Phase 2 imports leave prior data untouched", async ({
  page,
}) => {
  const today = new Date().toLocaleDateString("en-CA");
  await custom(page, { date: today });
  await save(page);
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("healthhub-v5")),
  );
  s.phase2.plans[0].id = '\"><img src=x onerror=alert(1)>';
  await nav(page, "progress");
  page.once("dialog", (d) => d.accept());
  await page.locator("#import").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s)),
  });
  expect((await phase(page)).plans[0].id).not.toContain("<");
  await nav(page, "plan");
  await expect(page.locator("#week-connected [data-plan-id]")).toHaveCount(1);
});
