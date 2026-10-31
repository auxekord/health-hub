/* Production storage and backup boundary. No network, telemetry, or health defaults. */
(() => {
  "use strict";
  const KEY = "healthhub-v5",
    MAX_BYTES = 8 * 1024 * 1024,
    MAX_ITEMS = 100000;
  const forbidden = new Set(["__proto__", "prototype", "constructor"]);
  const object = (x) =>
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Object.getPrototypeOf(x) === Object.prototype;
  const number = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0;
  const text = (x, max = 10000) => typeof x === "string" && x.length <= max;
  const id = (x) =>
    number(x) ||
    (text(x, 200) && x.length > 0 && !/[\u0000-\u001f<>"'`=]/.test(x));
  const optionalNumber = (x) => x === null || number(x);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const defaults = () => ({
    schemaVersion: 1,
    selected: [],
    logs: [],
    steps: [],
    weight: [],
    myScale: 100,
    wifeScale: 100,
    done: {},
    mealTypes: {},
    batchWeights: {},
    openCards: {},
    foodEntries: [],
    kitchenFoods: [],
    goalWeight: null,
    calorieTarget: null,
    proteinTarget: null,
    wifeProfile: {},
  });
  function jsonTree(v, depth = 0) {
    if (depth > 40) return false;
    if (v === null || typeof v === "boolean" || typeof v === "string")
      return true;
    if (typeof v === "number") return Number.isFinite(v);
    if (Array.isArray(v))
      return v.length <= MAX_ITEMS && v.every((x) => jsonTree(x, depth + 1));
    return (
      object(v) &&
      Object.keys(v).length <= MAX_ITEMS &&
      Object.entries(v).every(
        ([k, x]) => !forbidden.has(k) && jsonTree(x, depth + 1),
      )
    );
  }
  const list = (v, predicate) =>
    Array.isArray(v) && v.length <= MAX_ITEMS && v.every(predicate);
  const unique = (rows) =>
    new Set(rows.map((x) => String(x.id))).size === rows.length;
  function valid(v) {
    if (
      !object(v) ||
      !jsonTree(v) ||
      !list(v.selected, (x) => id(x) && typeof x === "string") ||
      !list(
        v.logs,
        (x) =>
          object(x) &&
          id(x.id) &&
          text(x.name) &&
          text(x.date, 128) &&
          text(x.time, 128),
      ) ||
      !unique(v.logs)
    )
      return false;
    if (v.schemaVersion !== undefined && v.schemaVersion !== 1) return false;
    for (const k of ["steps", "weight"])
      if (
        v[k] !== undefined &&
        !list(
          v[k],
          (x) =>
            object(x) &&
            number(x.value) &&
            text(x.at, 128) &&
            Number.isFinite(Date.parse(x.at)),
        )
      )
        return false;
    for (const k of ["myScale", "wifeScale"])
      if (v[k] !== undefined && (!number(v[k]) || v[k] < 25 || v[k] > 250))
        return false;
    for (const k of ["goalWeight", "calorieTarget", "proteinTarget"])
      if (v[k] !== undefined && !optionalNumber(v[k])) return false;
    for (const k of [
      "done",
      "mealTypes",
      "batchWeights",
      "openCards",
      "wifeProfile",
    ])
      if (v[k] !== undefined && !object(v[k])) return false;
    for (const k of ["done", "openCards"])
      if (v[k] && !Object.values(v[k]).every((x) => typeof x === "boolean"))
        return false;
    if (
      v.mealTypes &&
      !Object.values(v.mealTypes).every((x) =>
        ["Breakfast", "Lunch", "Dinner", "Snack"].includes(x),
      )
    )
      return false;
    if (
      v.batchWeights &&
      !Object.values(v.batchWeights).every(
        (x) =>
          number(x) ||
          (text(x, 100) &&
            x.trim() !== "" &&
            Number.isFinite(Number(x)) &&
            Number(x) >= 0),
      )
    )
      return false;
    if (v.wifeProfile)
      for (const k of [
        "calorieTarget",
        "proteinTarget",
        "goalWeight",
        "heightCm",
        "weightLb",
        "age",
        "fiberTarget",
        "fatTarget",
      ])
        if (v.wifeProfile[k] !== undefined && !optionalNumber(v.wifeProfile[k]))
          return false;
    for (const k of ["profileName"])
      if (v[k] !== undefined && !text(v[k], 200)) return false;
    if (v.wifeProfile?.name !== undefined && !text(v.wifeProfile.name, 200))
      return false;
    for (const k of ["foodEntries", "kitchenFoods"])
      if (v[k] !== undefined) {
        if (
          !list(
            v[k],
            (x) =>
              object(x) &&
              typeof x.id === "string" &&
              id(x.id) &&
              text(x.name) &&
              number(x.myG) &&
              number(x.wifeG) &&
              x.myG <= 2000 &&
              x.wifeG <= 2000 &&
              ["kcal", "protein", "fat", "carbs", "fiber"].every(
                (n) => x[n] === undefined || optionalNumber(x[n]),
              ) &&
              ["brand", "source", "serving"].every(
                (n) => x[n] === undefined || text(x[n]),
              ) &&
              (k !== "foodEntries" || text(x.date, 128)),
          ) ||
          !unique(v[k])
        )
          return false;
      }
    return true;
  }
  function parse(raw) {
    if (typeof raw !== "string" || new Blob([raw]).size > MAX_BYTES)
      throw Error("Invalid or oversized backup.");
    const v = JSON.parse(raw);
    if (!valid(v)) throw Error("Unsupported or invalid backup.");
    return v;
  }
  function normalize(v) {
    const state = { ...defaults(), ...clone(v) };
    for (const key of ["foodEntries", "kitchenFoods"])
      state[key] = state[key].map((food) => ({
        ...Object.fromEntries(
          ["kcal", "protein", "fat", "carbs", "fiber"].map((k) => [k, null]),
        ),
        ...food,
      }));
    return state;
  }
  function combine(existing, incoming, mode, { newStore = false } = {}) {
    if (!valid(incoming)) throw Error("Invalid backup.");
    if (mode === "restore")
      return normalize({ ...clone(existing), ...clone(incoming) });
    const next = normalize(existing);
    for (const [k, v] of Object.entries(incoming)) {
      if (k === "selected") {
        next.selected = [...new Set([...next.selected, ...v])];
      } else if (["logs", "foodEntries", "kitchenFoods"].includes(k)) {
        const ids = new Set(next[k].map((x) => String(x.id)));
        next[k].push(...clone(v).filter((x) => !ids.has(String(x.id))));
      } else if (["steps", "weight"].includes(k)) {
        const keys = new Set(next[k].map((x) => x.at + "|" + x.value));
        next[k].push(
          ...clone(v).filter((x) => !keys.has(x.at + "|" + x.value)),
        );
      } else if (object(v) && object(next[k]))
        next[k] = { ...clone(v), ...next[k] };
      else if (next[k] === undefined || (newStore && next[k] === null))
        next[k] = clone(v);
    }
    if (!valid(next)) throw Error("Backup cannot be merged safely.");
    return normalize(next);
  }
  function open() {
    let expected = null,
      current = defaults(),
      reason = "",
      pending = null;
    function read() {
      try {
        expected = localStorage.getItem(KEY);
        current = expected === null ? defaults() : normalize(parse(expected));
        reason = "";
        pending = null;
      } catch {
        current = defaults();
        reason = expected === null ? "unavailable" : "invalid";
      }
      return clone(current);
    }
    read();
    return {
      state: () => clone(current),
      raw: () => expected,
      pending: () => pending,
      reason: () => reason,
      recheck: read,
      conflict() {
        reason = "conflict";
      },
      write(candidate, { recovery = false } = {}) {
        if (reason && !(recovery && reason === "invalid")) return false;
        try {
          if (localStorage.getItem(KEY) !== expected) {
            reason = "conflict";
            return false;
          }
          if (!valid(candidate)) throw Error("Invalid candidate.");
          const encoded = JSON.stringify(candidate);
          if (new Blob([encoded]).size > MAX_BYTES)
            throw Error("Oversized candidate.");
          localStorage.setItem(KEY, encoded);
          expected = encoded;
          current = clone(candidate);
          reason = "";
          pending = null;
          return true;
        } catch {
          pending = clone(candidate);
          reason = "write-failed";
          return false;
        }
      },
    };
  }
  window.HealthHubData = {
    KEY,
    MAX_BYTES,
    defaults,
    valid,
    parse,
    normalize,
    combine,
    open,
  };
})();
