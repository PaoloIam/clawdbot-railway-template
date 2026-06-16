/* ============================================================
   Gambino Group — Second Home Annual Tax calculator
   ------------------------------------------------------------
   EDIT EVERYTHING YOU NEED IN THE `CONFIG` OBJECT BELOW.
   No build step. Plain browser JavaScript.
   ============================================================ */

const CONFIG = {
  /* ---- Your contact info (edit these) ---- */
  contact: {
    name: "Paolo Sciarra",
    title: "Licensed Real Estate Salesperson · Gambino Group",
    phone: "(000) 000-0000",          // TODO: replace with your real number
    phoneLink: "+10000000000",        // TODO: digits only, with country code
    email: "paolo.sciarra@gmail.com",
    web: "gambinogroup.com",          // TODO: confirm / replace
    webLink: "https://gambinogroup.com", // TODO: confirm / replace
    address: "New York, NY",          // TODO: replace with office address
  },

  /* ---- Tax rules (edit to match the official, enacted figures) ----
     `threshold`  : value below which no second-home surcharge applies.
     `brackets`   : MARGINAL tiers. Each tier's rate applies only to the
                    portion of value that falls within [from, to).
     Figures below reflect publicly reported pied-à-terre tiers and should
     be verified against the NYC Department of Finance before publishing. */
  threshold: 5_000_000,
  brackets: [
    { from: 5_000_000,  to: 6_000_000,  rate: 0.005 },  // 0.5%
    { from: 6_000_000,  to: 10_000_000, rate: 0.010 },  // 1.0%
    { from: 10_000_000, to: 15_000_000, rate: 0.020 },  // 2.0%
    { from: 15_000_000, to: 20_000_000, rate: 0.030 },  // 3.0%
    { from: 20_000_000, to: 25_000_000, rate: 0.035 },  // 3.5%
    { from: 25_000_000, to: Infinity,   rate: 0.040 },  // 4.0%
  ],
  projectionYears: 10,
};

/* ---------------- Formatting helpers ---------------- */
const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(n));

const fmtMoneyCents = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const fmtPct = (r) => `${(r * 100).toFixed(2).replace(/\.00$/, "")}%`;

const fmtTier = (from, to) =>
  to === Infinity ? `${fmtMoney(from)}+` : `${fmtMoney(from)} – ${fmtMoney(to)}`;

/* ---------------- Core calculation ----------------
   Returns the annual surcharge plus a per-bracket breakdown. */
function calculateTax(value) {
  let total = 0;
  const detail = CONFIG.brackets.map((b) => {
    const taxable = Math.max(0, Math.min(value, b.to) - b.from);
    const tax = taxable * b.rate;
    total += tax;
    return { ...b, taxable, tax, active: taxable > 0 };
  });
  const effectiveRate = value > 0 ? total / value : 0;
  return { total, detail, effectiveRate };
}

/* ---------------- Money input masking ---------------- */
const valueInput = document.getElementById("market-value");

function digitsToNumber(str) {
  const d = String(str).replace(/[^0-9]/g, "");
  return d ? parseInt(d, 10) : 0;
}

valueInput.addEventListener("input", (e) => {
  const caretFromEnd = e.target.value.length - e.target.selectionStart;
  const num = digitsToNumber(e.target.value);
  e.target.value = num ? num.toLocaleString("en-US") : "";
  const newPos = e.target.value.length - caretFromEnd;
  e.target.setSelectionRange(Math.max(0, newPos), Math.max(0, newPos));
});

/* ---------------- Render results ---------------- */
const els = {
  form: document.getElementById("tax-form"),
  empty: document.getElementById("result-empty"),
  body: document.getElementById("result-body"),
  annual: document.getElementById("annual-amount"),
  sub: document.getElementById("result-sub"),
  effective: document.getElementById("effective-rate"),
  monthly: document.getElementById("monthly-amount"),
  tenyear: document.getElementById("tenyear-amount"),
  rows: document.getElementById("bracket-rows"),
  breakdown: document.getElementById("bracket-breakdown"),
  resetBtn: document.getElementById("reset-btn"),
};

function showExempt(reason) {
  els.empty.hidden = true;
  els.body.hidden = false;
  els.annual.textContent = fmtMoney(0);
  els.sub.textContent = reason;
  els.sub.className = "result-sub exempt";
  els.effective.textContent = "0%";
  els.monthly.textContent = fmtMoney(0);
  els.tenyear.textContent = fmtMoney(0);
  els.breakdown.style.display = "none";
}

function render(value, usage) {
  // Exemptions
  if (usage === "primary") {
    return showExempt("Exempt — owner/family primary residence.");
  }
  if (usage === "rented") {
    return showExempt("Exempt — bona-fide long-term lease to a full-time tenant.");
  }
  if (value < CONFIG.threshold) {
    return showExempt(`Below the ${fmtMoney(CONFIG.threshold)} threshold — no second-home surcharge.`);
  }

  const { total, detail, effectiveRate } = calculateTax(value);

  els.empty.hidden = true;
  els.body.hidden = false;
  els.breakdown.style.display = "";

  els.annual.textContent = fmtMoney(total);
  els.sub.textContent = `Estimated annual surcharge on a ${fmtMoney(value)} second home`;
  els.sub.className = "result-sub taxed";
  els.effective.textContent = fmtPct(effectiveRate);
  els.monthly.textContent = fmtMoney(total / 12);
  els.tenyear.textContent = fmtMoney(total * CONFIG.projectionYears);

  els.rows.innerHTML = detail
    .map(
      (b) => `
      <tr class="${b.active ? "" : "inactive"}">
        <td>${fmtTier(b.from, b.to)}</td>
        <td>${fmtPct(b.rate)}</td>
        <td>${b.active ? fmtMoneyCents(b.tax) : "—"}</td>
      </tr>`
    )
    .join("");
}

/* ---------------- Events ---------------- */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = digitsToNumber(valueInput.value);
  const usage = els.form.querySelector('input[name="usage"]:checked')?.value || "second-home";
  render(value, usage);
  els.body.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

els.resetBtn.addEventListener("click", () => {
  setTimeout(() => {
    els.body.hidden = true;
    els.empty.hidden = false;
  }, 0);
});

/* ---------------- Inject contact info into the page ---------------- */
function applyContact() {
  const c = CONFIG.contact;
  const set = (key, text) =>
    document.querySelectorAll(`[data-contact="${key}"]`).forEach((el) => (el.textContent = text));
  const setHref = (key, href) =>
    document.querySelectorAll(`[data-contact="${key}"]`).forEach((el) => el.setAttribute("href", href));

  set("name", c.name);
  set("title", c.title);
  set("phone", c.phone);
  set("email", c.email);
  set("web", c.web);
  set("address", c.address);

  setHref("phone-link", `tel:${c.phoneLink}`);
  setHref("email-link", `mailto:${c.email}`);
  setHref("email-cta", `mailto:${c.email}?subject=${encodeURIComponent("Second Home Tax — NYC Real Estate")}`);
  setHref("web-link", c.webLink);
}

applyContact();
document.getElementById("year").textContent = new Date().getFullYear();
