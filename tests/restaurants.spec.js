const { test, expect } = require("@playwright/test");
const nav = (p, id) => p.locator(`.nav [data-go="${id}"]`).click();
const browser = (p) => p.locator("#restaurant-browser");
const meal = (p) => p.locator("#meal-editor");
async function find(p, mode = "journal") {
  await nav(p, mode === "plan" ? "plan" : "journal");
  await p
    .locator(
      mode === "plan"
        ? '#week-connected [data-p="browse-plan-restaurants"]'
        : '#journal-connected [data-p="restaurant"]',
    )
    .click();
}
async function restaurant(
  p,
  {
    name = "Campestre Chicken",
    city = "Lincoln Park, Michigan",
    menu = "",
    website = "",
  } = {},
) {
  await find(p);
  await browser(p)
    .getByRole("button", { name: "Save a new restaurant", exact: true })
    .click();
  await p.locator("#restaurant-form [name=name]").fill(name);
  await p.locator("#restaurant-form [name=location]").fill(city);
  if (menu) await p.locator("#restaurant-form [name=menuUrl]").fill(menu);
  if (website) await p.locator("#restaurant-form [name=website]").fill(website);
  await p.locator("#restaurant-form button[type=submit]").click();
}
async function plate(p) {
  await browser(p)
    .getByRole("button", { name: "Build a restaurant plate", exact: true })
    .click();
  await meal(p).locator("[name=name]").fill("Fictional Campestre workflow");
  const names = [
    "Quarter chicken",
    "Mixed vegetables",
    "Black beans",
    "Green sauce",
  ];
  for (let i = 0; i < 4; i++) {
    if (i) await meal(p).locator("[data-p=add-component]").click();
    const row = meal(p).locator("[data-component]").nth(i);
    await row.locator("[data-field=name]").fill(names[i]);
  }
}
const state = (p) =>
  p.evaluate(() => JSON.parse(localStorage.getItem("healthhub-v5")));
async function save(p) {
  await p.locator("#save-meal").click();
  await expect(meal(p)).not.toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.goto("./");
});
test("local restaurant creation, search, reuse, missing menu, metadata and external link privacy", async ({
  page,
  context,
}) => {
  await restaurant(page);
  await expect(browser(page)).toContainText("Menu information unavailable");
  await browser(page)
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await find(page);
  await page.locator("#restaurant-search-form [name=name]").fill("campestre");
  await page.locator("#restaurant-search-form [name=city]").fill("lincoln");
  await page.locator("#restaurant-search-form button").click();
  await expect(page.locator("#restaurant-results")).toContainText(
    "Campestre Chicken",
  );
  await page.locator("#restaurant-results button").click();
  await page
    .locator("#restaurant-form [name=menuUrl]")
    .fill("https://menu.example.org/campestre-demo");
  await page.locator("#restaurant-form [name=checked]").check();
  await page.locator("#restaurant-form button[type=submit]").click();
  const link = browser(page).getByRole("link", { name: "Open saved menu" });
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAttribute("target", "_blank");
  await context.route("https://menu.example.org/**", (r) =>
    r.fulfill({ body: "Fictional menu target", contentType: "text/html" }),
  );
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  await popup.close();
  const s = await state(page);
  expect(s.phase2.restaurants).toHaveLength(1);
  expect(s.phase2.restaurants[0].provider).toBe("local");
  expect(s.phase2.restaurants[0].placeId).toBeNull();
  expect(s.phase2.restaurants[0].lastChecked).toBeTruthy();
  await page.reload();
  await find(page);
  await expect(page.locator("#restaurant-results")).toContainText(
    "Campestre Chicken",
  );
});
test("unsafe links and malformed imported restaurant IDs are rejected without changing records", async ({
  page,
}) => {
  await restaurant(page);
  const before = await state(page);
  for (const url of [
    "javascript:alert(1)",
    "http://menu.example.org/",
    "https://user:pass@menu.example.org/",
  ]) {
    await page.locator("#restaurant-form [name=menuUrl]").fill(url);
    await page.locator("#restaurant-form button[type=submit]").click();
    expect((await state(page)).phase2.restaurants).toEqual(
      before.phase2.restaurants,
    );
  }
  await browser(page)
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await nav(page, "progress");
  const malicious = structuredClone(before);
  malicious.phase2.restaurants[0].id = '"><svg onload=alert(1)>';
  page.once("dialog", (d) => d.accept());
  await page.locator("#import").setInputFiles({
    name: "fictional-malicious.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(malicious)),
  });
  expect((await state(page)).phase2.restaurants).toEqual(
    before.phase2.restaurants,
  );
});
test("Campestre components, serving basis and actual fractions calculate partial estimates; repeat preserves original", async ({
  page,
}) => {
  await restaurant(page);
  await plate(page);
  const rows = meal(page).locator("[data-component]");
  for (let i = 0; i < 4; i++) {
    await rows
      .nth(i)
      .locator("[data-field=quantity]")
      .fill(String([1, 100, 80, 15][i]));
    await rows
      .nth(i)
      .locator("[data-field=consumedPercent]")
      .fill(String([100, 75, 50, 20][i]));
  }
  const chicken = rows.nth(0);
  await chicken.locator("[data-field=status]").selectOption("estimate");
  await chicken
    .locator("[data-field=source]")
    .fill("Fictional test reference; not official restaurant data");
  await chicken.locator(".phase-advanced summary").click();
  await chicken.locator("[data-nutrient=kcal]").fill("300");
  await chicken.locator("[data-nutrient=protein]").fill("30");
  await expect(page.locator("#editor-totals")).toContainText("partial");
  const beans = rows.nth(2);
  await beans.locator("[data-field=status]").selectOption("estimate");
  await beans.locator("[data-field=source]").fill("Fictional test reference");
  await beans.locator(".phase-advanced summary").click();
  await beans.locator("[data-field=nutritionBasis]").fill("100");
  await beans.locator("[data-nutrient=kcal]").fill("120");
  await expect(page.locator("#editor-totals")).toContainText("348 kcal");
  await save(page);
  let s = await state(page);
  const original = structuredClone(s.phase2.journal[0]);
  expect(original.components.map((c) => c.consumedFraction ?? 1)).toEqual([
    1, 0.75, 0.5, 0.2,
  ]);
  await page.locator("#journal-connected [data-p=favorite-journal]").click();
  await page.locator("#journal-connected [data-p=edit-journal]").click();
  await meal(page)
    .locator("[data-component]")
    .nth(3)
    .locator("[data-p=remove-component]")
    .click();
  await meal(page).locator("[data-p=add-component]").click();
  await meal(page)
    .locator("[data-component]")
    .last()
    .locator("[data-field=name]")
    .fill("Fictional extra side");
  await save(page);
  await page.locator("#journal-connected [data-p=repeat-journal]").click();
  await meal(page).locator("[name=date]").fill("2027-03-04");
  await save(page);
  s = await state(page);
  expect(s.phase2.journal).toHaveLength(2);
  expect(s.phase2.journal[0].id).toBe(original.id);
  expect(s.phase2.journal[1].id).not.toBe(original.id);
  await page.reload();
  await nav(page, "journal");
  await page.locator("#journal-date").fill("2027-03-04");
  await expect(page.locator("#journal-connected")).toContainText(
    "Fictional extra side",
  );
});
test("restaurant plans remain uneaten, separate household logs do not overwrite, and groceries require explicit home conversion", async ({
  page,
}) => {
  await restaurant(page);
  await browser(page)
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await find(page, "plan");
  await page.locator("#restaurant-results button").click();
  await browser(page)
    .getByRole("button", {
      name: "Build a planned restaurant plate",
      exact: true,
    })
    .click();
  const today = new Date().toLocaleDateString("en-CA");
  await meal(page).locator("[name=date]").fill(today);
  await meal(page).locator("[data-field=name]").fill("Mixed vegetables");
  await meal(page).locator("[data-field=quantity]").fill("100");
  await meal(page).locator("[name=wife]").fill(".5");
  await save(page);
  let s = await state(page);
  expect(s.phase2.journal).toHaveLength(0);
  await expect(page.locator("#shopping-list [data-shop-id]")).toHaveCount(0);
  const card = page.locator("#week-connected [data-plan-id]");
  await card.locator("[data-p=eat]:not([data-profile])").click();
  await meal(page).locator("[data-field=quantity]").fill("70");
  await save(page);
  await nav(page, "plan");
  await card.locator("[data-p=eat][data-profile=wife]").click();
  await expect(meal(page).locator("[data-field=quantity]")).toHaveValue("50");
  await save(page);
  s = await state(page);
  expect(s.phase2.journal).toHaveLength(2);
  expect(
    s.phase2.journal.find((m) => m.profile === "you").components[0].quantity,
  ).toBe(70);
  expect(
    s.phase2.journal.find((m) => m.profile === "wife").components[0].quantity,
  ).toBe(50);
  await nav(page, "plan");
  await card.locator("[data-p=eat][data-profile=wife]").click();
  await save(page);
  expect((await state(page)).phase2.journal).toHaveLength(2);
  await nav(page, "plan");
  await card.locator("[data-p=edit-plan]").click();
  await meal(page).locator("[name=kind]").selectOption("Home-cooked");
  await save(page);
  await expect(page.locator("#shopping-list [data-shop-id]")).toHaveCount(1);
});
test("local adapter supports no-results, errors and offline; external search is an explicit link, not a provider result", async ({
  page,
  context,
}) => {
  await find(page);
  await expect(browser(page)).toContainText("No saved matches");
  await page
    .locator("#restaurant-search-form [name=name]")
    .fill("Campestre Chicken");
  await page
    .locator("#restaurant-search-form [name=city]")
    .fill("Lincoln Park, Michigan");
  await browser(page)
    .getByRole("button", { name: "Open external map search", exact: true })
    .click();
  const link = browser(page).getByRole("link", {
    name: "Open map search in a new tab",
  });
  const u = new URL(await link.getAttribute("href"));
  expect(u.searchParams.get("query")).toBe(
    "Campestre Chicken Lincoln Park, Michigan",
  );
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await page.evaluate(() => {
    window.HHRestaurantAdapter.search = async () => {
      throw Error("Synthetic local adapter failure");
    };
  });
  await page.locator("#restaurant-search-form button").click();
  await expect(browser(page)).toContainText("search unavailable");
  await browser(page)
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.reload();
  await context.setOffline(true);
  await find(page);
  await expect(browser(page)).toContainText("Offline");
  await browser(page)
    .getByRole("button", { name: "Save a new restaurant", exact: true })
    .click();
  await page
    .locator("#restaurant-form [name=name]")
    .fill("Fictional offline restaurant");
  await browser(page)
    .getByRole("button", { name: "Build a restaurant plate", exact: true })
    .click();
  await meal(page).locator("[data-field=name]").fill("Fictional offline food");
  await save(page);
  await expect(page.locator("#journal-connected")).toContainText(
    "Fictional offline restaurant",
  );
  await context.setOffline(false);
});
test("new production state is neutral, Phase 2 malformed records lock writes, and no direct store bypass occurs", async ({
  page,
}) => {
  const goals = await page.evaluate(
    () => window.HealthHub.state.phase2.profiles,
  );
  expect(goals.you.calories).toBeNull();
  expect(goals.wife.protein).toBeNull();
  await restaurant(page);
  const s = await state(page);
  s.phase2.plans = [{ id: "malformed" }];
  const raw = JSON.stringify(s);
  await page.evaluate((v) => localStorage.setItem("healthhub-v5", v), raw);
  await page.reload();
  await expect(page.locator("#storage-warning")).toBeVisible();
  await nav(page, "journal");
  await page.locator("#journal-connected [data-p=restaurant]").click();
  await expect(browser(page)).not.toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("healthhub-v5"))).toBe(
    raw,
  );
});

test("new restaurants never replace one another and saved favorites can be reused through local discovery", async ({
  page,
}) => {
  await restaurant(page, {
    name: "First fictional restaurant",
    city: "Example City",
  });
  await browser(page)
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await restaurant(page, {
    name: "Second fictional restaurant",
    city: "Example City",
  });
  let s = await state(page);
  expect(s.phase2.restaurants).toHaveLength(2);
  expect(new Set(s.phase2.restaurants.map((r) => r.id)).size).toBe(2);
  await browser(page)
    .getByRole("button", { name: "Build a restaurant plate", exact: true })
    .click();
  await meal(page).locator("[data-field=name]").fill("Fictional plate food");
  await save(page);
  await page.locator("#journal-connected [data-p=favorite-journal]").click();
  await find(page);
  await page
    .locator("#restaurant-results article")
    .filter({ hasText: "Second fictional restaurant" })
    .getByRole("button", { name: "Open restaurant" })
    .click();
  await expect(browser(page)).toContainText("Favorite plate");
  await browser(page)
    .locator("article")
    .filter({ hasText: "Favorite plate" })
    .getByRole("button", { name: "Repeat and adjust plate" })
    .click();
  await meal(page).locator("[name=date]").fill("2027-05-10");
  await save(page);
  s = await state(page);
  expect(s.phase2.journal).toHaveLength(2);
  expect(s.phase2.restaurants).toHaveLength(2);
});
test("Phase 2 backup merge preserves both old and new meal histories, restaurant records and explicit profile goals", async ({
  page,
}) => {
  await restaurant(page);
  await browser(page)
    .getByRole("button", { name: "Build a restaurant plate", exact: true })
    .click();
  await meal(page)
    .locator("[data-field=name]")
    .fill("Fictional plate component");
  await save(page);
  const original = await state(page),
    incoming = structuredClone(original);
  incoming.phase2.journal[0].id = crypto.randomUUID();
  incoming.phase2.journal[0].name = "Additional fictional plate";
  incoming.phase2.profiles.you.calories = 1234;
  await nav(page, "progress");
  page.once("dialog", (d) => d.accept());
  await page.locator("#import").setInputFiles({
    name: "fictional-phase2-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await expect(page.locator("#privacy-status")).toContainText("Backup applied");
  await expect(page.locator("#import")).toHaveValue("");
  const merged = await state(page);
  expect(merged.phase2.journal).toHaveLength(2);
  expect(merged.phase2.profiles).toEqual(original.phase2.profiles);
  expect(merged.phase2.restaurants).toHaveLength(1);
  await page.reload();
  await nav(page, "journal");
  await expect(
    page.locator("#journal-connected [data-journal-id]"),
  ).toHaveCount(2);
});

test("only home cooking or explicitly requested custom groceries contribute; restaurant components never do", async ({
  page,
}) => {
  await nav(page, "plan");
  await page.locator("#week-connected [data-p=add-plan]").first().click();
  await meal(page).locator("[name=name]").fill("Fictional custom plan");
  await meal(page).locator("[name=kind]").selectOption("Custom");
  await meal(page)
    .locator("[data-field=name]")
    .fill("Fictional grocery component");
  await meal(page).locator("[data-field=quantity]").fill("40");
  await save(page);
  await expect(page.locator("#shopping-list [data-shop-id]")).toHaveCount(0);
  await page.locator("#week-connected [data-p=edit-plan]").click();
  await meal(page).locator("[name=includeGroceries]").check();
  await save(page);
  await expect(page.locator("#shopping-list [data-shop-id]")).toHaveCount(1);
  await page.locator("#week-connected [data-p=edit-plan]").click();
  await meal(page).locator("[name=kind]").selectOption("Restaurant");
  await save(page);
  await expect(page.locator("#shopping-list [data-shop-id]")).toHaveCount(0);
});

test("label-basis entry needs no manual division and invalid basis never produces infinite nutrition or a saved record", async ({
  page,
}) => {
  await nav(page, "journal");
  await page.locator("#journal-connected [data-p=quick-log]").click();
  await meal(page).locator("[name=name]").fill("Fictional label-basis meal");
  await meal(page)
    .locator("[data-field=name]")
    .fill("Fictional reference food");
  await meal(page).locator("[data-field=quantity]").fill("100");
  await meal(page).locator("[data-field=status]").selectOption("estimate");
  await meal(page)
    .locator("[data-field=source]")
    .fill("Fictional test label, not restaurant data");
  await meal(page).locator(".phase-advanced summary").click();
  await meal(page).locator("[data-field=nutritionBasis]").fill("100");
  await meal(page).locator("[data-nutrient=kcal]").fill("250");
  await expect(page.locator("#editor-totals")).toContainText("250 kcal");
  await expect(meal(page).locator(".phase-advanced summary")).toContainText(
    "100 g",
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("healthhub-v5"),
  );
  await meal(page).locator("[data-field=nutritionBasis]").fill("");
  await expect(page.locator("#editor-totals")).not.toContainText("Infinity");
  await page.locator("#save-meal").click();
  await expect(meal(page)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("healthhub-v5"))).toBe(
    before,
  );
});
