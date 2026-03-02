# Helferportal CMS — Overview

Content-Management-System for editing and deploying Helferportal HTML prototypes.

---

## Architecture

```
Annotated HTML ──extract.js──▸ JSON ──▸ Supabase (online)
        (data-block, data-field)            │
                                            ▼
                                      admin.html (editor UI)
                                            │
                                            ▼
Supabase / local JSON ──deploy.js──▸ Updated HTML ──▸ GitHub Pages
```

## Components

### Web Editor — `tools/admin.html`

Two-panel SPA (sidebar + editor) with three entry stages: Config → Login → App.

| Feature | Details |
|---------|---------|
| **Online mode** | Supabase auth (email/password), CRUD on `pages` table, image upload to Storage |
| **Offline mode** | Auto-discovers pages from `content/manifest.json`, load/download JSON files |
| **Field types** | text, textarea, image (with preview + drag-drop upload), button, link, video, html |
| **Compact grid** | Consecutive short text fields (e.g. city name + status) rendered side-by-side in 2-column layout |
| **Collapse/expand** | All blocks collapsed by default except the first; toggle via header click |
| **Sidebar nav** | Clickable block list, auto-highlights on scroll, jump-to-block |
| **German labels** | `BLOCK_LABELS` / `FIELD_LABELS` lookup — proper umlauts (Städte, Angehörige, etc.) |
| **Save tracking** | Unsaved indicator, Ctrl+S shortcut, warn-on-leave |
| **Toast messages** | Success / error / info notifications (auto-dismiss) |

### CLI Tools — `tools/`

| Tool | Command | Purpose |
|------|---------|---------|
| **extract.js** | `node extract.js <html> <json>` | Parse annotated HTML → JSON (reads `data-block` / `data-field` attributes) |
| **build.js** | `node build.js <json> <html>` | Apply JSON content back into HTML (inverse of extract) |
| **deploy.js** | `node deploy.js [--local] [--page <id>]` | Full pipeline: Supabase → JSON → HTML. `--local` skips Supabase pull |

**Dependency:** `cheerio` (server-side DOM manipulation).

NPM scripts in `tools/package.json`:
```
npm run extract:startseite   # HTML → JSON
npm run build:startseite     # JSON → HTML
npm run deploy               # Supabase → JSON → HTML (all pages)
npm run deploy:local         # JSON → HTML (skip Supabase)
```

### Database — `tools/supabase-setup.sql`

```sql
pages (
  id          TEXT PRIMARY KEY,    -- 'startseite', 'hilfe-finden'
  title       TEXT NOT NULL,
  url         TEXT DEFAULT '/',
  content     JSONB,              -- full block/field structure
  updated_at  TIMESTAMPTZ,
  updated_by  TEXT                -- editor's email
)
```

- Row Level Security: authenticated users can read/write
- Auto-updated `updated_at` trigger
- Storage bucket `images` (public read, authenticated write)

### Content Files — `content/`

| File | Purpose |
|------|---------|
| `manifest.json` | Page registry for offline auto-discovery |
| `startseite.json` | Extracted content: 9 blocks, 94 fields |

## JSON Content Structure

```json
{
  "page": { "id": "startseite", "title": "...", "url": "/" },
  "blocks": [
    {
      "id": "b1",
      "type": "hero-slider",
      "fields": [
        { "id": "slide-0-image", "type": "image", "value": "https://...", "alt": "..." },
        { "id": "slide-0-title", "type": "text", "value": "Die Plattform für..." },
        { "id": "slide-0-btn",   "type": "button", "value": "Video ansehen", "href": "#" }
      ]
    }
  ]
}
```

## Workflows

**Edit content (online):**
Config → Login → Select page → Edit fields → Save (→ Supabase)

**Edit content (offline):**
Offline-Modus → Auto-loads from manifest → Edit → Save (downloads JSON) → `npm run build:startseite`

**Add a new page:**
1. Annotate HTML with `data-block` / `data-field` attributes
2. `node extract.js ../new-page.html ../content/new-page.json`
3. Add entry to `content/manifest.json`
4. (Online) Insert row into Supabase `pages` table

**Deploy to production:**
`npm run deploy` → push to `main` → GitHub Pages auto-deploys

## Config

| File | Purpose |
|------|---------|
| `tools/.env` | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (for deploy.js) |
| `tools/.env.example` | Template |
| `localStorage:hp_cms_config` | Browser-stored URL + Anon Key (for admin.html) |
