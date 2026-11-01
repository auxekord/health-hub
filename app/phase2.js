/* Connected local workflows layered onto the recovered Kitchen application. */
(() => {
  "use strict";
  const H = window.HealthHub,
    M = window.HHModel,
    $ = (id) => document.getElementById(id),
    esc = H.esc;
  const localDay = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const shift = (day, n) => {
    const d = new Date(day + "T12:00:00");
    d.setDate(d.getDate() + n);
    return localDay(d);
  };
  const monday = (day) =>
    shift(day, -((new Date(day + "T12:00:00").getDay() + 6) % 7));
  let week = monday(localDay()),
    journalDate = localDay(),
    activeProfile = "you",
    draft = null,
    mode = "plan",
    legacyRef = null,
    lastFocus = null,
    undo = null;
  const get = () => H.state.phase2;
  if (!H.state.phase2) H.state.phase2 = M.create(H.state);
  const fmt = (n) => (n == null ? "Unknown" : Math.round(n * 10) / 10);
  const options = (values, selected) =>
    values
      .map(
        (x) =>
          `<option value="${esc(x)}" ${x === selected ? "selected" : ""}>${esc(x)}</option>`,
      )
      .join("");
  const btn = (action, label, id = "", extra = "") =>
    `<button type="button" class="btn alt sm" data-p="${action}" data-id="${esc(id)}" ${extra}>${label}</button>`;
  function notice(message, withUndo = false) {
    $("phase-status").innerHTML =
      esc(message) + (withUndo ? " " + btn("undo", "Undo") : "");
  }
  function commit(change, message, allowUndo = false) {
    if (H.store.reason()) {
      notice(
        "Saving is paused. Download recovery data or recheck saved data first.",
      );
      return false;
    }
    const before = M.clone(H.state);
    try {
      change();
      if (!M.valid(get())) throw Error("Invalid meal data");
      if (!H.store.write(H.state)) {
        H.setState(H.store.state());
        H.render();
        notice(
          "Could not save. Existing data is preserved; review the recovery notice.",
        );
        return false;
      }
      H.setState(H.store.state());
      undo = allowUndo ? before : null;
      H.render();
      notice(message, allowUndo);
      return true;
    } catch {
      H.setState(before);
      notice("Invalid meal data. Check quantities, sources and links.");
      return false;
    }
  }
  function legacyMeals() {
    const rows = [];
    for (const l of H.state.logs) {
      const m = M.blankMeal(M.date(l.date) ? l.date : localDay());
      Object.assign(m, {
        id: "legacy-meal-" + l.id,
        name: l.name,
        date: l.date,
        profile: "you",
        time: "12:00",
        kind: "Home-cooked",
        legacy: { array: "logs", id: l.id },
      });
      m.components = [M.blankComponent(l.name)];
      m.notes =
        "Imported from original meal log; household profile and quantities were not recorded. Review before using totals.";
      delete m.portions;
      rows.push(m);
    }
    for (const f of H.state.foodEntries) {
      for (const profile of ["you", "wife"]) {
        const q = f[profile === "you" ? "myG" : "wifeG"];
        if (!q) continue;
        const m = M.blankMeal(f.date);
        Object.assign(m, {
          id: "legacy-food-" + f.id + "-" + profile,
          name: f.name,
          profile,
          kind: "Packaged",
          legacy: { array: "foodEntries", id: f.id, profile },
        });
        m.components = [
          {
            ...M.blankComponent(f.name),
            quantity: q,
            unit: "g",
            nutrients: Object.fromEntries(
              M.NUTRIENTS.map((k) => [k, f[k] == null ? null : f[k] / 100]),
            ),
            status: "estimate",
            source:
              f.source ||
              "Original food log; label-reported, not independently verified",
          },
        ];
        delete m.portions;
        rows.push(m);
      }
    }
    return rows;
  }
  const actual = () => [...get().journal, ...legacyMeals()];
  function removeLegacy(ref) {
    if (!ref) return;
    if (ref.array === "logs")
      H.state.logs = H.state.logs.filter((x) => x.id !== ref.id);
    else {
      const food = H.state.foodEntries.find((x) => x.id === ref.id);
      if (food) food[ref.profile === "you" ? "myG" : "wifeG"] = 0;
      H.state.foodEntries = H.state.foodEntries.filter((x) => x.myG || x.wifeG);
    }
  }
  function nutrition(s, profile, planned = false) {
    const p = get().profiles[profile],
      target = (n) => (n == null ? "Not set" : fmt(n));
    return `<div><span class="eyebrow">${esc(p.name)} · ${planned ? "PLANNED" : "ACTUAL"}</span><b>${fmt(s.kcal)} / ${target(p.calories)} kcal</b><small>${fmt(s.protein)} / ${target(p.protein)} g protein</small>${p.calories > 0 ? `<progress aria-label="${esc(p.name)} ${planned ? "planned" : "actual"} calories" max="${p.calories}" value="${s.kcal}"></progress>` : ""}${p.protein > 0 ? `<progress aria-label="${esc(p.name)} ${planned ? "planned" : "actual"} protein" max="${p.protein}" value="${s.protein}"></progress>` : ""}<small>${s.partial ? "Partial: quantities or nutrients missing. " : ""}${s.estimated ? "Includes estimates. " : ""}${s.count ? "" : "No meals recorded. "}${planned ? "Planning does not count as eaten." : ""}</small></div>`;
  }
  function mealSummary(m, profile) {
    const t = M.total(m, profile);
    return `${fmt(t.values.kcal)} kcal · ${fmt(t.values.protein)} g protein${t.partial.kcal || t.partial.protein ? " · partial" : ""}${t.estimated ? " · estimate" : ""}`;
  }
  function recipeButton(m) {
    return m.recipeId ? btn("cook", "Cooking instructions", m.recipeId) : "";
  }
  function planCard(m) {
    return `<article class="plan-meal" data-plan-id="${m.id}"><strong>${esc(m.name)}</strong><small>${esc(m.category)} · ${esc(m.time)}</small>${[
      "you",
      "wife",
    ]
      .filter((k) => m.portions[k] > 0)
      .map(
        (k) =>
          `<small>${esc(get().profiles[k].name)} × ${fmt(m.portions[k])}: ${mealSummary(m, k)}</small>`,
      )
      .join(
        "",
      )}<div class="plan-actions">${btn("edit-plan", "Edit", m.id)}${btn("move-plan", "Move", m.id)}${btn("duplicate-plan", "Duplicate", m.id)}${btn("replace-plan", "Replace", m.id)}${btn("eat", "Log as eaten", m.id)}${m.portions.you > 0 && m.portions.wife > 0 ? btn("eat", "Log for " + esc(get().profiles.wife.name), m.id, 'data-profile="wife"') : ""}${btn("delete-plan", "Remove", m.id)}${recipeButton(m)}</div></article>`;
  }
  function renderToday() {
    const day = localDay(),
      plans = get()
        .plans.filter((m) => m.date === day)
        .sort((a, b) => a.time.localeCompare(b.time)),
      logs = actual().filter(
        (m) => m.date === day && m.profile === activeProfile,
      );
    const s = M.summary(logs, activeProfile);
    $("today-connected").innerHTML =
      `<p class="eyebrow">PLAN IT. LIVE IT. TRACK IT.</p><h1 class="headline">Here's where<br><span class="lime">you stand.</span></h1><label class="phase-label">Household member<select id="today-profile">${["you", "wife"].map((k) => `<option value="${k}" ${k === activeProfile ? "selected" : ""}>${esc(get().profiles[k].name)}</option>`).join("")}</select></label><div class="phase-summary">${nutrition(s, activeProfile)}${nutrition(
        M.summary(
          plans.filter((m) => m.portions[activeProfile] > 0),
          activeProfile,
        ),
        activeProfile,
        true,
      )}</div><div class="actionbar">${btn("quick-log", "Quick log a meal")}${btn("today-plan", "Plan today")}</div><p class="phase-muted">${logs.length ? (s.partial ? "Some nutrition is unknown. Review the meal components to improve your totals." : get().profiles[activeProfile].protein === null ? "No protein target set. Configure optional goals in Plan." : s.protein < get().profiles[activeProfile].protein ? "Protein is below your daily target so far. Log what actually happened." : "Your logged protein has reached today’s target.") : "Plan changed? Log what actually happened. No meals are counted as eaten until you save a journal entry."}</p><div class="split"><div class="panel"><h2>Planned for today · next meal first</h2>${plans.length ? plans.map(planCard).join("") : '<p class="empty">Your next meal starts here. Add a meal in Plan.</p>'}</div><div class="panel"><h2>Actually eaten today</h2>${logs.length ? logs.map((m) => `<div class="entry"><strong>${esc(m.name)}</strong><small>${mealSummary(m, activeProfile)}</small>${btn("edit-journal", "Correct entry", m.id)}</div>`).join("") : '<p class="empty">Nothing logged for this profile yet.</p>'}</div></div>`;
  }
  function renderPlan() {
    const days = Array.from({ length: 7 }, (_, i) => shift(week, i)),
      plans = get().plans.filter((m) => days.includes(m.date));
    $("week-connected").innerHTML =
      `<p class="eyebrow">YOUR WEEK IS TAKING SHAPE</p><h1 class="headline">Plan your<br><span class="lime">rotation.</span></h1><div class="row">${btn("previous-week", "← Previous week")}<h2 id="week-title">${week} – ${days[6]}</h2>${btn("next-week", "Next week →")}</div><div class="actionbar">${btn("current-week", "This week")}${btn("reuse-week", "Reuse previous week")}${btn("browse-plan-restaurants", "Find restaurants")}${btn("add-plan", "Add planned meal", "", `data-date="${week}"`)}<a class="btn ghost" href="#shopping-list">Groceries for this week</a></div><div class="phase-summary">${[
        "you",
        "wife",
      ]
        .map((k) => {
          const s = M.summary(
            plans.filter((m) => m.portions[k] > 0),
            k,
          );
          return `<div><span class="eyebrow">${esc(get().profiles[k].name)} · WEEK PLAN</span><b>${fmt(s.kcal)} / ${get().profiles[k].calories === null ? "Not set" : fmt(get().profiles[k].calories * 7)} kcal</b><small>${fmt(s.protein)} / ${get().profiles[k].protein === null ? "Not set" : fmt(get().profiles[k].protein * 7)} g protein · ${s.partial ? "Partial nutrition" : "Recorded nutrition"}${s.estimated ? " · estimates" : ""}</small></div>`;
        })
        .join("")}</div><div class="week-grid">${days
        .map(
          (day) =>
            `<section class="week-day ${day === localDay() ? "today" : ""}" data-day="${day}"><h3>${new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</h3>${btn("add-plan", "+ Add meal", "", `data-date="${day}"`)}${M.CATEGORIES.map(
              (cat) =>
                `<div class="meal-slot" data-category="${cat}"><p class="eyebrow">${cat}</p>${
                  plans
                    .filter((m) => m.date === day && m.category === cat)
                    .map(planCard)
                    .join("") || '<small class="muted">Not planned</small>'
                }</div>`,
            ).join("")}<p class="day-total">${["you", "wife"]
              .map((k) => {
                const s = M.summary(
                  plans.filter((m) => m.date === day && m.portions[k] > 0),
                  k,
                );
                return `${esc(get().profiles[k].name)}: ${fmt(s.kcal)} kcal · ${fmt(s.protein)} g protein${s.partial ? " · partial" : ""}`;
              })
              .join("<br>")}</p></section>`,
        )
        .join(
          "",
        )}</div>${shopping(plans)}<details class="phase-advanced"><summary>Household goals</summary><form id="profile-form" class="phase-fields">${["you", "wife"].map((k) => `<fieldset><legend>${esc(get().profiles[k].name)}</legend><label>Name<input name="${k}-name" value="${esc(get().profiles[k].name)}" required maxlength="80"></label><label>Daily calorie target<input name="${k}-calories" type="number" min="1" max="10000" value="${get().profiles[k].calories ?? ""}"></label><label>Daily protein target (g)<input name="${k}-protein" type="number" min="0" max="1000" value="${get().profiles[k].protein ?? ""}"></label><label>Goal weight (lb, 0 = no target)<input name="${k}-goalWeight" type="number" min="0" max="1000" step="0.1" value="${get().profiles[k].goalWeight ?? ""}"></label></fieldset>`).join("")}<button class="btn" type="submit">Save household goals</button></form></details><div class="feature-ribbon"><span>ORIGINAL KITCHEN</span><strong>Your recipes and cooking cards</strong><small>Discovery and the Kitchen scratchpad below remain available. These selections are separate from your dated plan.</small></div>`;
  }
  function shopping(plans) {
    const items = M.groceries(plans),
      manual = get().shopping.manual;
    const categories = {
      protein: "Protein",
      grain: "Grains & starches",
      veg: "Produce",
      fat: "Fats & oils",
      sauce: "Sauces",
      spice: "Spices & seasonings",
      other: "Other groceries",
    };
    const row = (item, isManual = false) => {
      const o = isManual
        ? item
        : get().shopping.overrides[week + "|" + item.id] || {
            checked: false,
            onHand: false,
            quantity: null,
          };
      const q = o.quantity ?? item.quantity;
      return `<div class="shopping-row ${o.checked ? "is-done" : ""}" data-shop-id="${esc(item.id)}" data-manual="${isManual}"><input aria-label="Bought ${esc(item.name)}" type="checkbox" data-shop="checked" ${o.checked ? "checked" : ""}><div><strong>${esc(item.name)}</strong><small>${o.onHand ? "Already at home" : "Required"}${item.unknown ? " · quantity incomplete" : ""}${o.quantity !== null && !isManual ? " · edited quantity" : ""}</small><label class="mini"><input type="checkbox" data-shop="onHand" ${o.onHand ? "checked" : ""}> On hand</label>${isManual ? btn("delete-manual", "Remove", item.id) : btn("reset-shop", "Use plan amount", item.id)}</div><input aria-label="Quantity of ${esc(item.name)}" data-shop="quantity" type="number" min="0" max="100000000" step="any" value="${q === null ? "" : fmt(q)}"><small>${esc(item.unit)}</small></div>`;
    };
    return `<section class="panel" id="shopping-list"><h2>Groceries · ${week}</h2><p class="notice">For this displayed week's plan only. Restaurant meals excluded. Compatible mass/volume units combine; cups, pieces and servings stay separate. Unknown portions need review. Edits and checkoffs stay attached to each ingredient in this week until reset. Manual items carry forward.</p>${
      Object.entries(categories)
        .map(([cat, label]) => {
          const selected = items.filter(
            (x) => (categories[x.category] ? x.category : "other") === cat,
          );
          return selected.length
            ? `<details open><summary>${label}</summary>${selected.map((x) => row(x)).join("")}</details>`
            : "";
        })
        .join("") ||
      '<p class="empty">Plan a home meal to build your grocery list.</p>'
    }<h3>Manual items</h3>${manual.map((x) => row(x, true)).join("")}<form id="manual-grocery-form" class="phase-fields"><label>Item name<input name="name" required maxlength="150"></label><label>Quantity<input name="quantity" type="number" min="0.01" max="1000000" step="any" value="1" required></label><label>Unit<select name="unit">${options(M.UNITS, "piece")}</select></label><button class="btn" type="submit">Add grocery item</button></form></section>`;
  }
  function renderJournal() {
    const entries = actual()
      .filter((m) => m.date === journalDate)
      .sort((a, b) => b.time.localeCompare(a.time));
    $("journal-connected").innerHTML =
      `<p class="eyebrow">RECORD WHAT ACTUALLY HAPPENED</p><h1 class="headline">Your food.<br><span class="lime">Your journal.</span></h1><label class="phase-label">Journal date<input id="journal-date" type="date" value="${journalDate}"></label><div class="actionbar">${btn("quick-log", "Add a meal")}${btn("restaurant", "Restaurant meal")}${btn("discover", "Find packaged foods")}</div><div class="phase-summary">${[
        "you",
        "wife",
      ]
        .map((k) =>
          nutrition(
            M.summary(
              entries.filter((m) => m.profile === k),
              k,
            ),
            k,
          ),
        )
        .join(
          "",
        )}</div><div class="phase-journal">${entries.map((m) => `<article class="panel" data-journal-id="${esc(m.id)}"><div class="row"><h2>${esc(m.name)}</h2><span class="pill">${esc(get().profiles[m.profile].name)} · ${esc(m.category)}</span></div><p>${esc(m.time)} · ${esc(m.kind)}${m.restaurant ? " · " + esc(m.restaurant) : ""}${m.location ? " · " + esc(m.location) : ""}</p><p class="lime">${mealSummary(m, m.profile)}</p>${m.plannedId ? '<p class="mini">Logged from a plan. Original plan retained.</p>' : ""}<details><summary>Components, sources &amp; notes</summary>${m.components.map((c) => `<p>${esc(c.name)} · ${fmt(c.quantity)} ${esc(c.unit)}<br><small>${esc(c.status)} · ${esc(c.source || "No nutrition source provided")}</small></p>`).join("")}<p>${esc(m.notes)}</p>${m.leftovers ? "<p>Leftovers: " + esc(m.leftovers) + "</p>" : ""}</details><div class="actionbar">${btn("edit-journal", "Edit entry", m.id)}${btn("favorite-journal", "Save favorite", m.id)}${btn("repeat-journal", "Repeat on another day", m.id)}${btn("delete-journal", "Remove entry", m.id)}</div></article>`).join("") || '<p class="empty">No meals recorded on this date.</p>'}</div><details class="phase-advanced"><summary>Saved meals &amp; favorites (${get().favorites.length})</summary>${
        get()
          .favorites.map(
            (m) =>
              `<div class="entry"><strong>${esc(m.name)}</strong>${btn("use-favorite", "Log favorite", m.id)}${btn("plan-favorite", "Plan favorite", m.id)}${btn("delete-favorite", "Remove favorite", m.id)}</div>`,
          )
          .join("") ||
        "<p>No saved meals yet. Save a journal plate as a favorite.</p>"
      }</details>`;
  }
  function renderProgress() {
    const days = Array.from({ length: 7 }, (_, i) => shift(week, i)),
      all = actual();
    $("progress-connected").innerHTML =
      `<p class="eyebrow">CONSISTENCY OVER PERFECTION</p><h1 class="headline">Learn from<br><span class="lime">your week.</span></h1><div class="row">${btn("previous-week", "← Previous week")}<h2>${week} – ${days[6]}</h2>${btn("next-week", "Next week →")}</div>${[
        "you",
        "wife",
      ]
        .map((k) => {
          const entries = all.filter(
              (m) => m.profile === k && days.includes(m.date),
            ),
            plans = get().plans.filter(
              (m) => days.includes(m.date) && m.portions[k] > 0,
            ),
            s = M.summary(entries, k),
            p = M.summary(plans, k);
          const knownDays = days.filter((d) => {
            const rows = entries.filter((m) => m.date === d);
            const t = M.summary(rows, k);
            return (
              rows.length &&
              !t.partial &&
              get().profiles[k].protein !== null &&
              t.protein >= get().profiles[k].protein
            );
          }).length;
          return `<section class="panel"><h2>${esc(get().profiles[k].name)} · weekly review</h2><div class="phase-summary"><div><b>${fmt(p.kcal)} kcal planned</b><small>${fmt(p.protein)} g protein${p.partial ? " · partial" : ""}</small></div><div><b>${fmt(s.kcal)} kcal recorded</b><small>${fmt(s.protein)} g protein${s.partial ? " · partial" : ""}${s.estimated ? " · includes estimates" : ""}</small></div></div><p>${knownDays} of 7 days have complete recorded nutrition at or above the protein target. Missing logs do not mean zero intake.</p><div class="trend-scroll"><table class="trend-table"><caption>Planned versus actual · calories / protein</caption><thead><tr><th scope="col">Date</th><th scope="col">Plan</th><th scope="col">Actual</th></tr></thead><tbody>${days
            .map((d) => {
              const pp = M.summary(
                  plans.filter((m) => m.date === d),
                  k,
                ),
                aa = M.summary(
                  entries.filter((m) => m.date === d),
                  k,
                );
              return `<tr><th scope="row">${d}</th><td>${fmt(pp.kcal)} / ${fmt(pp.protein)}g${pp.partial ? " *" : ""}</td><td>${aa.count ? `${fmt(aa.kcal)} / ${fmt(aa.protein)}g${aa.partial ? " *" : ""}` : "Not logged"}</td></tr>`;
            })
            .join(
              "",
            )}</tbody></table></div><h3>Weight trend · ${esc(get().profiles[k].name)}</h3><p class="mini">${get().profiles[k].goalWeight ? "Goal: " + fmt(get().profiles[k].goalWeight) + " lb" : "No weight goal set"}</p><div class="stack">${
            [
              ...(get().weights || []).filter((w) => w.profile === k),
              ...(k === "you"
                ? H.state.weight.map((w, i) => ({
                    id: "legacy-weight-" + i,
                    date: w.at.slice(0, 10),
                    value: w.value,
                    legacy: true,
                  }))
                : []),
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 12)
              .map(
                (w) =>
                  `<div class="entry"><strong>${fmt(w.value)} lb · ${esc(w.date)}</strong>${w.legacy ? "<small>Original weight history</small>" : btn("remove-weight", "Remove weight", w.id)}</div>`,
              )
              .join("") || "<p>No weights recorded for this profile.</p>"
          }</div><form class="phase-fields weight-profile-form" data-profile="${k}"><label>Weight date<input name="date" type="date" value="${localDay()}" required></label><label>Weight (lb)<input name="weight" type="number" min="40" max="1000" step="0.1" required></label><button class="btn" type="submit">Record ${esc(get().profiles[k].name)} weight</button></form><p class="notice">* Partial nutrition. Targets describe your plan, not a predicted weight change. ${s.count ? "Review missing components before comparing totals." : "Log meals to start learning from your week."}</p></section>`;
        })
        .join(
          "",
        )}<p class="notice">Existing weight and step history remain below. Original weight history belongs to You; no weight history is inferred for the other household member.</p>`;
  }
  function render() {
    if (!H.state.phase2) H.state.phase2 = M.create(H.state);
    renderToday();
    renderPlan();
    renderJournal();
    renderProgress();
  }
  const dialog = document.createElement("dialog");
  dialog.id = "meal-editor";
  dialog.className = "phase-dialog";
  dialog.setAttribute("aria-labelledby", "meal-editor-title");
  document.body.append(dialog);
  const status = document.createElement("div");
  status.id = "phase-status";
  status.className = "phase-toast";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  document.body.append(status);
  function editor(m, kind = "plan", ref = null) {
    lastFocus = document.activeElement;
    draft = M.clone(m);
    mode = kind;
    legacyRef = ref;
    drawEditor();
    if (!dialog.open) dialog.showModal();
    $("meal-name").focus();
  }
  function closeEditor() {
    dialog.close();
    draft = null;
    lastFocus?.focus();
  }
  function componentHTML(c, i) {
    return `<details class="component-editor" data-component="${esc(c.id)}" open><summary>Component ${i + 1}: ${esc(c.name || "New food")}</summary><div class="phase-fields"><label>Food name<input data-field="name" value="${esc(c.name)}" required maxlength="150"></label><label>Quantity<input data-field="quantity" type="number" min="0" max="1000000" step="any" value="${c.quantity ?? ""}" placeholder="Unknown"></label><label>Measurement unit<select data-field="unit" data-previous-unit="${esc(c.unit)}">${options(M.UNITS, c.unit)}</select></label>${mode === "plan" ? `<label>Wife's base quantity (optional)<input data-field="wifeQuantity" type="number" min="0" max="1000000" step="any" value="${c.wifeQuantity ?? ""}" placeholder="Same as quantity"></label>` : ""}<label>Nutrition status<select data-field="status">${[
      ["unknown", "Unknown"],
      ["estimate", "Reference-food estimate"],
      [
        "verified",
        draft.kind === "Restaurant"
          ? "Restaurant-published nutrition"
          : "Published or label nutrition",
      ],
    ]
      .map(
        ([v, label]) =>
          `<option value="${v}" ${v === c.status ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select></label><label class="phase-wide">Nutrition source / editable assumptions<input data-field="source" value="${esc(c.source)}" maxlength="500" placeholder="Label, official menu, reference food or unknown"></label><label>Preparation details<input data-field="preparation" value="${esc(c.preparation || "")}" placeholder="Optional: cooked, skin, additions"></label>${mode === "journal" ? `<label>Portion actually consumed (%)<input data-field="consumedPercent" type="number" min="0" max="100" step="any" value="${(c.consumedFraction ?? 1) * 100}"></label>` : ""}<label>Grocery category<select data-field="group">${options(["protein", "grain", "veg", "fat", "sauce", "spice", "other"], c.group || "other")}</select></label></div><details class="phase-advanced"><summary>Nutrition per ${fmt(c.nutritionBasis ?? 1)} ${esc(c.unit)} · blank means unknown</summary><p class="notice">Enter numbers from the source, then its serving basis. The app calculates your portion; no manual division is needed. Published restaurant data must match the restaurant and serving basis. Estimates are not official restaurant nutrition.</p><label class="phase-label">Nutrition given per (selected units)<input data-field="nutritionBasis" required type="number" min="0.000001" max="1000000" step="any" value="${c.nutritionBasis ?? 1}"></label><div class="phase-fields">${M.NUTRIENTS.map((k) => `<label>${{ kcal: "Calories (kcal)", protein: "Protein (g)", carbs: "Carbohydrate (g)", fat: "Fat (g)", fiber: "Fiber (g)", sodium: "Sodium (mg)", saturatedFat: "Saturated fat (g)", sugar: "Sugar (g)", addedSugar: "Added sugar (g)" }[k]} from source<input data-nutrient="${k}" type="number" min="0" max="1000000" step="any" value="${c.nutrients[k] ?? ""}" placeholder="Unknown"></label>`).join("")}</div></details>${btn("remove-component", "Remove component", c.id)}</details>`;
  }
  function drawEditor() {
    const m = draft;
    dialog.innerHTML = `<form id="meal-form"><div class="row"><h2 id="meal-editor-title">${mode === "plan" ? "Plan a meal" : "Log what you ate"}</h2>${btn("close-editor", "Cancel")}</div><p class="notice">${mode === "plan" ? "Planning never counts as eaten. Quantities are base amounts, multiplied by each person’s portion." : "Save only actual consumption for the selected profile. Edit the portions, additions and leftovers before saving."}</p><div class="phase-fields"><label class="phase-wide">Choose original recipe<select id="recipe-picker"><option value="">Keep current components / custom meal</option>${H.recipes.map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("")}</select></label><label class="phase-wide">Choose saved meal<select id="favorite-picker"><option value="">Select a favorite (optional)</option>${get()
      .favorites.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
      .join(
        "",
      )}</select></label><label>Meal name<input id="meal-name" name="name" required maxlength="150" value="${esc(m.name)}"></label><label>Date<input name="date" type="date" required value="${m.date}"></label><label>Time<input name="time" type="time" required value="${m.time}"></label><label>Meal category<select name="category">${options(M.CATEGORIES, m.category)}</select></label><label>Entry method<select name="kind">${options(M.SOURCES, m.kind)}</select></label>${mode === "journal" ? `<label>Household profile<select name="profile">${["you", "wife"].map((k) => `<option value="${k}" ${m.profile === k ? "selected" : ""}>${esc(get().profiles[k].name)}</option>`).join("")}</select></label>` : `<label>Your portion multiplier<input name="you" type="number" min="0" max="20" step="any" required value="${m.portions.you}"></label><label>Wife's portion multiplier<input name="wife" type="number" min="0" max="20" step="any" required value="${m.portions.wife}"></label><label class="phase-wide"><input type="checkbox" name="includeGroceries" ${m.includeGroceries ? "checked" : ""}> Add Custom/Packaged ingredients to groceries. Home-cooked meals are included; restaurant meals are always excluded.</label><p class="notice phase-wide">Set a multiplier to 0 to exclude that household member. Original recipe base amounts differ between people; each can be edited below.</p>`}<label>Restaurant or food source<input name="restaurant" list="restaurant-names" value="${esc(m.restaurant)}" maxlength="150" placeholder="Search saved names or enter any restaurant"></label><datalist id="restaurant-names">${get()
      .restaurants.map(
        (r) => `<option value="${esc(r.name)}">${esc(r.location)}</option>`,
      )
      .join(
        "",
      )}</datalist><label>Location<input name="location" value="${esc(m.location)}" maxlength="150"></label><label class="phase-wide">Notes / portion assumptions<textarea name="notes" maxlength="2000">${esc(m.notes)}</textarea></label>${mode === "journal" ? `<label class="phase-wide">Leftovers not eaten<textarea name="leftovers" maxlength="1000" placeholder="Describe what was left; only eaten quantities belong below.">${esc(m.leftovers)}</textarea></label>` : ""}</div>${m.kind === "Restaurant" ? `<div class="actionbar">${btn("choose-restaurant", "Find or reuse restaurant")}</div><p class="notice">No official menu is assumed. Enter what you actually selected; unknown portions and nutrients may stay blank.</p>` : ""}<h3>Build your plate</h3><p class="notice">Unknown amounts may be left blank. No restaurant quantities or nutrition are assumed for you.</p><div id="component-list">${m.components.map(componentHTML).join("")}</div>${btn("add-component", "+ Add component")}<div id="editor-totals" class="phase-summary"></div><p id="editor-error" class="phase-error" role="alert"></p><div class="actionbar"><button class="btn" id="save-meal" type="submit">${mode === "plan" ? "Save planned meal" : "Save journal entry"}</button>${btn("close-editor", "Cancel")}</div></form>`;
    preview();
  }
  function readEditor() {
    const form = $("meal-form");
    if (!form) return;
    for (const k of [
      "name",
      "date",
      "time",
      "category",
      "kind",
      "restaurant",
      "location",
      "notes",
      "leftovers",
      "profile",
    ])
      if (form.elements.namedItem(k))
        draft[k] = form.elements.namedItem(k).value.trim();
    if (
      mode === "plan" &&
      (draft.includeGroceries !== undefined ||
        form.elements.includeGroceries.checked)
    )
      draft.includeGroceries = form.elements.includeGroceries.checked;
    if (mode === "plan")
      draft.portions = {
        you: Number(form.elements.you.value),
        wife: Number(form.elements.wife.value),
      };
    for (const el of dialog.querySelectorAll("[data-component]")) {
      const c = draft.components.find((x) => x.id === el.dataset.component);
      const before = {name:c.name, unit:c.unit, preparation:c.preparation || "", basis:c.nutritionBasis ?? 1, nutrients:M.clone(c.nutrients), source:c.source};
      for (const input of el.querySelectorAll("[data-field]")) {
        const k = input.dataset.field;
        if (k === "consumedPercent") {
          if (c.consumedFraction !== undefined || Number(input.value) !== 100)
            c.consumedFraction = Number(input.value) / 100;
        } else if (k === "nutritionBasis") {
          if (c.nutritionBasis !== undefined || Number(input.value) !== 1)
            c.nutritionBasis = Number(input.value);
        } else if (["quantity", "wifeQuantity"].includes(k)) {
          if (k === "wifeQuantity" && input.value === "") delete c[k];
          else c[k] = input.value === "" ? null : Number(input.value);
        } else if (
          k !== "preparation" ||
          c.preparation !== undefined ||
          input.value.trim() !== ""
        )
          c[k] = input.value.trim();
      }
      const heading = el.querySelector(".phase-advanced>summary");
      if (heading)
        heading.textContent = `Nutrition per ${fmt(c.nutritionBasis ?? 1)} ${c.unit} · blank nutrients mean unknown`;
      for (const input of el.querySelectorAll("[data-nutrient]"))
        if (input.value !== "" || Object.hasOwn(c.nutrients,input.dataset.nutrient))
          c.nutrients[input.dataset.nutrient] = input.value === "" ? null : Number(input.value);
      if (c.catalog && (c.name !== before.name || c.unit !== before.unit || (c.preparation || "") !== before.preparation || (c.nutritionBasis ?? 1) !== before.basis)) {
        c.catalog.modification = "Changed standard item; review nutrition source for this modification.";
        c.status = "unknown";
        c.source = "Original menu: " + c.catalog.sourceUrl + "; modified order nutrition unknown.";
        for (const k of M.NUTRIENTS) c.nutrients[k] = null;
        for (const input of el.querySelectorAll("[data-nutrient]")) input.value = "";
        el.querySelector('[data-field="status"]').value = "unknown";
        el.querySelector('[data-field="source"]').value = c.source;
      } else if (c.catalog && c.source === before.source && M.NUTRIENTS.some(k => c.nutrients[k] !== before.nutrients[k])) {
        c.catalog.modification = "User-edited nutrient values; no longer a standard published item.";
        c.status = "estimate";
        c.source = "User-edited estimate; original menu: " + c.catalog.sourceUrl;
        el.querySelector('[data-field="status"]').value = c.status;
        el.querySelector('[data-field="source"]').value = c.source;
      }
    }
  }
  function preview() {
    if (!draft) return;
    $("editor-totals").innerHTML = (
      mode === "plan"
        ? ["you", "wife"].filter((k) => draft.portions[k] > 0)
        : [draft.profile]
    )
      .map(
        (k) =>
          `<div><span class="eyebrow">${esc(get().profiles[k]?.name || k)}</span><b>${mealSummary(draft, k)}</b></div>`,
      )
      .join("");
  }
  function saveMeal(e) {
    e.preventDefault();
    if (!draft) return;
    readEditor();
    const error = $("editor-error");
    if (draft.components.length === 0) {
      error.textContent = "Add at least one food component.";
      return;
    }
    for (const c of draft.components) {
      if (
        c.nutrients.kcal !== null ||
        M.NUTRIENTS.some((k) => c.nutrients[k] !== null)
      ) {
        if (c.status === "unknown") {
          error.textContent =
            "Choose estimate or verified for entered nutrition and describe its source.";
          return;
        }
        if (!c.source.trim()) {
          error.textContent =
            "Add the nutrition source and any portion assumptions.";
          return;
        }
      }
    }
    if (
      mode === "journal" &&
      draft.components.every(
        (c) => c.quantity === 0 || c.consumedFraction === 0,
      )
    ) {
      error.textContent =
        "At least one eaten quantity must be greater than zero or explicitly unknown.";
      return;
    }
    if (mode === "journal" && draft.plannedId) {
      const duplicate = get().journal.find(
        (m) =>
          m.plannedId === draft.plannedId &&
          m.date === draft.date &&
          m.profile === draft.profile &&
          m.id !== draft.id,
      );
      if (duplicate) {
        error.textContent =
          "This planned meal is already logged for that profile and date. Edit the existing entry instead.";
        return;
      }
    }
    const copy = M.clone(draft);
    const originalEntry = get().journal.find((x) => x.id === copy.id);
    if (
      mode === "journal" &&
      originalEntry &&
      originalEntry.profile !== copy.profile
    )
      copy.id = M.id();
    delete copy.legacy;
    const ok = commit(
      () => {
        const list = mode === "plan" ? get().plans : get().journal;
        const ix = list.findIndex((x) => x.id === copy.id);
        if (ix >= 0) list[ix] = copy;
        else list.push(copy);
        removeLegacy(legacyRef);
        if (
          copy.kind === "Restaurant" &&
          copy.restaurant &&
          !get().restaurants.some(
            (r) =>
              r.name.toLowerCase() === copy.restaurant.toLowerCase() &&
              r.location === copy.location,
          )
        )
          get().restaurants.push({
            id: M.id(),
            name: copy.restaurant,
            location: copy.location,
            provider: "local",
            placeId: null,
            address: "",
            website: "",
            menuUrl: "",
            source: "User-entered; not independently verified",
            lastChecked: null,
          });
      },
      mode === "plan"
        ? "Meal planned. It has not been logged as eaten."
        : "Meal saved. You can edit it in Journal.",
    );
    if (ok) {
      journalDate = copy.date;
      closeEditor();
      H.nav(mode === "plan" ? "plan" : "journal");
    } else
      error.textContent =
        "Unable to save. Check all fields and browser storage.";
  }
  function browseRestaurants(target) {
    const prior = draft ? M.clone(draft) : null;
    const day = draft?.date || (target === "plan" ? week : journalDate);
    window.HHRestaurants.open({
      mode: target,
      date: day,
      actual,
      commit,
      activeProfile,
      profiles: () => get().profiles,
      onPlate(r) {
        const m = prior || M.blankMeal(day);
        Object.assign(m, {
          kind: "Restaurant",
          name: r.name + " plate",
          restaurant: r.name,
          restaurantId: r.id,
          location: r.location,
        });
        if (target === "journal") {
          m.profile = activeProfile;
          delete m.portions;
        }
        editor(m, target);
      },
      onReuse(saved, r, selectedProfile) {
        const m = M.clone(saved);
        Object.assign(m, {
          id: M.id(),
          date: day,
          plannedId: null,
          restaurant: r.name,
          restaurantId: r.id,
          location: r.location,
        });
        m.components.forEach((c) => (c.id = M.id()));
        if (target === "plan") {
          delete m.profile;
          m.portions ??= { you: 1, wife: 1 };
          if (selectedProfile) m.portions = {you:selectedProfile === "you" ? 1 : 0, wife:selectedProfile === "wife" ? 1 : 0};
        } else {
          m.profile = selectedProfile || activeProfile;
          delete m.portions;
        }
        editor(m, target);
      },
      onEdit(m) {
        editor(m, "journal", m.legacy);
      },
    });
  }
  function newJournal(kind = "Custom") {
    const m = M.blankMeal(journalDate);
    m.profile = activeProfile;
    m.time = new Date().toTimeString().slice(0, 5);
    m.kind = kind;
    delete m.portions;
    editor(m, "journal");
  }
  function favorite(m) {
    return commit(() => {
      const copy = M.clone(m);
      delete copy.profile;
      delete copy.legacy;
      copy.portions = { you: 1, wife: 1 };
      copy.plannedId = null;
      copy.id = M.id();
      if (
        !get().favorites.some(
          (x) =>
            x.name === copy.name &&
            JSON.stringify(x.components.map((c) => ({ ...c, id: "" }))) ===
              JSON.stringify(copy.components.map((c) => ({ ...c, id: "" }))),
        )
      )
        get().favorites.push(copy);
    }, "Meal saved to favorites.");
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-p]");
    if (!button) return;
    const action = button.dataset.p,
      id = button.dataset.id;
    if (action === "close-editor") {
      closeEditor();
      return;
    }
    if (
      H.store.reason() &&
      ![
        "previous-week",
        "next-week",
        "current-week",
        "discover",
        "close-editor",
      ].includes(action)
    ) {
      notice("Refresh to load changes from the other tab before editing.");
      return;
    }
    const plan = get().plans.find((m) => m.id === id),
      entry = actual().find((m) => m.id === id),
      fav = get().favorites.find((m) => m.id === id);
    if (action === "undo" && undo) {
      const restored = M.clone(undo);
      commit(() => {
        Object.keys(H.state).forEach((k) => delete H.state[k]);
        Object.assign(H.state, restored);
      }, "Change undone.");
    } else if (
      ["previous-week", "next-week", "current-week"].includes(action)
    ) {
      week =
        action === "current-week"
          ? monday(localDay())
          : shift(week, action === "next-week" ? 7 : -7);
      render();
    } else if (action === "today-plan") {
      week = monday(localDay());
      H.nav("plan");
    } else if (action === "discover") {
      H.nav("nutrition");
    } else if (action === "quick-log") {
      newJournal();
    } else if (action === "browse-plan-restaurants") {
      browseRestaurants("plan");
    } else if (action === "restaurant") {
      browseRestaurants("journal");
    } else if (action === "choose-restaurant") {
      readEditor();
      browseRestaurants(mode);
    } else if (action === "add-plan") {
      editor(M.blankMeal(button.dataset.date || localDay()));
    } else if (["edit-plan", "move-plan"].includes(action) && plan) {
      editor(plan);
      if (action === "move-plan") dialog.querySelector("[name=date]").focus();
    } else if (action === "duplicate-plan" && plan) {
      const m = M.clone(plan);
      m.id = M.id();
      m.components.forEach((c) => (c.id = M.id()));
      editor(m);
      notice("Choose the new date before saving the duplicate.");
    } else if (action === "replace-plan" && plan) {
      const m = M.blankMeal(plan.date);
      Object.assign(m, {
        id: plan.id,
        time: plan.time,
        category: plan.category,
        portions: plan.portions,
      });
      editor(m);
    } else if (action === "delete-plan") {
      commit(
        () => {
          get().plans = get().plans.filter((m) => m.id !== id);
        },
        "Planned meal removed. Actual entries are unchanged.",
        true,
      );
    } else if (action === "eat" && plan) {
      const wanted = button.dataset.profile || activeProfile;
      const profile =
        plan.portions[wanted] > 0
          ? wanted
          : ["you", "wife"].find((k) => plan.portions[k] > 0);
      const existing = get().journal.find(
        (m) =>
          m.plannedId === id && m.profile === profile && m.date === plan.date,
      );
      if (existing) {
        editor(existing, "journal");
        notice("Already logged. You are editing the existing entry.");
      } else editor(M.consumed(plan, profile), "journal");
    } else if (action === "cook") {
      if (!H.state.selected.includes(id)) H.state.selected.push(id);
      H.save();
      H.nav("plan");
      const card = document.querySelector(
        `[data-fold="recipe-${CSS.escape(id)}"]`,
      );
      if (card) {
        card.open = true;
        card.scrollIntoView({ block: "start" });
      }
      notice(
        "Original cooking card. Use your planned quantities when preparing this meal.",
      );
    } else if (action === "edit-journal" && entry) {
      editor(entry, "journal", entry.legacy);
    } else if (action === "repeat-journal" && entry) {
      const m = M.clone(entry);
      m.id = M.id();
      m.date = localDay();
      m.plannedId = null;
      m.components.forEach((c) => (c.id = M.id()));
      delete m.legacy;
      editor(m, "journal");
    } else if (action === "delete-journal" && entry) {
      commit(
        () => {
          get().journal = get().journal.filter((m) => m.id !== id);
          removeLegacy(entry.legacy);
        },
        "Journal entry removed.",
        true,
      );
    } else if (action === "favorite-journal" && entry) {
      favorite(entry);
    } else if (["use-favorite", "plan-favorite"].includes(action) && fav) {
      const m = M.clone(fav);
      m.id = M.id();
      m.date = localDay();
      m.components.forEach((c) => (c.id = M.id()));
      if (action === "use-favorite") {
        m.profile = activeProfile;
        delete m.portions;
        editor(m, "journal");
      } else editor(m);
    } else if (action === "remove-weight") {
      commit(
        () => {
          get().weights = (get().weights || []).filter((w) => w.id !== id);
        },
        "Weight record removed.",
        true,
      );
    } else if (action === "delete-favorite") {
      commit(
        () => {
          get().favorites = get().favorites.filter((m) => m.id !== id);
        },
        "Favorite removed.",
        true,
      );
    } else if (action === "reuse-week") {
      const previous = get().plans.filter(
        (m) => m.date >= shift(week, -7) && m.date < week,
      );
      if (!previous.length) {
        notice("No meals in the previous week to reuse.");
        return;
      }
      commit(() => {
        for (const source of previous) {
          const day = shift(source.date, 7);
          if (
            get().plans.some(
              (m) =>
                m.date === day &&
                m.category === source.category &&
                m.name === source.name,
            )
          )
            continue;
          const m = M.clone(source);
          m.id = M.id();
          m.date = day;
          m.components.forEach((c) => (c.id = M.id()));
          get().plans.push(m);
        }
      }, "Previous week reused. Existing matching meals were kept.");
    } else if (action === "add-component") {
      readEditor();
      draft.components.push(M.blankComponent());
      drawEditor();
      dialog.querySelector("[data-component]:last-child input").focus();
    } else if (action === "remove-component") {
      readEditor();
      draft.components = draft.components.filter((c) => c.id !== id);
      drawEditor();
    } else if (action === "delete-manual") {
      commit(
        () => {
          get().shopping.manual = get().shopping.manual.filter(
            (x) => x.id !== id,
          );
        },
        "Manual grocery removed.",
        true,
      );
    } else if (action === "reset-shop") {
      commit(() => {
        delete get().shopping.overrides[week + "|" + id];
      }, "Using planned amount. Shopping state reset for this ingredient.");
    }
  });
  document.addEventListener("input", (event) => {
    if (
      event.target.closest("#meal-form") &&
      event.target.dataset.field !== "unit"
    ) {
      readEditor();
      preview();
    }
  });
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.field === "unit" && draft) {
      const previous = target.dataset.previousUnit,
        next = target.value,
        cid = target.closest("[data-component]").dataset.component;
      readEditor();
      const c = draft.components.find((c) => c.id === cid),
        a = M.conversion[previous],
        b = M.conversion[next];
      if (a && b && a[0] === b[0]) {
        const factor = a[1] / b[1];
        if (c.quantity !== null) c.quantity *= factor;
        if (c.wifeQuantity !== undefined) c.wifeQuantity *= factor;
        c.nutritionBasis = (c.nutritionBasis ?? 1) * factor;
      } else if (previous !== next) {
        c.quantity = null;
        delete c.wifeQuantity;
        c.nutrients = Object.fromEntries(M.NUTRIENTS.map((k) => [k, null]));
        c.status = "unknown";
        c.nutritionBasis = 1;
        notice(
          "Units cannot be reliably converted. Enter the new amount and nutrition assumptions.",
        );
      }
      drawEditor();
      return;
    }
    if (target.id === "today-profile") {
      activeProfile = target.value;
      render();
    }
    if (target.id === "journal-date" && M.date(target.value)) {
      journalDate = target.value;
      renderJournal();
    }
    if (target.id === "recipe-picker" && target.value) {
      readEditor();
      const r = H.recipes.find((r) => r.id === target.value);
      const old = draft;
      draft = M.fromRecipe(r, old.date, H.state);
      Object.assign(draft, {
        id: old.id,
        time: old.time,
        plannedId: old.plannedId,
      });
      if (mode === "journal") {
        draft = M.consumed(draft, old.profile);
        draft.id = old.id;
        draft.plannedId = old.plannedId;
      }
      drawEditor();
    }
    if (target.id === "favorite-picker" && target.value) {
      readEditor();
      const saved = M.clone(get().favorites.find((f) => f.id === target.value)),
        old = draft;
      draft = saved;
      Object.assign(draft, {
        id: old.id,
        date: old.date,
        time: old.time,
        plannedId: old.plannedId,
      });
      if (mode === "journal") {
        draft.profile = old.profile;
        delete draft.portions;
      }
      drawEditor();
    }
    if (target.dataset.shop) {
      const row = target.closest("[data-shop-id]"),
        id = row.dataset.shopId,
        isManual = row.dataset.manual === "true",
        field = target.dataset.shop;
      const value =
        field === "quantity"
          ? target.value === ""
            ? null
            : Number(target.value)
          : target.checked;
      if (field === "quantity" && (value === null || !M.num(value))) {
        notice("Enter a valid non-negative quantity.");
        return;
      }
      commit(() => {
        let o;
        if (isManual) o = get().shopping.manual.find((x) => x.id === id);
        else
          o = get().shopping.overrides[week + "|" + id] ??= {
            checked: false,
            onHand: false,
            quantity: null,
          };
        o[field] = value;
      }, "Shopping list updated.");
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "meal-form") {
      if (H.store.reason()) {
        event.preventDefault();
        notice("Refresh before saving changes from this tab.");
        return;
      }
      saveMeal(event);
    }
    if (event.target.id === "manual-grocery-form") {
      event.preventDefault();
      const f = new FormData(event.target);
      const name = f.get("name").trim();
      commit(() => {
        const unit = f.get("unit"),
          q = Number(f.get("quantity"));
        const derived = M.groceries(
          get().plans.filter((m) => m.date >= week && m.date <= shift(week, 6)),
        ).find(
          (x) =>
            x.name.trim().toLowerCase() === name.toLowerCase() &&
            x.unit === unit,
        );
        if (derived) {
          const key = week + "|" + derived.id;
          const o = (get().shopping.overrides[key] ??= {
            checked: false,
            onHand: false,
            quantity: null,
          });
          o.quantity = (o.quantity ?? derived.quantity) + q;
          return;
        }
        const existing = get().shopping.manual.find(
          (x) => x.name.toLowerCase() === name.toLowerCase() && x.unit === unit,
        );
        if (existing) existing.quantity += q;
        else
          get().shopping.manual.push({
            id: M.id(),
            name,
            quantity: q,
            unit,
            checked: false,
            onHand: false,
          });
      }, "Manual grocery saved.");
    }
    if (event.target.matches(".weight-profile-form")) {
      event.preventDefault();
      const f = new FormData(event.target),
        profile = event.target.dataset.profile;
      commit(() => {
        get().weights ??= [];
        get().weights.push({
          id: M.id(),
          profile,
          date: f.get("date"),
          value: Number(f.get("weight")),
        });
      }, "Weight recorded for this household member.");
    }
    if (event.target.id === "profile-form") {
      event.preventDefault();
      const f = new FormData(event.target);
      commit(() => {
        for (const k of ["you", "wife"])
          get().profiles[k] = {
            ...get().profiles[k],
            name: f.get(k + "-name").trim(),
            calories:
              f.get(k + "-calories") === ""
                ? null
                : Number(f.get(k + "-calories")),
            protein:
              f.get(k + "-protein") === ""
                ? null
                : Number(f.get(k + "-protein")),
            goalWeight:
              f.get(k + "-goalWeight") === ""
                ? null
                : Number(f.get(k + "-goalWeight")),
          };
        H.state.profileName = get().profiles.you.name;
        H.state.calorieTarget = get().profiles.you.calories;
        H.state.proteinTarget = get().profiles.you.protein;
        H.state.goalWeight = get().profiles.you.goalWeight;
        Object.assign(H.state.wifeProfile, {
          name: get().profiles.wife.name,
          goalWeight: get().profiles.wife.goalWeight,
          calorieTarget: get().profiles.wife.calories,
          proteinTarget: get().profiles.wife.protein,
        });
      }, "Household goals saved.");
    }
  });
  dialog.addEventListener("cancel", () => {
    draft = null;
  });
  window.HHPhase = {
    editor,
    newJournal,
    commit,
    actual,
    getContext: () => ({ profile: activeProfile, date: journalDate, week }),
    favorite,
  };
  window.addEventListener("storage", (event) => {
    if (event.key === window.HealthHubData.KEY || event.key === null)
      notice("Data changed in another tab. Recheck saved data before editing.");
  });
  window.phaseRender = render;
  render();
})();
