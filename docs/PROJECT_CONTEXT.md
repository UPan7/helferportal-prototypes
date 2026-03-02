# Helferportal CMS — Project Context

> Canonical reference for developers and LLMs continuing work on this project.
> Last updated: 2026-03-02 | Registry v1.1 | Content schema v2.0

---

## 1. Executive Summary

### What is Helferportal CMS?

A **static-HTML CMS pipeline** for [helferportal.kamanin.at](https://www.helferportal.kamanin.at/). The project consists of:

- **7 HTML prototype pages** — clickable, responsive wireframes (~80% design fidelity) for client review
- **A content extraction/build pipeline** — bidirectional sync between annotated HTML and structured JSON
- **A browser-based editor** (`tools/admin.html`) — with Supabase backend, live preview, image upload, and draft autosave
- **A block registry** (`tools/block-registry.json`) — frozen schema defining all valid block types, field patterns, and aliases

### What problems does it solve?

1. **Content editing without code** — Non-technical editors modify page content through a visual UI
2. **Structured content** — Every text, image, and link is a named field with a type and level
3. **Round-trip fidelity** — HTML → JSON → HTML without data loss or DOM corruption
4. **Client review** — Prototype pages are live on GitHub Pages for client approval

### Current status

- **Pages converted**: 7/7 (100%) — startseite, hilfe-finden, engagieren, fuer-kommunen, ueber-uns, kontakt, muenchen
- **Block registry**: frozen at v1.1 (15 block types, 24 aliases)
- **Content schema**: v2.0 with basic/advanced field levels
- **MVP feedback**: working (Supabase insert, anon-safe RLS)
- **Deployment**: GitHub Pages auto-deploy on push to `main`

---

## 2. Repo Layout

```
helferportal-prototypes/          ← Git root = document root (GitHub Pages)
├── CLAUDE.md                     ← Project instructions for LLM
├── CNAME                         ← Custom domain: www.helferportal.kamanin.at
│
├── index.html                    ← Startseite (page-startseite)
├── hilfe-finden.html             ← page-hilfe-finden
├── engagieren.html               ← page-engagieren
├── fuer-kommunen.html            ← page-fuer-kommunen
├── ueber-uns.html                ← page-ueber-uns
├── kontakt.html                  ← page-kontakt
├── muenchen.html                 ← page-muenchen
│
├── assets/
│   ├── shared-styles.css         ← ALL CSS (single file, ~5900 lines)
│   ├── shared-scripts.js         ← ALL JS (mega menu, tabs, FAQ, mobile, slider)
│   └── preview-bridge.js         ← Live preview bridge (active only in CMS iframe)
│
├── content/
│   ├── manifest.json             ← Page index (id, title, file)
│   ├── startseite.json           ← 9 blocks, ~277 fields
│   ├── hilfe-finden.json         ← 5 blocks, ~89 fields
│   ├── engagieren.json           ← 6 blocks, ~99 fields
│   ├── fuer-kommunen.json        ← 5 blocks, ~98 fields
│   ├── ueber-uns.json            ← 6 blocks, ~80 fields
│   ├── kontakt.json              ← 3 blocks, ~36 fields
│   ├── muenchen.json             ← 7 blocks, ~128 fields
│   └── Logos/                    ← Uploaded logo images
│
├── tools/
│   ├── admin.html                ← CMS editor (single-page app, ~3400 lines)
│   ├── extract.js                ← HTML → JSON extractor
│   ├── build.js                  ← JSON → HTML builder
│   ├── deploy.js                 ← Supabase → JSON → HTML deploy pipeline
│   ├── validate.js               ← HTML/JSON integrity checker
│   ├── block-registry.json       ← Canonical block type definitions
│   ├── lib/field-ops.js          ← Shared field application logic
│   ├── package.json              ← Node deps (cheerio only)
│   ├── CMS-OVERVIEW.md           ← CMS architecture overview
│   ├── DEVELOPMENT-PLAN.md       ← Development plan and decisions
│   ├── fix-header-footer.js      ← One-time migration: header/footer standardization
│   ├── fix-links.js              ← One-time migration: link normalization
│   └── refactor-css.js           ← One-time migration: CSS consolidation
│
├── reference/                    ← Source materials (not served)
│   ├── Design_Brief_*.xlsx       ← Design briefs
│   ├── Webseiteninhalte*.pptx    ← Content overview slides
│   └── intake/                   ← Content intake forms
│
└── docs/
    └── PROJECT_CONTEXT.md        ← This file
```

### Single source of truth principles

- **HTML pages** are the visual source of truth — they contain all DOM structure and annotations
- **JSON files** are the content source of truth — they hold every field value, type, and level
- **Block registry** is the schema source of truth — it defines what block types and field patterns are valid
- **shared-styles.css** is the sole CSS file — no inline styles, no per-page CSS files

---

## 3. Architecture Overview

### System diagram

```
                        ┌─────────────────┐
                        │  block-registry  │  (schema: types, fields, aliases)
                        │     .json        │
                        └────────┬─────────┘
                                 │ consulted by
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  ┌───────────┐          ┌──────────────┐          ┌──────────────┐
  │ extract.js │          │ validate.js  │          │  admin.html  │
  │ HTML→JSON  │          │ check both   │          │ CMS editor   │
  └─────┬─────┘          └──────────────┘          └──────┬───────┘
        │                                                  │
        ▼                                                  │ postMessage
  ┌───────────┐     ┌───────────┐                   ┌─────▼──────┐
  │content.json│────►│ build.js  │                   │preview-    │
  │            │     │ JSON→HTML │                   │bridge.js   │
  └────────────┘     └─────┬─────┘                   └────────────┘
                           │                                ▲
                           ▼                                │ iframe
                     ┌───────────┐          ┌───────────────┤
                     │ page.html │          │  Supabase     │
                     │ (updated) │          │  (pages table)│
                     └───────────┘          └───────────────┘
                                                    ▲
                           ┌────────────────────────┘
                           │ fetch/push
                     ┌─────┴─────┐
                     │ deploy.js │
                     │ Supa→JSON │
                     │  →HTML    │
                     └───────────┘
```

### HTML annotations

Every content section is annotated with data attributes:

```html
<section class="hero" data-block="hero-slider" data-block-id="b1">
  <h1 data-field="slide-1-heading" data-field-type="text">...</h1>
  <p data-field="slide-1-subheading" data-field-type="textarea">...</p>
  <img data-field="slide-1-image" data-field-type="image" src="..." alt="..." />
  <a data-field="slide-1-btn" data-field-type="button" href="...">...</a>
</section>
```

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-block` | Semantic block type (maps to registry) | `hero-slider`, `tabs-section`, `faq-section` |
| `data-block-id` | Page-local sequential ID | `b1`, `b2`, `b3` |
| `data-field` | Unique field identifier within block | `slide-1-heading` |
| `data-field-type` | Field type for extraction/application | `text`, `textarea`, `image`, `button`, `link`, `video`, `html` |

### Block Registry (`tools/block-registry.json`)

Frozen schema v1.1 with 15 block types:

| Block Type | Purpose | Aliases |
|------------|---------|---------|
| `hero` | Page entry section | `hero-slider`, `hero-city` |
| `tabs` | Tabbed content panels | `tabs-section`, `info-tabs` |
| `cards` | Grid of cards with icons/images | `quick-actions`, `schulungen-section`, `schulungen`, `problems-section`, `support-section` |
| `vorteile` | Feature advantages grid | `vorteile-section`, `shared-vorteile-section` |
| `video` | Video showcase grid | `video-section` |
| `cities` | City/location cards | `staedte-section` |
| `steps` | How-it-works sequential | `how-it-works` |
| `accordion` | Expandable info sections | (none) |
| `faq` | Q&A accordion | `faq-section` |
| `testimonial` | Quote + attribution | (none) |
| `logos` | Partner/sponsor logo grid | `partners` |
| `text-section` | Freeform content (mission, about, timeline, team) | `mission-section`, `timeline-section`, `team-section` |
| `contact-form` | Contact/inquiry form | `contact-section` |
| `cta-banner` | Call-to-action section | `cta-section`, `cta-download-section` |

Each block definition includes: `label`, `purpose`, `variants[]`, `pages[]`, `fields{}`, optional `aliases{}` and `notes`.

Field patterns use `{N}` for numeric indices and `{key}` for semantic slugs:
- `slide-{N}-title` matches `slide-1-title`, `slide-2-title`
- `tab-{key}-name` matches `tab-hilfe-name`, `tab-engagierte-name`

Constraints: max 15 block types, max 4 variants per block.

### Extractor (`tools/extract.js`)

**Direction**: Annotated HTML → structured JSON

```bash
node tools/extract.js ../index.html ../content/startseite.json
```

How it works:
1. Parse HTML with Cheerio
2. Read `<body class="page-{slug}">` for page ID
3. Walk all `[data-block]` sections, extract `data-block-id` and `data-block` type
4. For each block, find all `[data-field]` elements inside it
5. Extract value based on `data-field-type`:
   - `image` → `{ src, alt }` from attributes
   - `button`/`link` → text + `href`
   - `video` → label text + thumbnail `{ src, alt }`
   - `textarea` with children → `extractStructuredText()` (pipe-delimited `Title | Description` per line)
   - `text` → `.text().trim()`
   - `html` → `.html()`
6. Load block-registry.json, match each field ID to a pattern (exact or regex with `{N}`/`{key}` placeholders)
7. Assign `level: "basic"` or `"advanced"` from registry match (default: `"basic"`)
8. Write JSON with `_meta` (generator, source, timestamp, schema_version), `page`, and `blocks[]`

### Builder (`tools/build.js`)

**Direction**: JSON → annotated HTML (applies content values back)

```bash
node tools/build.js ../content/startseite.json ../index.html
```

How it works:
1. Parse JSON, build lookup map keyed by **`blockId:fieldId`** (composite key for block-scoped resolution)
2. Parse HTML with Cheerio
3. Walk all `[data-field]` elements
4. For each, resolve block scope via `$el.closest('[data-block-id]').attr('data-block-id')`
5. Look up field in map: `fieldMap.get(\`${blockId}:${fieldId}\`)`
6. Call `applyField($, $el, fieldType, field)` from `lib/field-ops.js`
7. Write updated HTML

**Critical**: Block-scoped lookup prevents silent data corruption when the same block type appears multiple times on a page (e.g., two `cards` blocks both having `card-1-title`).

### Deploy (`tools/deploy.js`)

**Direction**: Supabase → JSON files → HTML (full pipeline)

```bash
node tools/deploy.js                    # Pull all pages from Supabase + build
node tools/deploy.js --page startseite  # Pull + build one page
node tools/deploy.js --local            # Build from local JSON only (no Supabase)
```

- Contains a hardcoded `PAGE_MAP` mapping all 7 pages to their HTML/JSON paths
- Fetches from Supabase REST API using service_role key (from `.env` or environment)
- Writes JSON files, then runs the same build logic as `build.js` inline

### Shared field-ops (`tools/lib/field-ops.js`)

Three exported functions used by `build.js` and `deploy.js`:

| Function | Purpose |
|----------|---------|
| `resolveImage(field)` | Normalize image to `{ src, alt }` — handles nested (`field.value.src`) and legacy flat (`field.value` as string) formats |
| `applyField($, $el, fieldType, field)` | Apply a field value to a Cheerio element based on type (text/textarea/image/button/link/video/html) |
| `setTextOnly($, $el, newText)` | Replace only the first non-empty text node, preserving SVG/icon children |

### Admin editor (`tools/admin.html`)

Single-page app (~3400 lines) providing:
- **Supabase auth** (email/password login)
- **Page loading/saving** (JSONB content column in `pages` table)
- **Field editing** by block type, with fields grouped by entity
- **Live preview** via iframe + postMessage bridge
- **Image upload** to Supabase Storage (tmp/ → final path on save)
- **Draft autosave** to localStorage
- **Content normalization** (merge missing fields from reference JSON)
- **MVP feedback form** (insert to `feedback` table)

---

## 4. CSS / Presentation Layer Contracts

### Single `:root` (lines 10–82 of `shared-styles.css`)

One `:root` block defines all design tokens:
- **16 brand colors**: orange/blue/purple/green (primary, light, lighter, dark each)
- **5 additional colors**: yellow variants, white, black
- **11 neutrals**: gray-50 through gray-900
- **5 shadows**: sm through 2xl
- **5 radii**: sm (6px) through full (9999px)
- **7 spacing**: xs (4px) through 3xl (64px)
- **2 fonts**: `--font-display` (Plus Jakarta Sans), `--font-body` (DM Sans)
- **3 transitions**: fast (150ms), normal (250ms), slow (400ms)

### Shared components (not scoped by `.page-*`)

Lines 154–1711. These are available to all pages:
- Header, navigation, mega menu, mobile menu
- `.hero-mini` (subpage hero)
- `.tabs-section`, `.tabs-nav`, `.tab-panel`, `.tab-option`
- `.btn-primary`, `.btn-secondary`
- `.faq-section`, `.faq-item`
- `.cta-section`
- `.testimonial-section`, `.partners-section`
- `.footer`

### Page-specific CSS (scoped under `.page-{slug}`)

Lines 1715–5890. Each page declares its accent and has unique components:

```css
.page-startseite    { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-hilfe-finden  { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-engagieren    { --accent: var(--orange-primary);  --accent-light: var(--orange-light); }
.page-fuer-kommunen { --accent: var(--purple-primary);  --accent-light: var(--purple-light); }
.page-ueber-uns     { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-kontakt       { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-muenchen      { --accent: var(--orange-primary);  --accent-light: var(--orange-light); }
```

Page-specific sections include: `.page-startseite .hero` (slider), `.page-engagieren .activities-box`, `.page-fuer-kommunen .hero` (purple gradient), `.page-muenchen .hero-city`, etc.

### Hybrid accent system

- Each page's `<body class="page-{slug}">` sets `--accent` and `--accent-light`
- Shared components reference `var(--accent)` for context-aware coloring
- Example: `.nav-btn.active { background: var(--accent); }` adapts to the current page's color

### Do-not-regress checklist

- [ ] Exactly one `:root` block
- [ ] Shared components NOT scoped under `.page-*`
- [ ] Page-specific CSS scoped ONLY under `.page-{slug}`
- [ ] Every page's `<body>` has the correct `.page-{slug}` class
- [ ] `--accent` / `--accent-light` set on every page class
- [ ] No inline CSS in HTML pages (except admin.html)

---

## 5. Editor UX & Field Grouping

### How `groupByEntity()` works

Located in `admin.html` (~line 1727). Groups a block's fields into three sections:

1. **`_header_`** — Non-repeatable, non-button fields (section title, overline, etc.)
2. **Entities** — Repeatable fields grouped by entity key (e.g., all `tab-hilfe-*` fields form entity "hilfe")
3. **`_footer_`** — Non-repeatable button/link fields (CTA buttons)

For each field, `resolveFieldEntity(blockType, fieldId)` determines:
- Whether the field is `repeatable` (based on registry patterns)
- The `entity` key (extracted from the field ID via regex capture groups)

### How `resolveFieldEntity()` works

Located in `admin.html` (~line 1682):

1. Find block definition by type or alias in the registry
2. Flatten all variant field maps (keys starting with `_` hold variant-specific patterns)
3. Sort patterns by specificity (fewer placeholders first, longer strings first)
4. Match field ID against each pattern:
   - Non-repeatable: exact string match → returns `{ entity: '_header_', repeatable: false }`
   - Repeatable: convert `{N}` and `{key}` to regex capture groups → extract entity key
   - Example: pattern `tab-{key}-name` + field `tab-hilfe-name` → entity `"hilfe"`
5. Fallback: unmatched fields go to `_header_` (non-repeatable)

### Common failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| All fields in `_header_` (flat, ungrouped) | Block type not found in registry (no alias) | Add alias to `block-registry.json` |
| Field appears in wrong entity | Pattern match is incorrect or ambiguous | Check pattern specificity ordering |
| Field missing from editor | Field ID in JSON doesn't match any HTML `data-field` | Run `validate.js` to detect ghosts/orphans |

### Naming conventions (must follow)

- Repeatable fields: `{prefix}-{N}-{property}` (1-indexed, except legacy `slide-0`)
- Semantic slug fields: `{prefix}-{key}-{property}` (e.g., `tab-hilfe-title`)
- Standard property suffixes: `-title`, `-text`, `-image`, `-btn`, `-href`, `-name`, `-icon`
- Block-level fields: `section-title`, `section-overline` (non-repeatable)

---

## 6. Data Model (JSON Content)

### File structure (`content/{page}.json`)

```json
{
  "_meta": {
    "generator": "helferportal-content-tools/extract.js",
    "source": "index.html",
    "extracted": "2026-03-01T22:30:34.794Z",
    "schema_version": "2.0"
  },
  "page": {
    "id": "startseite",
    "title": "Helferportal – Unterstützung finden, Engagement ermöglichen",
    "url": "/"
  },
  "blocks": [
    {
      "id": "b1",
      "type": "hero-slider",
      "fields": [
        {
          "id": "slide-1-heading",
          "type": "text",
          "value": "Willkommen beim Helferportal",
          "level": "basic"
        },
        {
          "id": "slide-1-image",
          "type": "image",
          "value": { "src": "https://...", "alt": "Description" },
          "level": "basic"
        },
        {
          "id": "slide-1-btn",
          "type": "button",
          "value": "Jetzt starten",
          "href": "/hilfe-finden.html",
          "level": "basic"
        }
      ]
    }
  ]
}
```

### Image field format

**Current standard** (nested):
```json
{ "value": { "src": "https://...", "alt": "Description" } }
```

**Legacy format** (flat string — still supported via `resolveImage()`):
```json
{ "value": "https://...", "alt": "Description" }
```

`resolveImage()` in `field-ops.js` normalizes both formats to `{ src, alt }`. The validator warns on legacy format (`LEGACY IMAGE` warning).

### Field types

| Type | Value format | Additional props | Usage |
|------|-------------|------------------|-------|
| `text` | string | — | Headings, labels, short text |
| `textarea` | string (may be pipe-delimited for cards) | — | Paragraphs, structured card content |
| `image` | `{ src, alt }` | — | Images with accessibility alt text |
| `button` | string (button label) | `href` | CTA buttons with link |
| `link` | string (link text) | `href` | Standalone links |
| `video` | string (label) | `thumbnail` (string or `{src, alt}`) | Video cards |
| `html` | raw HTML string | — | Rich content (rare, internal use) |

### Field levels

- `basic` — Core content visible to regular editors (titles, text, primary images)
- `advanced` — Metadata/secondary fields (icons, alt text, secondary links)

---

## 7. MVP Feedback Feature

### What it does

A feedback modal in `admin.html` lets editors submit feedback about a specific page. Inserts a row into the Supabase `feedback` table.

### Where it lives

- **UI**: `admin.html` — feedback button in toolbar, modal with textarea + optional email
- **Function**: `submitFeedback()` (~line 3147)
- **Textarea**: `maxlength="2000"` with "max. 2000 Zeichen" hint

### Database schema

```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  page_slug TEXT,           -- Which page the feedback is about
  message TEXT,             -- Feedback message (UNSANITIZED in DB)
  email TEXT,               -- Optional contact email
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Security notes

- **RLS requirement**: anon role = INSERT only (no SELECT/UPDATE/DELETE). Authenticated role = SELECT + INSERT.
- **XSS**: Messages are stored unsanitized. Any UI that *reads* feedback must escape HTML on render.
- **Maxlength**: 2000 characters enforced client-side. Consider server-side validation if abuse becomes an issue.
- **No notifications**: Feedback is stored silently. Check the Supabase dashboard to read submissions.

---

## 8. Operational Workflows

### Add a new page (from existing HTML)

1. Create `{page}.html` in the repo root with proper `<body class="page-{slug}">`
2. Add `data-block`/`data-block-id` to all `<section>` elements
3. Add `data-field`/`data-field-type` to all editable content elements
4. Ensure field IDs match registry patterns for the block type
5. Add CSS accent declaration: `.page-{slug} { --accent: var(--{color}-primary); --accent-light: var(--{color}-light); }`
6. Run extract to generate JSON:
   ```bash
   cd tools && node extract.js ../{page}.html ../content/{page}.json
   ```
7. Add page to `content/manifest.json`
8. Add page to `deploy.js` PAGE_MAP
9. Update header/footer navigation on ALL pages
10. Validate:
    ```bash
    cd tools && node validate.js {page}
    ```

### Annotate blocks/fields checklist

- [ ] Every `<section>` has `data-block="{type}"` and `data-block-id="bN"`
- [ ] Block IDs are sequential per page (b1, b2, b3...)
- [ ] Block type matches a registry entry or alias
- [ ] Every editable element has `data-field="{id}"` and `data-field-type="{type}"`
- [ ] Field IDs follow registry naming patterns (`{prefix}-{N}-{property}`)
- [ ] Images use `data-field-type="image"` (not "text")
- [ ] Buttons/links have both text content and `href`
- [ ] No duplicate `data-field` IDs within the same block
- [ ] No `data-field` elements outside a `[data-block-id]` container

### Pipeline commands

All commands run from the `tools/` directory:

```bash
# Extract: HTML → JSON
node extract.js ../index.html ../content/startseite.json
node extract.js ../hilfe-finden.html ../content/hilfe-finden.json

# Validate: check HTML/JSON consistency
node validate.js startseite              # Normal mode (ghosts = warnings)
node validate.js startseite --strict     # Strict mode (ghosts = errors, prefix check)
node validate.js hilfe-finden
node validate.js engagieren
node validate.js fuer-kommunen
node validate.js ueber-uns
node validate.js kontakt
node validate.js muenchen

# Build: JSON → HTML (apply content back)
node build.js ../content/startseite.json ../index.html
node build.js ../content/muenchen.json ../muenchen.html

# Deploy: Supabase → JSON → HTML (all pages)
node deploy.js                           # Full pipeline (requires .env)
node deploy.js --page startseite         # Single page
node deploy.js --local                   # Local JSON only (no Supabase)
```

### Validate all pages (batch)

```bash
cd tools
for page in startseite hilfe-finden engagieren fuer-kommunen ueber-uns kontakt muenchen; do
  node validate.js "$page"
done
```

Expected: `Result: PASS (0 errors, 0 warnings)` for each page.

### Smoke test checklist

**Browser (GitHub Pages or local `npx serve .`):**
- [ ] All 7 pages load without console errors
- [ ] Navigation links work across all pages (root-relative)
- [ ] Mega menu opens/closes correctly
- [ ] Active nav state (`.active`) highlights current page
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

---

## 9. Known Issues & Tech Debt Radar

### PAGE_MAP hardcoding

`deploy.js` lines 37–66 hardcode all 7 page mappings. A `content/manifest.json` exists but is not consumed by deploy.js.

**Future**: Read `manifest.json` + derive HTML paths by convention to avoid manual sync.

### Validate warnings behavior

`validate.js` allows cross-block duplicates (e.g., two `cards` blocks both having `card-1-title`) but flags intra-block duplicates as errors. This is by design — build.js scopes by `data-block-id`.

### Header/footer duplication

All 7 HTML pages contain identical header and footer markup. Changes require updating all pages manually.

**Future**: HTML includes/templating or build-time injection.

### Cheerio serialization artifacts

Running `build.js` reformats HTML through Cheerio's serializer (boolean attributes, entity encoding, whitespace changes). This creates false diffs. After a build round-trip, restore originals with `git checkout -- *.html` if only testing.

### Build logic duplication

`deploy.js` contains an inline copy of `build.js`'s field application loop (lines 176–202). Changes to build logic must be applied in both files.

**Future**: Extract shared build function or have deploy.js call build.js as a subprocess.

### No automated tests

The pipeline has no unit or integration tests. Validation is manual via `validate.js`.

### Image upload preview gap

`handleImageUpload()` calls `sendPreviewUpdate()` for live preview. Confirmed working. However, the preview bridge only updates `el.src` for images — no CSS background-image support.

---

## 10. Contribution Guidelines / Guardrails

### Hard rules (never violate)

- **Never add a new `:root`** — All tokens live in the single `:root` block at the top of `shared-styles.css`
- **Never use page-scoped selectors for shared components** — `.page-startseite .btn-primary` is wrong; `.btn-primary.blue` is right
- **Never invent field IDs outside registry patterns** — New fields must follow `{prefix}-{N}-{property}` and be documented in `block-registry.json`
- **Always use root-relative links** — `/hilfe-finden.html`, not `hilfe-finden.html` or `https://www.helferportal.kamanin.at/hilfe-finden.html`
- **Always validate before merge** — Run `node validate.js {page}` for every modified page
- **Never commit secrets** — The Supabase anon key in `admin.html` is intentionally public (client-side, RLS-protected). The `service_role` key must ONLY exist in `tools/.env` (gitignored).
- **Never add new block types without registry entry** — Every `data-block` value must resolve to a registry type or alias

### Soft guidelines

- Keep CSS under `.page-{slug}` scope for page-specific styles
- Prefer `--accent` / `--accent-light` over hardcoded colors in shared components
- Use `basic` level for content editors, `advanced` for developer/power-user fields
- Image fields must use `{ src, alt }` format (not flat string)
- Button/link fields must have both `value` (text) and `href` (URL)
- Run `node validate.js {page} --strict` for thorough checks including prefix validation

### Pre-merge commands

```bash
cd tools

# 1. Validate all pages
for page in startseite hilfe-finden engagieren fuer-kommunen ueber-uns kontakt muenchen; do
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
