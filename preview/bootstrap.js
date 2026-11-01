/* Demo-only controls: import has no reader; reset touches only the demo key. */
(() => {
  "use strict";
  const key = "healthhub-demo-phase2-hybrid-v2";
  const input = document.getElementById("import");
  input.disabled = true;
  input.removeAttribute("accept");
  const label = document.querySelector('label[for="import"]');
  if (label) {
    label.textContent = "Backup import disabled in demo";
    label.setAttribute("aria-disabled", "true");
    label.removeAttribute("for");
  }
  document.getElementById("export").textContent = "Export fictional demo data";
  const banner = document.createElement("aside");
  banner.className = "demo-banner";
  banner.setAttribute("aria-label", "Demo privacy notice");
  banner.innerHTML =
    '<strong>HEALTH HUB — DEMO PREVIEW</strong><p>All profiles, health records and nutrition estimates are fictional. Do not enter real personal health information. No connection to production. Backup imports and external food lookup are disabled.</p><button class="btn sm" type="button" id="reset-demo">Reset fictional demo</button>';
  document.querySelector(".app").prepend(banner);
  document.getElementById("reset-demo").addEventListener("click", () => {
    if (confirm("Reset only this fictional demo?")) {
      localStorage.setItem(
        key,
        JSON.stringify(window.HealthHubDemo.initialState()),
      );
      location.reload();
    }
  });
  if (!localStorage.getItem(key)) window.HealthHub.save();
})();
