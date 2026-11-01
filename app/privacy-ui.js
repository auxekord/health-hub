/* Recovery and optional profile settings. All record values use DOM properties. */
(() => {
  "use strict";
  const H = window.HealthHubSafety,
    D = window.HealthHubData,
    $ = (id) => document.getElementById(id);
  let recoveryAcknowledged = false;
  const warning = document.createElement("section");
  warning.id = "storage-warning";
  warning.className = "panel";
  warning.setAttribute("role", "alert");
  warning.innerHTML =
    '<h2>Saved data needs attention</h2><p id="storage-reason"></p><p>No saved records have been cleared. Writes are paused. Download the original stored value before attempting recovery.</p><div class="actionbar"><button type="button" class="btn" id="download-recovery">Download original recovery file</button><button type="button" class="btn alt" id="download-pending">Download unsaved changes</button><button type="button" class="btn alt" id="recheck-storage">Recheck saved data</button></div><label class="notice"><input id="recovery-ack" type="checkbox"> I have saved the original recovery file and want to restore a validated backup.</label>';
  document.querySelector("main").before(warning);
  const settings = document.createElement("section");
  settings.className = "panel";
  settings.id = "profile-settings";
  settings.innerHTML =
    '<h2>Optional household goals</h2><p class="notice">No personal targets are supplied by the app. Existing saved profile details remain in this browser. Both profiles share this browser; they are not separate accounts. Leave a goal blank when unknown.</p><form id="privacy-profile-form" class="stack"><fieldset><legend>Profile 1</legend><label>Display name<input name="profileName" type="text" maxlength="200"></label><label>Calorie target<input name="calorieTarget" type="number" min="0" step="any"></label><label>Protein target (g)<input name="proteinTarget" type="number" min="0" step="any"></label><label>Goal weight (lb)<input name="goalWeight" type="number" min="0" step="any"></label></fieldset><fieldset><legend>Profile 2</legend><label>Display name<input name="secondName" type="text" maxlength="200"></label><label>Calorie target<input name="secondCalories" type="number" min="0" step="any"></label><label>Protein target (g)<input name="secondProtein" type="number" min="0" step="any"></label></fieldset><button class="btn" type="submit">Save optional goals</button></form><p id="privacy-status" role="status" aria-live="polite"></p>';
  $("progress").append(settings);
  const importOptions = document.createElement("label");
  importOptions.className = "notice";
  importOptions.textContent = "Backup import behavior ";
  const select = document.createElement("select");
  select.id = "backup-mode";
  select.className = "meal-select";
  for (const [value, label] of [
    ["merge", "Merge: keep existing records and profiles"],
    ["restore", "Restore: replace only supplied sections"],
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
  importOptions.append(select);
  $("import").parentElement.before(importOptions);
  function download(content, name, type = "application/json") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  const message = (text) => {
    $("privacy-status").textContent = text;
  };
  function exportCurrent() {
    const raw = H.store.raw();
    if (H.store.reason() && raw !== null) {
      download(
        raw,
        "health-hub-original-recovery.txt",
        "application/octet-stream",
      );
      return;
    }
    if (H.store.reason() === "unavailable") {
      message(
        "Browser storage cannot be read. Recheck access before exporting.",
      );
      return;
    }
    download(JSON.stringify(H.state, null, 2), "health-hub-16-backup.json");
  }
  function render() {
    const reason = H.store.reason();
    warning.hidden = !reason;
    const reasons = {
      invalid:
        "Existing data is invalid or from an unsupported format. It has not been replaced with defaults.",
      unavailable:
        "Browser storage is unavailable. Check browser permissions and recheck before saving.",
      conflict:
        "Saved data changed in another tab or window. Your prior session is preserved in memory. Recheck to load the latest saved data.",
      "write-failed":
        "Saving failed. Existing stored data was left in place. Download unsaved changes before rechecking.",
    };
    $("storage-reason").textContent = reasons[reason] || "";
    $("download-recovery").disabled = H.store.raw() === null;
    $("download-pending").hidden = !H.store.pending();
    $("recovery-ack").parentElement.hidden = reason !== "invalid";
    $("import").disabled =
      !!reason && !(reason === "invalid" && recoveryAcknowledged);
    const locked = !!reason;
    document
      .querySelectorAll(
        "[data-add],[data-remove],[data-log],[data-delete],[data-live-delete],[data-kitchen-remove],[data-kitchen-log],#liveLogBtn,#liveAddKitchenBtn,[data-step],[data-batch],[data-mealtype],[data-kitchen-grams],#myScale,#wifeScale,#stepsForm input,#stepsForm button,#weightForm input,#weightForm button,#privacy-profile-form input,#privacy-profile-form button",
      )
      .forEach((el) => (el.disabled = locked));
    const s = H.state,
      form = $("privacy-profile-form");
    const values = {
      profileName: s.profileName ?? "",
      calorieTarget: s.calorieTarget ?? "",
      proteinTarget: s.proteinTarget ?? "",
      goalWeight: s.goalWeight ?? "",
      secondName: s.wifeProfile.name ?? "",
      secondCalories: s.wifeProfile.calorieTarget ?? "",
      secondProtein: s.wifeProfile.proteinTarget ?? "",
    };
    for (const [k, v] of Object.entries(values)) form.elements[k].value = v;
    const value = (x) =>
      typeof x === "number" && Number.isFinite(x) ? String(x) : "Not set";
    const profiles = [
      {
        name: s.profileName || "Profile 1",
        calories: s.calorieTarget,
        protein: s.proteinTarget,
      },
      {
        name: s.wifeProfile.name || "Profile 2",
        calories: s.wifeProfile.calorieTarget,
        protein: s.wifeProfile.proteinTarget,
      },
    ];
    document.querySelectorAll(".couple-grid").forEach((grid) =>
      [...grid.children].forEach((cell, i) => {
        const p = profiles[i];
        if (!p) return;
        cell.querySelector("span").textContent = p.name;
        cell.querySelector("strong").textContent = value(p.calories) + " kcal";
        cell.querySelector("p").textContent =
          value(p.protein) + " g protein target · optional, browser-local";
      }),
    );
    const insights = document.querySelectorAll("#home .insight");
    if (insights[0])
      insights[0].querySelector("strong").textContent = value(s.calorieTarget);
    if (insights[1])
      insights[1].querySelector("strong").textContent = value(s.proteinTarget);
    if (insights[2])
      insights[2].querySelector("strong").textContent = "Not set";
    const hero = document.querySelector(".hero-insight");
    hero.querySelector("strong").textContent =
      s.weight.length && typeof s.goalWeight === "number"
        ? value(s.weight.at(-1).value) + " → " + value(s.goalWeight) + " lb"
        : "Your goals, set by you";
    hero.querySelector("p").textContent =
      "Set optional goals in Progress. No weight history or health outcome is assumed.";
    const orbit = document.querySelector(".orbit");
    if (orbit?.firstChild)
      orbit.firstChild.textContent =
        typeof s.goalWeight === "number" ? value(s.goalWeight) : "—";
  }
  async function importFile(file) {
    try {
      if (file.size > D.MAX_BYTES) throw Error("invalid");
      const v = D.parse(await file.text());
      const mode = $("backup-mode").value;
      const reason = H.store.reason();
      if (reason && !(reason === "invalid" && recoveryAcknowledged)) {
        message(
          "Saving is paused. Resolve storage access or download the original recovery file first.",
        );
        return;
      }
      const next = D.combine(H.state, v, mode, {
        newStore: H.store.raw() === null || reason === "invalid",
      });
      const sections = Object.entries(v)
        .filter(([, x]) => Array.isArray(x))
        .map(([k, x]) => k + ": " + x.length + " records")
        .join(", ");
      const summary =
        mode === "merge"
          ? "Merge records. Existing records win ID conflicts; existing profile fields stay unchanged."
          : "Restore supplied sections. Lists and profile fields supplied by the file replace those sections. Omitted sections stay unchanged.";
      if (
        !confirm(
          summary +
            "\n" +
            sections +
            "\nNothing is sent to a server. Continue?",
        )
      )
        return;
      if (
        H.store.write(next, {
          recovery: reason === "invalid" && recoveryAcknowledged,
        })
      ) {
        H.setState(H.store.state());
        recoveryAcknowledged = false;
        H.render();
        message("Backup applied. Review your records and optional goals.");
      } else {
        H.setState(H.store.state());
        H.render();
        message("Import was not saved. Existing stored data was not cleared.");
      }
    } catch {
      alert(
        "Invalid, oversized, or unsupported backup. Current records were not changed.",
      );
    }
  }
  $("privacy-profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (H.store.reason()) return;
    const form = event.target;
    const optional = (name) =>
      form.elements[name].value === ""
        ? null
        : Number(form.elements[name].value);
    const next = JSON.parse(JSON.stringify(H.state));
    next.profileName = form.elements.profileName.value.trim();
    next.calorieTarget = optional("calorieTarget");
    next.proteinTarget = optional("proteinTarget");
    next.goalWeight = optional("goalWeight");
    next.wifeProfile = {
      ...next.wifeProfile,
      name: form.elements.secondName.value.trim(),
      calorieTarget: optional("secondCalories"),
      proteinTarget: optional("secondProtein"),
    };
    if (next.phase2) {
      Object.assign(next.phase2.profiles.you, {
        name: next.profileName || "Profile 1",
        calories: next.calorieTarget,
        protein: next.proteinTarget,
        goalWeight: next.goalWeight,
      });
      Object.assign(next.phase2.profiles.wife, {
        name: next.wifeProfile.name || "Profile 2",
        calories: next.wifeProfile.calorieTarget,
        protein: next.wifeProfile.proteinTarget,
      });
    }
    if (H.store.write(next)) {
      H.setState(H.store.state());
      H.render();
      message(
        "Optional goals saved. Other records and existing profile fields were retained.",
      );
    } else {
      H.setState(H.store.state());
      H.render();
      message("Goals could not be saved. Download recovery data if needed.");
    }
  });
  $("download-recovery").addEventListener("click", () => {
    if (H.store.raw() !== null)
      download(
        H.store.raw(),
        "health-hub-original-recovery.txt",
        "application/octet-stream",
      );
  });
  $("download-pending").addEventListener("click", () => {
    if (H.store.pending())
      download(
        JSON.stringify(H.store.pending(), null, 2),
        "health-hub-unsaved-recovery.json",
      );
  });
  $("recheck-storage").addEventListener("click", () => {
    recoveryAcknowledged = false;
    $("recovery-ack").checked = false;
    H.setState(H.store.recheck());
    H.render();
  });
  $("recovery-ack").addEventListener("change", (event) => {
    recoveryAcknowledged = event.target.checked;
    render();
  });
  window.addEventListener("storage", (event) => {
    if (
      event.storageArea === localStorage &&
      (event.key === D.KEY || event.key === null)
    ) {
      H.store.conflict();
      recoveryAcknowledged = false;
      render();
    }
  });
  window.addEventListener("healthhub-storage", render);
  window.HealthHubPrivacy = { render, importFile, exportCurrent };
  render();
})();
