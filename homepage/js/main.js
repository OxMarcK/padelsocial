// Padel Social — padelsocial.nl homepage
// Vanilla JS only — no build step, static FTP-friendly site.

document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mobileNav.querySelectorAll("a, .btn").forEach((el) => {
      el.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Toggle-button groups ("Wat wil je organiseren?", "Groepsgrootte") —
  // single-select within each group, tracked via a data attribute so the
  // mailto body can read back which one is active.
  document.querySelectorAll("[data-toggle-group]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".toggle-btn");
      if (!btn || !group.contains(btn)) return;
      group.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });

  // "Plan jullie event" form — no backend on a static site, so this builds
  // a mailto: link from the field values and hands off to the visitor's own
  // mail client rather than submitting anywhere.
  const planForm = document.getElementById("planForm");
  if (planForm) {
    planForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const getActive = (group) => {
        const el = planForm.querySelector(`[data-toggle-group="${group}"] .toggle-btn.is-active`);
        return el ? el.dataset.value : "";
      };

      const naam = planForm.naam.value.trim();
      const bedrijf = planForm.bedrijf.value.trim();
      const email = planForm.email.value.trim();
      const datum = planForm.datum.value.trim();
      const toelichting = planForm.toelichting.value.trim();
      const type = getActive("type");
      const groep = getActive("size");

      const lines = [
        `Wat: ${type}`,
        `Groepsgrootte: ${groep}`,
        `Naam: ${naam}`,
        bedrijf ? `Bedrijf: ${bedrijf}` : null,
        `E-mail: ${email}`,
        datum ? `Datum of periode: ${datum}` : null,
        toelichting ? `\nWaar denkt ${naam || "de aanvrager"} aan:\n${toelichting}` : null,
      ].filter(Boolean);

      const subject = encodeURIComponent(`Aanvraag event — ${type}`);
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:info@padelsocial.nl?subject=${subject}&body=${body}`;
    });
  }
});
