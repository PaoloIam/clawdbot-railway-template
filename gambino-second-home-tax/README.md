# Gambino Group — Second Home Annual Tax (Facts & Calculator)

A single-page, branded reproduction of a "Second Home Annual Tax" facts + calculation
tool for **Gambino Group**. It explains New York City's annual second-home
(pied-à-terre) surcharge and lets a visitor estimate the yearly amount for a property.

Static site — **no build step, no dependencies**. Everything (HTML, CSS, and the
calculator's vanilla JS) lives in a **single self-contained `index.html`**.

```
gambino-second-home-tax/
├─ index.html      # the entire site: layout + styles + calculator
├─ netlify.toml    # deploy + headers config
└─ README.md
```

## ✏️ Edit your details (one place)

Open **`index.html`** and edit the `CONFIG` object inside the `<script>` block near the bottom:

- `CONFIG.contact` — name, title, **phone**, email, **website**, **office address**.
  Items marked `// TODO` are placeholders you should replace before publishing
  (phone, website, and office address).
- `CONFIG.threshold` and `CONFIG.brackets` — the tax tiers. **Verify these against the
  official NYC Department of Finance figures** before publishing; they are based on
  publicly reported pied-à-terre tiers and are easy to swap (one array).

Want your real logo instead of the "GG" wordmark? Replace the `.brand-mark` / `.brand-text`
block in `index.html` with an `<img src="logo.svg" ...>` and drop the file in this folder
(at that point you'd be deploying a folder rather than the single file — see below).

## 🚀 Deploy to Netlify

### Option A — Drag & drop (fastest)
1. Go to <https://app.netlify.com/drop>
2. Drag the **`index.html`** file (or this whole **`gambino-second-home-tax`** folder) onto the page.
3. Done — Netlify gives you a live URL. Rename the site in **Site settings** if you like.

> Because the site is one self-contained file, you can even email/AirDrop `index.html`
> and open it directly in a browser to preview it — no server needed.

### Option B — Connect the Git repo (auto-deploy on push)
1. In Netlify: **Add new site → Import an existing project** and pick this repo.
2. Build settings:
   - **Base directory:** `gambino-second-home-tax`
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` (relative to base) — already set in `netlify.toml`
3. Deploy. Every push to the branch redeploys automatically.

### Add a custom domain
Netlify → **Domain settings → Add a domain** (e.g. a `secondhometax.gambinogroup.com`
subdomain), then follow the DNS instructions.

## 🧮 How the calculator works

- **Progressive (marginal) tiers:** each rate applies only to the portion of value within
  that tier — like income-tax brackets — so the effective rate is always lower than the top tier.
- **Exemptions** are modeled: a primary residence (owner/family) and a bona-fide long-term
  lease both return **$0**, and any value **below the threshold** returns **$0**.
- Outputs: estimated **annual** surcharge, **effective rate**, **monthly** equivalent, a
  **10-year** projection, and a per-tier breakdown.

## ⚠️ Disclaimer

This tool provides a good-faith **estimate for informational purposes only** and is **not**
tax, legal, or accounting advice. Tax tiers, thresholds, and exemptions are subject to change
and to final regulations. Confirm all figures with the NYC Department of Finance and a qualified
professional before relying on them.

## 🔍 Local preview

```bash
# from inside this folder
python3 -m http.server 8080
# open http://localhost:8080
```
