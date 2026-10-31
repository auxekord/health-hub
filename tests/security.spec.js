const { test, expect } = require("@playwright/test");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const KEY = "healthhub-v5";
// Entirely invented compatibility records, never copied from a personal backup.
function fixture() {
  return {
    selected: ["fajita"],
    logs: [
      {
        id: 101,
        name: "Fictional legacy plate",
        date: "2027-01-07",
        time: "12:30",
      },
    ],
    steps: [{ value: 5432, at: "2027-01-07T12:30:00.000Z" }],
    weight: [{ value: 213.7, at: "2027-01-07T12:30:00.000Z" }],
    myScale: 125,
    wifeScale: 75,
    done: { "fajita-prep-0": true },
    openCards: { "recipe-fajita": true },
    batchWeights: { "fajita|0": "310" },
    mealTypes: { fajita: "Lunch" },
    foodEntries: [
      {
        id: "fictional-food",
        name: "Fictional beans",
        date: "2027-01-07",
        myG: 80,
        wifeG: 55,
        kcal: null,
        protein: null,
        source: "Fictional test label",
      },
    ],
    kitchenFoods: [
      {
        id: "fictional-kitchen",
        name: "Fictional yogurt",
        myG: 95,
        wifeG: 65,
        kcal: 72,
        protein: 7,
        brand: "Invented pantry",
      },
    ],
    profileName: "Alex Fixture",
    goalWeight: 183,
    calorieTarget: 2375,
    proteinTarget: 116,
    wifeProfile: {
      name: "Blair Fixture",
      age: 61,
      heightCm: 171,
      weightLb: 157,
      calorieTarget: 1725,
      proteinTarget: 92,
      goal: "Fictional private goal",
      customNote: "Fictional retained field",
    },
    futureExtension: { notes: ["Fictional extension data"] },
  };
}
const nav = (page, id) => page.locator(`.nav [data-go="${id}"]`).click();
async function seed(page, value) {
  await page.goto("./");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: KEY,
    value: typeof value === "string" ? value : JSON.stringify(value),
  });
  await page.reload();
}
const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);
async function importJSON(page, value, { accept = true } = {}) {
  await nav(page, "progress");
  page.once("dialog", (d) => (accept ? d.accept() : d.dismiss()));
  await page.locator("#import").setInputFiles({
    name: "fictional-test.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      typeof value === "string" ? value : JSON.stringify(value),
    ),
  });
}
async function downloadText(page, button) {
  const promise = page.waitForEvent("download");
  await page.locator(button).click();
  const file = await promise;
  return fs.readFileSync(await file.path(), "utf8");
}
test("neutral new browser has no invented targets or medical/demographic defaults; recipes and styles unchanged", async ({
  page,
}) => {
  await page.goto("./");
  const state = await page.evaluate(() => window.HealthHubSafety.state);
  expect(state.calorieTarget).toBeNull();
  expect(state.proteinTarget).toBeNull();
  expect(state.goalWeight).toBeNull();
  expect(state.wifeProfile).toEqual({});
  await expect(page.locator("#latestWeight")).toHaveText("—");
  await expect(page.locator("#storage-warning")).toBeHidden();
  const old = execFileSync("git", ["show", "origin/main:index.html"], {
    encoding: "utf8",
  });
  const now = fs.readFileSync("index.html", "utf8");
  const recipe = /<script[^>]*id="recipes"[^>]*>([\s\S]*?)<\/script>/;
  const medical = old.match(/while using ([^<.]+)/)?.[1];
  expect(
    Boolean(medical && now.toLowerCase().includes(medical.toLowerCase())),
  ).toBe(false);
  expect(/heightCm|weightLb|age:/.test(now)).toBe(false);
  expect(now.match(recipe)[1] === old.match(recipe)[1]).toBe(true);
  expect(JSON.parse(now.match(recipe)[1]).length).toBe(139);
  expect(
    JSON.stringify(
      [...now.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((x) => x[1]),
    ) ===
      JSON.stringify(
        [...old.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((x) => x[1]),
      ),
  ).toBe(true);
});
test("valid legacy state preserves both profiles, records, IDs, optional and unknown fields across refresh and export", async ({
  page,
}) => {
  const original = fixture();
  await seed(page, original);
  await expect(page.locator("#storage-warning")).toBeHidden();
  await nav(page, "plan");
  await expect(page.locator('[data-fold="recipe-fajita"]')).toBeVisible();
  await expect(page.locator("#myScale")).toHaveValue("125");
  await nav(page, "progress");
  let current = JSON.parse(await stored(page));
  for (const k of [
    "logs",
    "steps",
    "weight",
    "wifeProfile",
    "foodEntries",
    "kitchenFoods",
    "futureExtension",
  ])
    expect(current[k]).toEqual(original[k]);
  const exported = JSON.parse(await downloadText(page, "#export"));
  expect(exported.wifeProfile).toEqual(original.wifeProfile);
  expect(exported.futureExtension).toEqual(original.futureExtension);
  await page.reload();
  current = JSON.parse(await stored(page));
  expect(current.wifeProfile).toEqual(original.wifeProfile);
  expect(current.logs).toEqual(original.logs);
});
test("malicious IDs, prototype keys, invalid shapes, duplicates and unsupported versions are rejected atomically", async ({
  page,
}) => {
  await seed(page, fixture());
  const before = await stored(page);
  const malicious = fixture();
  malicious.logs[0].id = '\"><img src=x onerror="window.__securityCanary=1">';
  const polluted =
    '{"selected":[],"logs":[],"__proto__":{"polluted":"synthetic"}}';
  const cases = [
    malicious,
    polluted,
    { selected: [], logs: [], steps: null },
    {
      selected: [],
      logs: [
        { id: 1, name: "Duplicate A", date: "2027-01-07", time: "12:00" },
        { id: "1", name: "Duplicate B", date: "2027-01-07", time: "12:01" },
      ],
    },
    { selected: [], logs: [], schemaVersion: 999 },
    { selected: [], logs: [], wifeProfile: { calorieTarget: "not a number" } },
    { selected: [], logs: [], batchWeights: { x: '\"><svg onload=alert(1)>' } },
  ];
  for (const value of cases) {
    await importJSON(page, value);
    expect(await stored(page)).toBe(before);
    expect(
      await page.evaluate(() => window.__securityCanary || {}.polluted || null),
    ).toBeNull();
  }
  await expect(page.locator("#history")).toContainText("5432");
});
test("legacy rendering remains inert even if validation is bypassed; record text and controls use safe DOM", async ({
  page,
}) => {
  await page.goto("./");
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.evaluate(() => {
    const H = window.HealthHubSafety;
    const state = H.state;
    state.logs = [
      {
        id: '\"><img src=security-probe onerror="window.__securityCanary=1">',
        name: '<svg onload="window.__securityCanary=2">Fictional title',
        date: new Date().toLocaleDateString("en-CA"),
        time: "<b>12:00</b>",
      },
    ];
    H.render();
  });
  await nav(page, "nutrition");
  await expect(page.locator("#foodLog button")).toHaveCount(1);
  await expect(page.locator("#foodLog")).toContainText("Fictional title");
  await expect(page.locator("#foodLog img,#foodLog svg")).toHaveCount(0);
  expect(await page.evaluate(() => window.__securityCanary || null)).toBeNull();
  expect(requests.some((x) => x.includes("security-probe"))).toBe(false);
  await page.locator("#foodLog button").click();
  await expect(page.locator("#foodLog")).toContainText("No meals logged yet");
});
test("invalid stored data is never overwritten; exact raw recovery and acknowledged restore are non-destructive", async ({
  page,
}) => {
  const raw =
    '{"selected":[],"logs":[{"name":"Fictional recoverable record"}],"notes":"Fictional original"}';
  await seed(page, raw);
  await expect(page.locator("#storage-warning")).toBeVisible();
  await nav(page, "nutrition");
  await expect(page.locator("[data-add]").first()).toBeDisabled();
  await nav(page, "progress");
  await expect(page.locator("#import")).toBeDisabled();
  await expect(page.locator("#stepsForm button")).toBeDisabled();
  expect(await stored(page)).toBe(raw);
  await page.evaluate(() => window.scrollTo(0, 1200));
  const warningBox = await page.locator("#storage-warning").boundingBox();
  expect(warningBox.y).toBeGreaterThanOrEqual(0);
  expect(warningBox.y).toBeLessThan(20);
  expect(await downloadText(page, "#download-recovery")).toBe(raw);
  expect(await downloadText(page, "#export")).toBe(raw);
  await page.reload();
  expect(await stored(page)).toBe(raw);
  await page.locator("#recovery-ack").check();
  await nav(page, "progress");
  await page.locator("#backup-mode").selectOption("restore");
  await importJSON(page, fixture());
  await expect(page.locator("#storage-warning")).toBeHidden();
  expect(JSON.parse(await stored(page)).logs).toEqual(fixture().logs);
});
test("merge keeps existing profiles and conflicts; restore replaces supplied sections only; repeat merge does not duplicate", async ({
  page,
}) => {
  await seed(page, fixture());
  const incoming = {
    selected: ["salmon"],
    logs: [
      {
        id: 101,
        name: "Conflicting fictional record",
        date: "2027-01-07",
        time: "12:00",
      },
      {
        id: "new-fictional",
        name: "Additional fictional plate",
        date: "2027-01-08",
        time: "12:00",
      },
    ],
    wifeProfile: { name: "New Fictional Alias", calorieTarget: 1815 },
    weight: [{ value: 209.6, at: "2027-01-08T12:00:00.000Z" }],
  };
  await importJSON(page, incoming);
  let s = JSON.parse(await stored(page));
  expect(s.logs).toHaveLength(2);
  expect(s.logs[0].name).toBe("Fictional legacy plate");
  expect(s.wifeProfile).toEqual(fixture().wifeProfile);
  expect(s.weight).toHaveLength(2);
  await importJSON(page, incoming);
  s = JSON.parse(await stored(page));
  expect(s.logs).toHaveLength(2);
  expect(s.weight).toHaveLength(2);
  await page.locator("#backup-mode").selectOption("restore");
  await importJSON(page, { selected: [], logs: [] });
  s = JSON.parse(await stored(page));
  expect(s.logs).toHaveLength(0);
  expect(s.weight).toHaveLength(2);
  expect(s.wifeProfile).toEqual(fixture().wifeProfile);
  expect(s.futureExtension).toEqual(fixture().futureExtension);
});
test("cancelled and oversized imports never change saved data or read oversized input", async ({
  page,
}) => {
  await seed(page, fixture());
  const before = await stored(page);
  await importJSON(page, { selected: [], logs: [] }, { accept: false });
  expect(await stored(page)).toBe(before);
  page.once("dialog", (d) => d.accept());
  const oversized = await page.evaluate(async () => {
    let read = false;
    await window.HealthHubPrivacy.importFile({
      size: window.HealthHubData.MAX_BYTES + 1,
      text: async () => {
        read = true;
        return "{}";
      },
    });
    return read;
  });
  expect(oversized).toBe(false);
  expect(await stored(page)).toBe(before);
});
test("quota and unavailable storage failures preserve raw data and allow recovery downloads", async ({
  page,
}) => {
  await seed(page, fixture());
  const before = await stored(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Synthetic quota failure", "QuotaExceededError");
    };
  });
  await nav(page, "progress");
  await page.locator("#stepsInput").fill("6543");
  await page.locator("#stepsForm button").click();
  await expect(page.locator("#storage-warning")).toBeVisible();
  expect(await stored(page)).toBe(before);
  const pending = JSON.parse(await downloadText(page, "#download-pending"));
  expect(pending.steps.some((x) => x.value === 6543)).toBe(true);
  await page.reload();
  await expect(page.locator("#storage-warning")).toBeHidden();
  expect(JSON.parse(await stored(page)).steps).toEqual(fixture().steps);
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () {
      throw new DOMException("Synthetic unavailable storage", "SecurityError");
    };
  });
  await page.reload();
  await expect(page.locator("#storage-warning")).toContainText("unavailable");
  await nav(page, "progress");
  await expect(page.locator("#stepsForm button")).toBeDisabled();
});
test("cross-tab and same-tab storage changes block stale overwrites until explicit recheck", async ({
  page,
  context,
}) => {
  await seed(page, fixture());
  const other = await context.newPage();
  await other.goto("./");
  await other.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.profileName = "Updated Fictional Alias";
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await expect(page.locator("#storage-warning")).toContainText("another tab");
  await nav(page, "progress");
  await expect(page.locator("#stepsForm button")).toBeDisabled();
  await page.locator("#recheck-storage").click();
  await expect(page.locator("#storage-warning")).toBeHidden();
  await expect(page.locator('[name="profileName"]')).toHaveValue(
    "Updated Fictional Alias",
  );
  await other.close();
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.profileName = "Same-tab Fictional Alias";
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  await page.locator("#stepsInput").fill("7654");
  await page.locator("#stepsForm button").click();
  await expect(page.locator("#storage-warning")).toContainText("another tab");
  expect(JSON.parse(await stored(page)).profileName).toBe(
    "Same-tab Fictional Alias",
  );
});
test("optional goals do not reset either profile or unrelated history; imported markup stays inert", async ({
  page,
}) => {
  await seed(page, fixture());
  await nav(page, "progress");
  await page
    .locator('[name="profileName"]')
    .fill('<img src=x onerror="window.__securityCanary=1">');
  await page.locator('[name="calorieTarget"]').fill("2410");
  await page.locator("#privacy-profile-form button").click();
  const state = JSON.parse(await stored(page));
  expect(state.wifeProfile.age).toBe(fixture().wifeProfile.age);
  expect(state.wifeProfile.customNote).toBe(fixture().wifeProfile.customNote);
  expect(state.logs).toEqual(fixture().logs);
  await nav(page, "home");
  await expect(page.locator(".couple-grid").first().locator("img")).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => window.__securityCanary || null)).toBeNull();
});
test("CSP hashes match executable inline code and no injection needs unsafe-inline script permission", async ({
  page,
}) => {
  const violations = [];
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__cspViolations.push(e.violatedDirective),
    );
  });
  await page.goto("./");
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute("content");
  expect(csp.split("script-src")[1].split(";")[0]).not.toContain(
    "unsafe-inline",
  );
  expect(csp).toContain("object-src 'none'");
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
    "content",
    "no-referrer",
  );
});

test("malformed and newer stored formats remain byte-identical and locked after navigation", async ({
  page,
}) => {
  for (const raw of [
    "{not-json",
    JSON.stringify({
      selected: [],
      logs: [],
      schemaVersion: 999,
      privateExtension: "Fictional retained payload",
    }),
  ]) {
    await seed(page, raw);
    await expect(page.locator("#storage-warning")).toBeVisible();
    for (const dest of ["nutrition", "plan", "progress", "home"])
      await nav(page, dest);
    expect(await stored(page)).toBe(raw);
    expect(await downloadText(page, "#download-recovery")).toBe(raw);
  }
});
test("valid imported markup is inert across names, brands, time and profile labels; missing nutrients stay unknown", async ({
  page,
}) => {
  await page.goto("./");
  const marker =
    '<img src=fictional-text-probe onerror="window.__securityCanary=1">';
  const backup = {
    selected: [],
    logs: [
      {
        id: "safe-fictional-log",
        name: marker,
        date: new Date().toLocaleDateString("en-CA"),
        time: marker,
      },
    ],
    kitchenFoods: [
      {
        id: "safe-fictional-food",
        name: marker,
        brand: marker,
        myG: 20,
        wifeG: 15,
      },
    ],
    wifeProfile: { name: marker },
  };
  await importJSON(page, backup);
  await nav(page, "nutrition");
  await expect(page.locator("#foodLog img")).toHaveCount(0);
  await nav(page, "plan");
  await expect(page.locator("#recipeCards img")).toHaveCount(0);
  await expect(page.locator("#recipeCards")).toContainText(
    "Calories not available",
  );
  await nav(page, "home");
  await expect(page.locator(".couple-grid img")).toHaveCount(0);
  expect(await page.evaluate(() => window.__securityCanary || null)).toBeNull();
});

test("fresh legacy restore imports both profile goals while merge preserves an explicitly unset existing goal", async ({
  page,
}) => {
  await page.goto("./");
  await importJSON(page, fixture());
  let state = JSON.parse(await stored(page));
  expect(state.calorieTarget).toBe(fixture().calorieTarget);
  expect(state.wifeProfile).toEqual(fixture().wifeProfile);
  state.goalWeight = null;
  state.wifeProfile.calorieTarget = null;
  await seed(page, state);
  await importJSON(page, {
    selected: [],
    logs: [],
    goalWeight: 190,
    wifeProfile: { calorieTarget: 1800 },
  });
  state = JSON.parse(await stored(page));
  expect(state.goalWeight).toBeNull();
  expect(state.wifeProfile.calorieTarget).toBeNull();
});
