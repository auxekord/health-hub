/* Shared Phase 2 data rules; no network or DOM access. */
(function (root) {
  "use strict";
  const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const SOURCES = ["Restaurant", "Home-cooked", "Packaged", "Custom"];
  const NUTRIENTS = ["kcal", "protein", "carbs", "fat", "fiber"];
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
      ["unknown", "estimate", "verified"].includes(c.status) &&
      object(c.nutrients) &&
      NUTRIENTS.every((k) => c.nutrients[k] === null || num(c.nutrients[k])) &&
      (c.wifeQuantity === undefined || num(c.wifeQuantity)) &&
      (c.group === undefined ||
        ["protein", "grain", "veg", "fat", "sauce", "spice", "other"].includes(
          c.group,
        )) &&
      (NUTRIENTS.every((k) => c.nutrients[k] === null) ||
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
      text(m.location) &&
      text(m.notes) &&
      text(m.leftovers) &&
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
          num(s.profiles[k].calories) &&
          s.profiles[k].calories > 0 &&
          num(s.profiles[k].protein) &&
          num(s.profiles[k].goalWeight),
      ) &&
      object(s.shopping) &&
      Array.isArray(s.shopping.manual) &&
      s.shopping.manual.every(
        (x) =>
          object(x) &&
          text(x.id) &&
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
      s.restaurants.every((x) => object(x) && text(x.name) && text(x.location))
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
          name: "You",
          calories: legacy.calorieTarget || 1900,
          protein: legacy.proteinTarget || 130,
          goalWeight: legacy.goalWeight || 200,
        },
        wife: {
          name: "Wife",
          calories: legacy.wifeProfile?.calorieTarget || 1500,
          protein: legacy.wifeProfile?.proteinTarget || 85,
          goalWeight: 0,
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
      kind: "Custom",
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
        const q = m.profile ? c.quantity : quantity(c, m, profile);
        if (q === 0) continue;
        if (q === null || c.nutrients[k] === null) {
          partial = true;
          continue;
        }
        sum += q * c.nutrients[k];
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
      if (m.kind === "Restaurant") continue;
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
  root.HHModel = {
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
