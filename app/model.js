/* Shared Phase 2 data rules; no network or DOM access. */
(function (root) {
  "use strict";
  const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const SOURCES = ["Restaurant", "Home-cooked", "Packaged", "Custom"];
  const NUTRIENTS = ["kcal", "protein", "carbs", "fat", "fiber", "sodium", "saturatedFat", "sugar", "addedSugar"];
  const UNITS = [
    "g",
    "kg",
    "oz",
    "ml",
    "l",
    "cup",
    "tbsp",
    "tsp",
    "serving",
    "piece",
  ];
  const id = () => crypto.randomUUID();
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const date = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d + "T12:00:00").toISOString().slice(0, 10) === d;
  const num = (x) =>
    typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1e8;
  const text = (x) => typeof x === "string" && x.length <= 10000;
  const stable = (x) =>
    typeof x === "string" && /^[A-Za-z0-9:_|.\-]{1,200}$/.test(x);
  const object = (x) => x && typeof x === "object" && !Array.isArray(x);
  function component(c) {
    return (
      object(c) &&
      stable(c.id) &&
      text(c.name) &&
      c.name.trim() &&
      (c.quantity === null || num(c.quantity)) &&
      UNITS.includes(c.unit) &&
      text(c.source) &&
      (c.preparation === undefined || text(c.preparation)) &&
      (c.nutritionBasis === undefined ||
        (num(c.nutritionBasis) && c.nutritionBasis > 0)) &&
      (c.consumedFraction === undefined ||
        (num(c.consumedFraction) && c.consumedFraction <= 1)) &&
      ["unknown", "estimate", "verified"].includes(c.status) &&
      object(c.nutrients) &&
      NUTRIENTS.every((k) => c.nutrients[k] === null || num(c.nutrients[k]) || (["sodium", "saturatedFat", "sugar", "addedSugar"].includes(k) && c.nutrients[k] === undefined)) &&
      (c.wifeQuantity === undefined || num(c.wifeQuantity)) &&
      (c.group === undefined ||
        ["protein", "grain", "veg", "fat", "sauce", "spice", "other"].includes(
          c.group,
        )) &&
      (c.catalog === undefined || (object(c.catalog) && stable(c.catalog.restaurantId) && stable(c.catalog.itemId) && safeURL(c.catalog.sourceUrl) && date(c.catalog.verifiedAt) && text(c.catalog.serving) && text(c.catalog.modification) && text(c.catalog.allergenWarning))) &&
      (NUTRIENTS.every((k) => c.nutrients[k] == null) ||
        (c.status !== "unknown" && c.source.trim().length > 0))
    );
  }
  function meal(m, journal = false) {
    return (
      object(m) &&
      stable(m.id) &&
      text(m.name) &&
      m.name.trim() &&
      date(m.date) &&
      /^\d{2}:\d{2}$/.test(m.time) &&
      Number(m.time.slice(0, 2)) < 24 &&
      Number(m.time.slice(3)) < 60 &&
      CATEGORIES.includes(m.category) &&
      SOURCES.includes(m.kind) &&
      text(m.restaurant) &&
      (m.restaurantId === undefined ||
        m.restaurantId === null ||
        stable(m.restaurantId)) &&
      text(m.location) &&
      text(m.notes) &&
      text(m.leftovers) &&
      (m.includeGroceries === undefined ||
        typeof m.includeGroceries === "boolean") &&
      Array.isArray(m.components) &&
      m.components.length > 0 &&
      m.components.length <= 200 &&
      m.components.every(component) &&
      new Set(m.components.map((c) => c.id)).size === m.components.length &&
      (m.recipeId === null || text(m.recipeId)) &&
      (m.plannedId === null || text(m.plannedId)) &&
      (journal
        ? ["you", "wife"].includes(m.profile)
        : object(m.portions) &&
          ["you", "wife"].every(
            (k) => num(m.portions[k]) && m.portions[k] <= 20,
          ) &&
          m.portions.you + m.portions.wife > 0)
    );
  }
  function safeURL(value) {
    if (value === "") return "";
    try {
      const u = new URL(value);
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        u.origin === location.origin ||
        u.hostname === "localhost" ||
        u.hostname.endsWith(".local") ||
        (u.port && u.port !== "443")
      )
        return null;
      return u.href;
    } catch {
      return null;
    }
  }
  function restaurant(r) {
    return (
      object(r) &&
      text(r.name) &&
      r.name.trim() &&
      text(r.location) &&
      (r.id === undefined || stable(r.id)) &&
      (r.catalogId === undefined || stable(r.catalogId)) &&
      ["website", "menuUrl"].every(
        (k) => r[k] === undefined || (text(r[k]) && safeURL(r[k]) !== null),
      ) &&
      [
        "provider",
        "placeId",
        "address",
        "source",
        "lastChecked",
        "updatedAt",
      ].every((k) => r[k] === undefined || r[k] === null || text(r[k]))
    );
  }
  function preferences(p) {
    return p === undefined || (object(p) && ["allergens", "restrictions"].every(k => Array.isArray(p[k]) && p[k].length <= 20 && p[k].every(x => (k === "allergens" ? ["milk","egg","fish","shellfish","tree-nut","peanut","wheat","soy","sesame"] : ["vegetarian","vegan","no-pork"]).includes(x))) && text(p.other || "") && ["sodium","addedSugar","saturatedFat"].every(k => p[k] == null || num(p[k])));
  }
  function valid(s) {
    return (
      object(s) &&
      s.version === 2 &&
      (s.weights === undefined ||
        (Array.isArray(s.weights) &&
          new Set(s.weights.map((w) => w.id)).size === s.weights.length &&
          s.weights.every(
            (w) =>
              object(w) &&
              stable(w.id) &&
              ["you", "wife"].includes(w.profile) &&
              date(w.date) &&
              num(w.value) &&
              w.value >= 40 &&
              w.value <= 1000,
          ))) &&
      ["plans", "journal", "favorites"].every(
        (k) =>
          Array.isArray(s[k]) &&
          s[k].length <= 10000 &&
          new Set(s[k].map((x) => x.id)).size === s[k].length &&
          s[k].every((m) => meal(m, k === "journal")),
      ) &&
      object(s.profiles) &&
      ["you", "wife"].every(
        (k) =>
          object(s.profiles[k]) &&
          text(s.profiles[k].name) &&
          preferences(s.profiles[k].preferences) &&
          (s.profiles[k].calories === null || num(s.profiles[k].calories)) &&
          (s.profiles[k].protein === null || num(s.profiles[k].protein)) &&
          (s.profiles[k].goalWeight === null || num(s.profiles[k].goalWeight)),
      ) &&
      object(s.shopping) &&
      Array.isArray(s.shopping.manual) &&
      s.shopping.manual.every(
        (x) =>
          object(x) &&
          stable(x.id) &&
          text(x.name) &&
          num(x.quantity) &&
          UNITS.includes(x.unit) &&
          typeof x.checked === "boolean" &&
          typeof x.onHand === "boolean",
      ) &&
      new Set(s.shopping.manual.map((x) => x.id)).size ===
        s.shopping.manual.length &&
      object(s.shopping.overrides) &&
      Object.values(s.shopping.overrides).every(
        (x) =>
          object(x) &&
          typeof x.checked === "boolean" &&
          typeof x.onHand === "boolean" &&
          (x.quantity === null || num(x.quantity)),
      ) &&
      Array.isArray(s.restaurants) &&
      s.restaurants.every(restaurant) &&
      new Set(s.restaurants.filter((r) => r.id !== undefined).map((r) => r.id))
        .size === s.restaurants.filter((r) => r.id !== undefined).length
    );
  }
  function create(legacy) {
    return {
      version: 2,
      weights: [],
      plans: [],
      journal: [],
      favorites: [],
      restaurants: [],
      shopping: { manual: [], overrides: {} },
      profiles: {
        you: {
          name: legacy.profileName || "Profile 1",
          calories: legacy.calorieTarget ?? null,
          protein: legacy.proteinTarget ?? null,
          goalWeight: legacy.goalWeight ?? null,
        },
        wife: {
          name: legacy.wifeProfile?.name || "Profile 2",
          calories: legacy.wifeProfile?.calorieTarget ?? null,
          protein: legacy.wifeProfile?.proteinTarget ?? null,
          goalWeight: legacy.wifeProfile?.goalWeight ?? null,
        },
      },
    };
  }
  function blankComponent(name = "") {
    return {
      id: id(),
      name,
      quantity: null,
      unit: "g",
      nutrients: Object.fromEntries(NUTRIENTS.map((k) => [k, null])),
      status: "unknown",
      source: "",
    };
  }
  function blankMeal(day) {
    return {
      id: id(),
      name: "",
      date: day,
      time: "12:00",
      category: "Lunch",
      kind: "Home-cooked",
      restaurant: "",
      location: "",
      notes: "",
      leftovers: "",
      components: [blankComponent()],
      portions: { you: 1, wife: 1 },
      recipeId: null,
      plannedId: null,
    };
  }
  function fromRecipe(r, day, legacy) {
    const m = blankMeal(day);
    m.name = r.name;
    m.kind = "Home-cooked";
    m.recipeId = r.id;
    m.category = r.mealCategories?.[0] || "Dinner";
    m.portions = {
      you: (legacy.myScale || 100) / 100,
      wife: (legacy.wifeScale || 100) / 100,
    };
    m.components = r.items.map(([name, a, b, , group]) => ({
      ...blankComponent(name),
      quantity: a,
      unit: "g",
      wifeQuantity: b,
      group,
      source: "Original recipe: raw ingredient weights; nutrients unavailable",
    }));
    return m;
  }
  // Household-specific raw amounts preserve the original recipe's unequal baseline portions.
  function quantity(c, m, profile) {
    if (m.portions?.[profile] === 0) return 0;
    return (profile === "wife" && num(c.wifeQuantity)
      ? c.wifeQuantity
      : c.quantity) === null
      ? null
      : (profile === "wife" && num(c.wifeQuantity)
          ? c.wifeQuantity
          : c.quantity) * (m.portions?.[profile] ?? 1);
  }
  function total(m, profile) {
    const result = { values: {}, partial: {}, estimated: false };
    for (const k of NUTRIENTS) {
      let sum = 0,
        known = false,
        partial = false;
      for (const c of m.components) {
        const base = m.profile ? c.quantity : quantity(c, m, profile);
        const q =
          c.consumedFraction === 0
            ? 0
            : base === null
              ? null
              : base * (c.consumedFraction ?? 1);
        if (q === 0) continue;
        if (q === null || c.nutrients[k] == null) {
          partial = true;
          continue;
        }
        const basis = c.nutritionBasis ?? 1;
        if (!Number.isFinite(basis) || basis <= 0) {
          partial = true;
          continue;
        }
        sum += (q * c.nutrients[k]) / basis;
        known = true;
        if (c.status !== "verified") result.estimated = true;
      }
      result.values[k] = known ? sum : null;
      result.partial[k] = partial;
    }
    return result;
  }
  function summary(meals, profile) {
    const out = {
      kcal: 0,
      protein: 0,
      partial: false,
      estimated: false,
      count: meals.length,
    };
    for (const m of meals) {
      const t = total(m, profile);
      out.kcal += t.values.kcal || 0;
      out.protein += t.values.protein || 0;
      out.partial ||= t.partial.kcal || t.partial.protein;
      out.estimated ||= t.estimated;
    }
    return out;
  }
  const conversion = {
    g: ["mass", 1],
    kg: ["mass", 1000],
    oz: ["mass", 28.349523125],
    ml: ["volume", 1],
    l: ["volume", 1000],
  };
  function groceries(plans) {
    const map = new Map();
    for (const m of plans) {
      if (
        m.kind === "Restaurant" ||
        (m.kind !== "Home-cooked" && m.includeGroceries !== true)
      )
        continue;
      for (const c of m.components) {
        const name = c.name.trim().toLowerCase().replace(/\s+/g, " ");
        const conv = conversion[c.unit];
        const unit = conv ? (conv[0] === "mass" ? "g" : "ml") : c.unit;
        const key = name + "|" + unit;
        const a = quantity(c, m, "you"),
          b = quantity(c, m, "wife");
        const q = a === null || b === null ? null : (a + b) * (conv?.[1] || 1);
        if (!map.has(key))
          map.set(key, {
            id: key,
            name: c.name,
            unit,
            quantity: 0,
            unknown: false,
            category: c.group || "other",
          });
        const item = map.get(key);
        if (q === null) item.unknown = true;
        else item.quantity += q;
      }
    }
    return [...map.values()];
  }
  function consumed(plan, profile) {
    const m = clone(plan);
    m.id = id();
    m.plannedId = plan.id;
    m.profile = profile;
    m.components = m.components.map((c) => {
      const q = quantity(c, plan, profile);
      delete c.wifeQuantity;
      return { ...c, id: id(), quantity: q };
    });
    delete m.portions;
    return m;
  }
  function merge(current, incoming) {
    const result = clone(current);
    for (const key of ["plans", "journal", "favorites", "weights"]) {
      const ids = new Set((result[key] || []).map((x) => x.id));
      result[key] ??= [];
      for (const item of incoming[key] || [])
        if (!ids.has(item.id)) {
          result[key].push(clone(item));
          ids.add(item.id);
        }
    }
    const names = new Set(
      result.restaurants.map(
        (x) => x.name.toLowerCase() + "|" + x.location.toLowerCase(),
      ),
    );
    for (const r of incoming.restaurants) {
      const key = r.name.toLowerCase() + "|" + r.location.toLowerCase();
      if (!names.has(key)) {
        result.restaurants.push(clone(r));
        names.add(key);
      }
    }
    const ids = new Set(result.shopping.manual.map((x) => x.id));
    for (const x of incoming.shopping.manual)
      if (!ids.has(x.id)) {
        result.shopping.manual.push(clone(x));
        ids.add(x.id);
      }
    result.shopping.overrides = {
      ...incoming.shopping.overrides,
      ...result.shopping.overrides,
    };
    if (!valid(result)) throw Error("Invalid merged meal data");
    return result;
  }
  root.HHModel = {
    preferences,
    merge,
    safeURL,
    restaurant,
    CATEGORIES,
    SOURCES,
    NUTRIENTS,
    UNITS,
    id,
    clone,
    date,
    num,
    valid,
    create,
    conversion,
    blankMeal,
    blankComponent,
    fromRecipe,
    total,
    summary,
    groceries,
    consumed,
    quantity,
  };
})(typeof window === "undefined" ? globalThis : window);
