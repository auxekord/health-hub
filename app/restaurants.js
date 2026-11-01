/* Local-only restaurant adapter and browser. No provider request or SDK is active. */
(() => {
  "use strict";
  const M = window.HHModel;
  const key = (r) =>
    r.name.trim().toLocaleLowerCase() +
    "|" +
    r.location.trim().toLocaleLowerCase();
  const hash = (s) => {
    let n = 2166136261;
    for (const c of s) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return (n >>> 0).toString(16);
  };
  function normalize(r) {
    return {
      provider: "local",
      placeId: null,
      address: "",
      website: "",
      menuUrl: "",
      source: "User-saved; not independently verified",
      lastChecked: null,
      ...r,
      id: r.id || "local-" + hash(key(r)),
    };
  }
  const adapter = {
    identity: "local",
    async search({ name = "", city = "", signal } = {}) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const rows = window.HealthHub.state.phase2?.restaurants || [];
      return rows
        .map(normalize)
        .filter(
          (r) =>
            r.name
              .toLocaleLowerCase()
              .includes(name.trim().toLocaleLowerCase()) &&
            r.location
              .toLocaleLowerCase()
              .includes(city.trim().toLocaleLowerCase()),
        );
    },
  };
  const el = (tag, attrs = {}, text) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else node.setAttribute(k, v);
    }
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const dialog = el("dialog", {
    id: "restaurant-browser",
    class: "phase-dialog",
    "aria-labelledby": "restaurant-browser-title",
  });
  document.body.append(dialog);
  let context = {},
    selected = null,
    sequence = 0;
  const status = () => dialog.querySelector("[role=status]");
  function button(label, action) {
    const b = el("button", { type: "button", class: "btn alt sm" }, label);
    b.addEventListener("click", action);
    return b;
  }
  function field(form, label, name, value = "", type = "text") {
    const l = el("label", { class: "phase-label" }, label),
      input = el("input", { name, type, maxlength: "300" });
    input.value = value;
    l.append(input);
    form.append(l);
    return input;
  }
  function link(label, url) {
    const a = el(
      "a",
      {
        class: "btn ghost sm",
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      label,
    );
    a.dataset.restaurantExternal = "true";
    return a;
  }
  function matches(meal, r) {
    return (
      meal.restaurantId === r.id ||
      (meal.restaurant &&
        key({ name: meal.restaurant, location: meal.location || "" }) ===
          key(r))
    );
  }
  function open(options = {}) {
    context = options;
    selected = null;
    sequence++;
    dialog.replaceChildren();
    const head = el("div", { class: "row" });
    head.append(
      el("h2", { id: "restaurant-browser-title" }, context.replacement ? "Replace meal: choose a restaurant" : "Find or save a restaurant"),
      button("Close", () => dialog.close()),
    );
    dialog.append(
      head,
      el(
        "p",
        { class: "notice" },
        "Search saved restaurants and the offline research directory. Directory entries are not live results; menus appear only after source review. External search opens a separate site.",
      ),
    );
    const form = el("form", {
      id: "restaurant-search-form",
      class: "phase-fields",
    });
    field(form, "Restaurant name", "name", options.name || "");
    field(form, "City or location", "city", options.city || "");
    const submit = el(
      "button",
      { class: "btn", type: "submit" },
      "Search saved restaurants",
    );
    form.append(submit);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      search();
    });
    dialog.append(
      form,
      el("p", { role: "status", "aria-live": "polite" }),
      el("div", { id: "restaurant-results", class: "stack" }),
      el("div", { id: "restaurant-catalog-results", class: "stack" }),
      el("div", { id: "restaurant-details" }),
    );
    const actions = el("div", { class: "actionbar" });
    actions.append(
      button("Save a new restaurant", () =>
        details({
          id: M.id(),
          name: form.elements.name.value.trim(),
          location: form.elements.city.value.trim(),
        }),
      ),
      button("Open external map search", () => {
        const name = form.elements.name.value.trim(),
          city = form.elements.city.value.trim();
        if (!name) {
          status().textContent =
            "Enter a restaurant name before opening an external search.";
          return;
        }
        const area = dialog.querySelector("#restaurant-results");
        area.replaceChildren(
          el(
            "p",
            { class: "notice" },
            "This link sends only the name and city to an external map website. It is not a search result or a verified listing.",
          ),
        );
        area.append(
          link(
            "Open map search in a new tab",
            "https://www.google.com/maps/search/?" +
              new URLSearchParams({ api: "1", query: name + " " + city }),
          ),
        );
      }),
    );
    dialog.append(actions);
    if (!dialog.open) dialog.showModal();
    form.elements.name.focus();
    search();
  }
  async function search() {
    const ticket = ++sequence;
    selected = null;
    dialog.querySelector("#restaurant-details").replaceChildren();
    const form = dialog.querySelector("form"),
      out = dialog.querySelector("#restaurant-results");
    status().textContent = "Searching saved restaurants…";
    out.replaceChildren();
    out.hidden=false;
    const directory = dialog.querySelector("#restaurant-catalog-results");
    directory.replaceChildren();
    directory.hidden=false;
    try {
      const rows = await adapter.search({
        name: form.elements.name.value,
        city: form.elements.city.value,
      });
      if (ticket !== sequence || !dialog.open) return;
      if (!Array.isArray(rows) || !rows.every(M.restaurant))
        throw Error("invalid");
      status().textContent =
        (navigator.onLine ? "" : "Offline: local search still works. ") +
        (rows.length
          ? rows.length + " locally saved restaurant(s)."
          : "No saved matches. You can save a new restaurant or open an external search when online.");
      const catalog = window.HHCatalog?.catalog;
      if (window.HHCatalog?.error) directory.append(el("p", {class:"notice"}, window.HHCatalog.error));
      const records = catalog?.search(form.elements.name.value, form.elements.city.value) || [];
      records.sort((a,b)=>(b.status==="verified")-(a.status==="verified"));
      if (records.length) directory.append(el("h3", {}, "Offline catalog / research directory — not live results"));
      for (const r of records) {
        const card = el("article", {class:"entry catalog-directory"});
        card.append(el("strong", {}, r.name), el("p", {class:"mini"}, (r.location || "National chain; choose a location externally") + " · " + (r.status === "verified" ? "Reviewed catalog" : "Unverified research entry; no verified menu")), button("Explore " + r.name, () => details({id:r.id, catalogId:r.id, name:r.name, location:r.location, source:r.sourceNote || "Reviewed catalog", provider:"curated", lastChecked:null})));
        directory.append(card);
      }
      for (const r of rows) {
        const card = el("article", { class: "entry" });
        card.append(
          el("strong", {}, r.name),
          el("p", { class: "mini" }, r.location || "Location not entered"),
          button("Open restaurant", () => details(r)),
        );
        out.append(card);
      }
    } catch (e) {
      if (ticket === sequence)
        status().textContent =
          "Saved restaurant search unavailable. Existing data was not changed. Try again or enter the restaurant manually.";
    }
  }
  function details(value) {
    selected = normalize(value);
    const r = selected,
      area = dialog.querySelector("#restaurant-details");
    area.replaceChildren();
    const form = el("form", { id: "restaurant-form", class: "phase-fields" });
    const name = field(form, "Restaurant name", "name", r.name);
    name.required = true;
    field(form, "City / location", "location", r.location);
    field(form, "Address (optional)", "address", r.address);
    field(
      form,
      "Official website HTTPS URL (if known)",
      "website",
      r.website,
      "url",
    );
    field(
      form,
      "Official menu HTTPS URL (if known)",
      "menuUrl",
      r.menuUrl,
      "url",
    );
    form.append(
      el(
        "p",
        { class: "notice phase-wide" },
        "Links are user-provided. The app does not verify their content or invent menu items. Opening a link sends a request to that website, not your journal or profile data.",
      ),
    );
    const checked = el("label", { class: "notice phase-wide" });
    const checkbox = el("input", { type: "checkbox", name: "checked" });
    checked.append(
      checkbox,
      document.createTextNode(
        " I checked these links against this restaurant/location.",
      ),
    );
    form.append(checked);
    const save = el(
      "button",
      { type: "submit", class: "btn" },
      "Save restaurant",
    );
    form.append(save);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const saved = saveRestaurant();
      if (saved) details(saved);
    });
    area.append(
      el("h3", {}, r.name || "New restaurant"),
      form,
      el("p", { id: "restaurant-error", role: "alert", class: "phase-error" }),
    );
    const links = el("div", { class: "actionbar" });
    for (const [label, u] of [
      ["Open saved website", r.website],
      ["Open saved menu", r.menuUrl],
    ])
      if (u && M.safeURL(u)) links.append(link(label, M.safeURL(u)));
    area.append(
      links,
      el(
        "p",
        { class: "notice" },
        r.menuUrl
          ? "A saved menu link is available. Structured menu items and nutrition are not imported."
          : "Menu information unavailable. Add your own plate components; no official menu is assumed.",
      ),
      el(
        "p",
        { class: "mini" },
        (r.source || "User-saved") +
          " · " +
          (r.lastChecked
            ? "User checked: " + r.lastChecked.slice(0, 10)
            : "No link verification recorded"),
      ),
    );
    const actions = el("div", { class: "actionbar" });
    actions.append(
      button(
        context.mode === "plan"
          ? "Build a planned restaurant plate"
          : "Build a restaurant plate",
        () => {
          const saved = saveRestaurant();
          if (saved) {
            dialog.close();
            context.onPlate?.(saved);
          }
        },
      ),
    );
    const catalogArea = el("section", {id:"restaurant-catalog"});
    area.append(catalogArea);
    window.HHCatalogUI?.render(catalogArea, r, {
      ...context,
      onOrder(components, profile) {
        const saved = saveRestaurant();
        if (!saved) return;
        const m = M.blankMeal(context.date);
        m.kind = "Restaurant"; m.name = r.name + " custom order"; m.components = components;
        dialog.close();
        context.onReuse?.(m, saved, profile);
      },
    });
    if(context.replacement){dialog.querySelector('#restaurant-results').hidden=true;dialog.querySelector('#restaurant-catalog-results').hidden=true;catalogArea.scrollIntoView({block:'start'});dialog.scrollTop=Math.max(0,dialog.scrollTop-150);}
    area.append(actions, el("h3", {}, "Saved plates and past meals"));
    const state = window.HealthHub.state.phase2;
    const rows = [
      ...state.favorites.map((m) => ({ m, favorite: true })),
      ...(context.actual?.() || [])
        .filter((m) => m.kind === "Restaurant")
        .map((m) => ({ m, favorite: false })),
    ].filter(({ m }) => matches(m, r));
    if (!rows.length)
      area.append(
        el(
          "p",
          { class: "empty" },
          "No saved plates yet. Build one, then save it as a favorite.",
        ),
      );
    for (const { m, favorite } of rows) {
      const card = el("article", { class: "entry" });
      card.append(
        el("strong", {}, m.name),
        el(
          "small",
          {},
          favorite ? "Favorite plate" : "Previous meal · " + m.date,
        ),
        button(
          context.mode === "plan"
            ? "Plan this plate"
            : "Repeat and adjust plate",
          () => {
            const saved = saveRestaurant();
            if (saved) {
              dialog.close();
              context.onReuse?.(m, saved);
            }
          },
        ),
      );
      if (!favorite && context.mode !== "plan")
        card.append(
          button("Edit original journal entry", () => {
            dialog.close();
            context.onEdit?.(m);
          }),
        );
      area.append(card);
    }
  }
  function saveRestaurant() {
    const form = dialog.querySelector("#restaurant-form");
    if (!form || !form.reportValidity()) return null;
    const r = {
      ...selected,
      name: form.elements.name.value.trim(),
      location: form.elements.location.value.trim(),
      address: form.elements.address.value.trim(),
      website: form.elements.website.value.trim(),
      menuUrl: form.elements.menuUrl.value.trim(),
      updatedAt: new Date().toISOString(),
    };
    for (const k of ["website", "menuUrl"]) {
      const u = M.safeURL(r[k]);
      if (u === null) {
        dialog.querySelector("#restaurant-error").textContent =
          "Use a valid external HTTPS link without credentials. App-origin and local links are not accepted.";
        return null;
      }
      r[k] = u;
    }
    if (form.elements.checked.checked) r.lastChecked = new Date().toISOString();
    if (!M.restaurant(r)) {
      dialog.querySelector("#restaurant-error").textContent =
        "Check the restaurant name, location and links.";
      return null;
    }
    if(context.deferSave){selected=r;status().textContent="Restaurant details staged. Confirm replacement to save; the original plan is unchanged.";return r;}
    const existing = window.HealthHub.state.phase2.restaurants;
    const byId = existing.findIndex((x) => x.id === r.id),
      byName = existing.findIndex((x) => key(x) === key(r));
    if (byId >= 0 && byName >= 0 && byId !== byName) {
      dialog.querySelector("#restaurant-error").textContent =
        "Another restaurant already uses that name/location. Open its saved entry instead.";
      return null;
    }
    if (byId < 0 && byName >= 0) {
      for (const k of ["website", "menuUrl", "address", "lastChecked"])
        if (!r[k] && existing[byName][k]) r[k] = existing[byName][k];
    }
    let result = r;
    const ok = context.commit?.(() => {
      const all = window.HealthHub.state.phase2.restaurants;
      const index = all.findIndex((x) => key(x) === key(r) || x.id === r.id);
      if (index >= 0) {
        result = { ...all[index], ...r, id: all[index].id || r.id };
        all[index] = result;
      } else all.push(r);
    }, "Restaurant saved locally.");
    if (!ok) {
      dialog.querySelector("#restaurant-error").textContent =
        "Could not save. Review the storage recovery notice.";
      return null;
    }
    selected = result;
    status().textContent = "Restaurant saved in this browser.";
    return result;
  }
  window.HHRestaurantAdapter = adapter;
  window.HHRestaurants = { open, normalize, matches, key };
})();
