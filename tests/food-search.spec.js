const { test, expect } = require("@playwright/test");
const go = async (p) => {
  await p.goto("./");
  await p.locator('.nav [data-go="plan"]').click();
  await p.locator('#plan [data-go="nutrition"]').first().click();
  await p.locator("#liveQuery").fill("oats");
};
const endpoint = "https://world.openfoodfacts.org/cgi/search.pl**";
const product = {
  code: "fictional-oat",
  product_name: "Fictional oat product",
  brands: "Test pantry",
  nutriments: { "energy-kcal_100g": 310, proteins_100g: 11 },
};
test("food response body is bounded by the request timeout, not just response headers", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = async (url, options) => {
      if (!String(url).startsWith("https://world.openfoodfacts.org/"))
        return original(url, options);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          new Promise((resolve, reject) => {
            window.__waitingForFoodBody = true;
            options.signal.addEventListener(
              "abort",
              () =>
                reject(
                  new DOMException("Synthetic body timeout", "AbortError"),
                ),
              { once: true },
            );
          }),
      };
    };
  });
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await page.waitForFunction(() => window.__waitingForFoodBody);
  await page.clock.fastForward(20001);
  await expect(page.locator("#liveSearchBtn")).toBeEnabled();
  await expect(page.locator("#liveStatus")).toContainText("timed out");
});
test("HTTP status is reported and service failures can be retried without changing browser records", async ({
  page,
}) => {
  let calls = 0;
  await page.route(endpoint, (r) => {
    calls++;
    return r.fulfill(
      calls === 1
        ? {
            status: 503,
            headers: { "access-control-allow-origin": "*" },
            body: "Service temporarily unavailable",
          }
        : {
            json: { products: [product] },
            headers: { "access-control-allow-origin": "*" },
          },
    );
  });
  await go(page);
  const before = await page.evaluate(() =>
    localStorage.getItem("healthhub-v5"),
  );
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("503");
  await expect(page.locator("#liveSearchBtn")).toBeEnabled();
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("[data-live-select]")).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("healthhub-v5"))).toBe(
    before,
  );
});
test("rate-limit Retry-After prevents repeat requests and recovers after the stated interval", async ({
  page,
}) => {
  await page.clock.install();
  let calls = 0;
  await page.route(endpoint, (r) => {
    calls++;
    return r.fulfill(
      calls === 1
        ? {
            status: 429,
            headers: {
              "Retry-After": "30",
              "access-control-expose-headers": "Retry-After",
              "access-control-allow-origin": "*",
            },
            body: "Rate limited",
          }
        : {
            json: { products: [product] },
            headers: { "access-control-allow-origin": "*" },
          },
    );
  });
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("429");
  await page.locator("#liveSearchBtn").click();
  expect(calls).toBe(1);
  await page.clock.fastForward(30001);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("[data-live-select]")).toHaveCount(1);
});
test("valid API response works under the production CSP and sends only the intended search parameters", async ({
  page,
}) => {
  let request;
  await page.route(endpoint, (r) => {
    request = r.request();
    return r.fulfill({
      json: { products: [product] },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.addInitScript(() => {
    window.__foodPolicyErrors = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__foodPolicyErrors.push(e.violatedDirective),
    );
  });
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveResults")).toContainText(
    "Fictional oat product",
  );
  const u = new URL(request.url());
  expect(u.pathname).toBe("/cgi/search.pl");
  expect(u.searchParams.get("search_terms")).toBe("oats");
  expect([...u.searchParams.keys()].sort()).toEqual([
    "action",
    "fields",
    "json",
    "page_size",
    "search_simple",
    "search_terms",
  ]);
  expect(request.headers().referer).toBeUndefined();
  expect(await page.evaluate(() => window.__foodPolicyErrors)).toEqual([]);
  await page.locator("[data-live-select]").click();
  await page.locator("#liveAddKitchenBtn").click();
  await expect(page.locator("#recipeCards")).toContainText(
    "Fictional oat product",
  );
});
test("malformed service payloads are reported and stale selections cannot be logged after a new search", async ({
  page,
}) => {
  let calls = 0;
  await page.route(endpoint, (r) => {
    calls++;
    return r.fulfill({
      json:
        calls === 1
          ? { products: [product] }
          : { products: { unexpected: "shape" } },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await page.locator("[data-live-select]").click();
  await expect(page.locator("#liveLogBtn")).toBeVisible();
  await page.locator("#liveQuery").fill("beans");
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("invalid response");
  await expect(page.locator("#liveLogBtn")).toHaveCount(0);
  await expect(page.locator("#liveSearchBtn")).toBeEnabled();
});
test("network and offline errors retain curated discovery and missing nutrients remain unknown", async ({
  page,
  context,
}) => {
  await page.route(endpoint, (r) => r.abort("failed"));
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("connection");
  await expect(page.locator("#liveSearchBtn")).toBeEnabled();
  await context.setOffline(true);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("offline");
  await page.locator("#query").fill("rice");
  await expect(page.locator("[data-add]").first()).toBeVisible();
  await context.setOffline(false);
  await page.unroute(endpoint);
  await page.route(endpoint, (r) =>
    r.fulfill({
      json: {
        products: [
          null,
          {
            code: "fictional-unknown",
            product_name: "Fictional unknown food",
            nutriments: {},
          },
        ],
      },
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveResults")).toContainText(
    "Calories unavailable",
  );
  await expect(page.locator("#liveResults")).not.toContainText("0 kcal");
});

test("unexposed rate-limit headers use a bounded default wait instead of hammering the service", async ({
  page,
}) => {
  await page.clock.install();
  let calls = 0;
  await page.route(endpoint, (r) => {
    calls++;
    return r.fulfill(
      calls === 1
        ? {
            status: 429,
            headers: {
              "Retry-After": "30",
              "access-control-allow-origin": "*",
            },
            body: "Rate limited",
          }
        : {
            json: { products: [product] },
            headers: { "access-control-allow-origin": "*" },
          },
    );
  });
  await go(page);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("#liveStatus")).toContainText("429");
  await page.clock.fastForward(30001);
  await page.locator("#liveSearchBtn").click();
  expect(calls).toBe(1);
  await page.clock.fastForward(30001);
  await page.locator("#liveSearchBtn").click();
  await expect(page.locator("[data-live-select]")).toHaveCount(1);
});
