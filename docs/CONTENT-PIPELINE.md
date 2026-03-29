# Content Pipeline

> How content flows through the system. Workflows, CLI reference, CMS editor operations, and validation.

---

## Content Flow Diagram

```
                    ┌─────────────┐
                    │  Supabase   │  (source of truth for content)
                    │  pages DB   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ pull       │            │ push
              ▼            │            ▲
        ┌──────────┐       │      ┌──────────────────┐
        │deploy.js │       │      │sync-to-supabase.js│
        └────┬─────┘       │      └────────┬─────────┘
             │             │               │
             ▼             │               │
      ┌────────────┐       │        ┌──────┴──────┐
      │ JSON files │◄──────┘───────►│ extract.js  │
      │ content/   │                │ HTML → JSON │
      └─────┬──────┘                └──────┬──────┘
            │                              ▲
            ▼                              │
      ┌──────────┐                   ┌─────┴──────┐
      │ build.js │──────────────────►│  HTML pages │
      │ JSON→HTML│                   │  (*.html)   │
      └──────────┘                   └─────────────┘
                                           │
                                           ▼
                                     GitHub Pages
                                     (auto-deploy)
```

---

## Source of Truth Rules

| What | Source of truth | Managed by |
|------|----------------|------------|
| Content (text, images, field values) | **Supabase** | CMS editor (admin.html) |
| Structure (DOM, layout, annotations) | **HTML pages** | Local editing |
| Content cache | **JSON files** (`content/`) | `deploy.js` (pull) / `extract.js` (generate) |
| Block schema | **block-registry.json** | Manual (frozen at v1.1) |

**Key principle:** Elements with `data-field` → managed by CMS/Supabase. Elements without `data-field` (nav, footer, breadcrumbs) → managed locally, safe from deploy.js overwrites.

---

## CMS Editor (`tools/admin.html`)

### Online mode

Config → Login (Supabase email/password) → Select page → Edit fields → Save (→ Supabase)

### Offline mode

Offline-Modus → Auto-discovers pages from `content/manifest.json` → Load JSON → Edit → Download JSON → Run `build.js`

### Capabilities

| Feature | Details |
|---------|---------|
| Field types | text, textarea, image (drag-drop upload + preview), button, link, video, html |
| Compact grid | Short text fields (city name + status) side-by-side in 2-column layout |
| Collapse/expand | Blocks collapsed by default except the first |
| Sidebar nav | Clickable block list, auto-highlights on scroll |
| German labels | `BLOCK_LABELS` / `FIELD_LABELS` lookup — proper umlauts |
| Save tracking | Unsaved indicator, Ctrl+S shortcut, warn-on-leave |
| Toast messages | Success / error / info notifications (auto-dismiss) |
| Live preview | Iframe with postMessage bridge |
| Image upload | Supabase Storage → thumbnail preview |
| Draft autosave | localStorage |
| Feedback form | Submit page-specific feedback to `feedback` table |
| Publish | Trigger deploy to GitHub Pages via Edge Function → GitHub Actions |

---

## CLI Tool Reference

All commands run from the `tools/` directory.

### deploy.js — Supabase → JSON → HTML

```bash
node deploy.js                           # Pull all pages + build HTML
node deploy.js --page fuer-kommunen      # Pull + build one page
node deploy.js --local                   # Build from local JSON only (no Supabase)
```

**Backup behavior:** Before overwriting any local JSON file, `deploy.js` copies it to `content/backups/{pageId}_{timestamp}.json`. Auto-cleanup keeps the 10 most recent backups per page. The `content/backups/` directory is gitignored.

**JSON normalization:** All JSON output uses recursive key sorting (`sortKeys()`) for stable output — prevents noisy diffs when key order varies between Supabase and local tools.

### extract.js — HTML → JSON

```bash
node extract.js ../index.html ../content/startseite.json
node extract.js ../hilfe-finden.html ../content/hilfe-finden.json
```

### build.js — JSON → HTML

```bash
node build.js ../content/startseite.json ../index.html
node build.js ../content/presse.json ../presse.html
```

### sync-to-supabase.js — JSON → Supabase

```bash
node sync-to-supabase.js                                    # All pages (conflict check)
node sync-to-supabase.js --page fuer-kommunen               # One page
node sync-to-supabase.js --page fuer-kommunen --force       # Skip conflict check
node sync-to-supabase.js --dry-run                           # Preview changes (no writes)
```

**Conflict detection:** Compares local `_meta.lastEdited` with Supabase. If remote is newer, shows who edited and when, then skips (unless `--force`). With `--force`, prints a WARNING before overwriting.

**Dry run:** `--dry-run` shows which pages would be synced/skipped without making any changes.

### validate.js — Integrity check

```bash
node validate.js startseite              # Normal mode (ghosts = warnings)
node validate.js startseite --strict     # Strict mode (ghosts = errors, prefix check)
```

### test-roundtrip.js — Round-trip test

```bash
node test-roundtrip.js                   # All 8 pages
node test-roundtrip.js startseite        # One page
```

### Validate all pages (batch)

```bash
for page in startseite hilfe-finden engagieren fuer-kommunen ueber-uns kontakt presse projekte; do
  node validate.js "$page" || exit 1
done
```

Expected: `Result: PASS (0 errors, 0 warnings)` for each page.

---

## Operational Workflows

### Before starting local work

Always pull the latest content from Supabase first:

```bash
cd tools && node deploy.js
```

### Editing content via CMS

1. Open admin.html → Login → Select page
2. Edit fields → Save (→ Supabase)
3. Pull: `cd tools && node deploy.js`
4. Push to GitHub: `git add -A && git push`

### Editing content locally

1. `node deploy.js` — pull latest from Supabase
2. Edit HTML directly
3. `node extract.js ../page.html ../content/page.json` — regenerate JSON
4. `node sync-to-supabase.js --page {id}` — push to Supabase (checks for conflicts)
5. `git push` — deploy to GitHub Pages

### Publishing from CMS

The CMS has a "Veröffentlichen" button that triggers deployment without manual git operations:

1. Editor clicks "Veröffentlichen" in admin.html
2. CMS calls Supabase Edge Function (`/functions/v1/publish`)
3. Edge Function triggers GitHub Actions `deploy-content.yml` via `workflow_dispatch`
4. GitHub Actions runs `deploy.js` → commits changes → GitHub Pages auto-deploys
5. Content appears on live site in ~1–2 minutes

**Architecture:** The GitHub PAT stays server-side in the Edge Function — never exposed to the browser.

### Structural HTML changes (nav, footer, CSS)

These elements have no `data-field` → they don't conflict with Supabase content.

1. Edit HTML directly
2. `git push` — deploy to GitHub Pages

No Supabase sync needed.

### Adding a new page

1. Create `{page}.html` in repo root with `<body class="page-{slug}">`
2. Add `data-block`/`data-block-id` to all `<section>` elements
3. Add `data-field`/`data-field-type` to all editable content elements
4. Ensure field IDs match registry patterns for the block type
5. Add CSS accent: `.page-{slug} { --accent: var(--{color}-primary); --accent-light: var(--{color}-light); }`
6. Extract JSON:
   ```bash
   cd tools && node extract.js ../{page}.html ../content/{page}.json
   ```
7. Add page to `content/manifest.json`
8. Add page to `PAGE_IDS` in `lib/config.js`
9. Update header/footer navigation on ALL pages
10. Validate:
    ```bash
    node validate.js {page}
    ```

### Annotating blocks/fields checklist

- [ ] Every `<section>` has `data-block="{type}"` and `data-block-id="bN"`
- [ ] Block IDs are sequential per page (b1, b2, b3...)
- [ ] Block type matches a registry entry or alias
- [ ] Every editable element has `data-field="{id}"` and `data-field-type="{type}"`
- [ ] Field IDs follow registry naming patterns (`{prefix}-{N}-{property}`)
- [ ] Images use `data-field-type="image"` (not "text")
- [ ] Buttons/links have both text content and `href`
- [ ] No duplicate `data-field` IDs within the same block
- [ ] No `data-field` elements outside a `[data-block-id]` container

---

## Validation & Testing

### Smoke test checklist

**Browser (GitHub Pages or local `npx serve .`):**
- [ ] All 8 pages load without console errors
- [ ] Navigation links work across all pages (root-relative)
- [ ] Mega menu opens/closes correctly
- [ ] Active nav state highlights current page
- [ ] FAQ accordion expands/collapses
- [ ] Tabs switch correctly
- [ ] Mobile responsive at 768px and 1024px breakpoints

**Admin editor (`tools/admin.html`):**
- [ ] Login works with valid credentials
- [ ] Page list loads from Supabase
- [ ] Selecting a page loads content + preview
- [ ] Editing a text field updates preview in real-time
- [ ] Image upload shows thumbnail + updates preview
- [ ] Save persists to Supabase
- [ ] Feedback form submits successfully

### Pre-merge commands

```bash
cd tools

# 1. Validate all pages
for page in startseite hilfe-finden engagieren fuer-kommunen ueber-uns kontakt presse projekte; do
  node validate.js "$page" || exit 1
done

# 2. Check for broken root-relative links
grep -rn 'href="[^/#h]' ../*.html | grep -v 'mailto:' | grep -v 'tel:' | grep -v 'javascript:'

# 3. Verify single :root
grep -c ':root' ../assets/shared-styles.css
# Expected: 1

# 4. Check no inline styles in HTML pages
grep -l '<style' ../*.html
# Expected: no output (only admin.html in tools/ has inline styles)
```

---

## Configuration

| Source | Purpose |
|--------|---------|
| `tools/.env` | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (for deploy.js, sync-to-supabase.js) |
| `localStorage:hp_cms_config` | Browser-stored Supabase URL + Anon Key (for admin.html) |
| `content/manifest.json` | Page registry for CMS offline auto-discovery |
| `tools/lib/config.js` | Shared config: PAGE_IDS, path constants, .env loading |
