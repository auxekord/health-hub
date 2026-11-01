const { test, expect } = require("@playwright/test");
test.use({ serviceWorkers: "allow" });
test("Pages subpath, manifest assets, cache isolation and offline navigation", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await caches.open("other-app-cache");
    await caches.open("health-hub-old-test");
  });
  await page.goto("./");
  const manifest = await (await request.get("manifest.webmanifest")).json();
  expect(new URL(manifest.start_url, page.url()).pathname).toBe(
    "/health-hub/index.html",
  );
  expect(manifest.scope).toBe("./");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/");
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  // Activation must preserve unrelated applications' origin-wide caches.
  await expect
    .poll(() =>
      page.evaluate(
        async () => !(await caches.keys()).includes("health-hub-old-test"),
      ),
    )
    .toBeTruthy();
  expect(await page.evaluate(() => caches.keys())).toContain("other-app-cache");
  await context.setOffline(true);
  await page.goto("index.html?offline-check=1");
  await expect(page.locator("#home")).toBeVisible();
  await page.locator('.nav [data-go="plan"]').click();
  await page.locator('#plan [data-go="nutrition"]').first().click();
  await expect(page.locator("[data-add]").first()).toBeVisible();
  await page.locator('.nav [data-go="journal"]').click();
  await page.locator('#journal-connected [data-p="quick-log"]').click();
  await page.locator('#meal-form [name="name"]').fill("Offline meal");
  await page.locator('#meal-editor [data-field="name"]').fill("Offline food");
  await page.locator('#meal-editor [data-field="quantity"]').fill("1");
  await page.locator("#save-meal").click();
  await expect(page.locator("#journal-connected")).toContainText(
    "Offline meal",
  );
  await page.reload();
  await page.locator('.nav [data-go="journal"]').click();
  await expect(page.locator("#journal-connected")).toContainText(
    "Offline meal",
  );
  await context.setOffline(false);
});
