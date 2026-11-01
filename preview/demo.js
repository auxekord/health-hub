/* All profiles, portions, targets, weights and nutrition in this file are fictional. */
(() => {
  "use strict";
  const M = window.HHModel;
  const profiles = {
    you: { name: "Rowan Demo", calories: 2150, protein: 112, goalWeight: 184 },
    wife: { name: "Casey Demo", calories: 1780, protein: 94, goalWeight: 142 },
  };
  const localDay = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = localDay(new Date());
  const shift = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return localDay(d);
  };
  const monday = -(new Date().getDay() + 6) % 7;
  const source =
    "Fictional demonstration estimate. Not official restaurant or reference nutrition.";
  function component(name, quantity, unit, kcal, protein, group = "other") {
    return {
      ...M.blankComponent(name),
      quantity,
      unit,
      status: "estimate",
      source,
      group,
      nutrients: { kcal, protein, carbs: null, fat: null, fiber: null },
    };
  }
  function meal(name, date, category = "Dinner") {
    return {
      ...M.blankMeal(date),
      name,
      category,
      kind: "Home-cooked",
      notes:
        "Fictional sample. Edit freely; do not enter personal health data.",
    };
  }
  function initialState() {
    const legacy = {
      selected: ["fajita", "salmon"],
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
      goalWeight: profiles.you.goalWeight,
      calorieTarget: profiles.you.calories,
      proteinTarget: profiles.you.protein,
      wifeProfile: {
        calorieTarget: profiles.wife.calories,
        proteinTarget: profiles.wife.protein,
      },
    };
    const s = M.create(legacy);
    s.profiles = M.clone(profiles);
    for (let day = 0; day < 7; day++)
      for (const category of M.CATEGORIES) {
        const name = {
          Breakfast: "Demo oat breakfast",
          Lunch: "Demo bean and rice bowl",
          Dinner: "Demo salmon plate",
          Snack: "Demo yogurt snack",
        }[category];
        const p = meal(name, shift(monday + day), category);
        p.time = {
          Breakfast: "08:00",
          Lunch: "12:15",
          Dinner: "18:30",
          Snack: "15:00",
        }[category];
        p.portions = { you: 1, wife: 0.75 };
        p.components =
          category === "Dinner"
            ? [
                component("Salmon", 140, "g", 1.9, 0.21, "protein"),
                component("Potatoes", 180, "g", 0.8, 0.02, "grain"),
                component("Mixed vegetables", 90, "g", 0.4, 0.02, "veg"),
              ]
            : category === "Breakfast"
              ? [component("Oats, dry", 55, "g", 3.7, 0.12, "grain")]
              : category === "Lunch"
                ? [
                    component("Black beans", 95, "g", 1.25, 0.08, "protein"),
                    component("Brown rice, dry", 60, "g", 3.5, 0.07, "grain"),
                  ]
                : [component("Demo yogurt", 120, "g", 0.7, 0.08, "protein")];
        s.plans.push(p);
      }
    const plate = meal(
      "Campestre Chicken · fictional demo plate",
      today,
      "Lunch",
    );
    Object.assign(plate, {
      kind: "Restaurant",
      restaurant: "Campestre Chicken",
      location: "Lincoln Park, Michigan",
      time: "12:15",
      portions: { you: 1, wife: 0.7 },
      notes:
        source +
        " Portion amounts are invented for interface testing, not an assumed restaurant serving.",
    });
    plate.components = [
      component("Quarter chicken", 0.5, "serving", 420, 44, "protein"),
      component("Mixed vegetables", 85, "g", 0.42, 0.02, "veg"),
      component("Black beans", 65, "g", 1.28, 0.08, "protein"),
      component("Green sauce", 12, "g", 1.9, 0, "sauce"),
    ];
    s.plans.push(plate);
    for (let offset = -3; offset <= 0; offset++)
      for (const profile of ["you", "wife"]) {
        const sample = meal("Demo home lunch", shift(offset), "Lunch");
        sample.components = [
          component("Brown rice, dry", 70, "g", 3.5, 0.07, "grain"),
          component("Black beans", 100, "g", 1.25, 0.08, "protein"),
        ];
        sample.portions = { you: 1, wife: 0.8 };
        s.journal.push(M.consumed(sample, profile));
      }
    const journalPlate = M.consumed(plate, "you");
    journalPlate.plannedId = null;
    s.journal.push(journalPlate);
    const favorite = M.clone(plate);
    favorite.id = M.id();
    favorite.plannedId = null;
    s.favorites.push(favorite);
    s.restaurants = [{ name: plate.restaurant, location: plate.location }];
    for (const profile of ["you", "wife"])
      for (let i = 0; i < 4; i++)
        s.weights.push({
          id: M.id(),
          profile,
          date: shift(-21 + i * 7),
          value: (profile === "you" ? 193 : 149) - i * 0.6,
        });
    s.shopping.manual = [
      {
        id: M.id(),
        name: "Demo coffee",
        quantity: 1,
        unit: "piece",
        checked: false,
        onHand: false,
      },
    ];
    const week = shift(monday);
    s.shopping.overrides[week + "|potatoes|g"] = {
      checked: false,
      onHand: true,
      quantity: null,
    };
    legacy.phase2 = s;
    return legacy;
  }
  window.HealthHubDemo = {
    profiles,
    initialState,
    products: [
      {
        code: "demo-oats",
        product_name: "Demo oat cereal",
        brands: "Fictional Demo Pantry",
        nutriments: { "energy-kcal_100g": 370, proteins_100g: 12 },
      },
      {
        code: "demo-yogurt",
        product_name: "Demo yogurt",
        brands: "Fictional Demo Pantry",
        nutriments: { "energy-kcal_100g": 70, proteins_100g: 8 },
      },
    ],
  };
})();
