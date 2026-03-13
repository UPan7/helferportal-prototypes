# Architecture

> System overview, data flows, tool descriptions, and CMS editor internals.

---

## Executive Summary

### What is Helferportal CMS?

A **static-HTML CMS pipeline** for [helferportal.kamanin.at](https://www.helferportal.kamanin.at/). The project consists of:

- **7 HTML prototype pages** — clickable, responsive wireframes (~80% design fidelity) for client review
- **A content extraction/build pipeline** — bidirectional sync between annotated HTML and structured JSON
- **A browser-based editor** (`tools/admin.html`) — with Supabase backend, live preview, image upload, and draft autosave
- **A block registry** (`tools/block-registry.json`) — frozen schema defining all valid block types, field patterns, and aliases

### What problems does it solve?

1. **Content editing without code** — non-technical editors modify page content through a visual UI
2. **Structured content** — every text, image, and link is a named field with a type and level
3. **Round-trip fidelity** — HTML → JSON → HTML without data loss or DOM corruption
4. **Client review** — prototype pages are live on GitHub Pages for client approval

### Current status

- **Pages**: 7/7 converted (100%)
- **Block registry**: frozen at v1.1 (15 block types, 24 aliases)
- **Content schema**: v2.0 with basic/advanced field levels
- **MVP feedback**: working (Supabase insert, anon-safe RLS)
- **Deployment**: GitHub Pages auto-deploy on push to `main`

---

## System Diagram

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

                     ┌──────────────────┐
                     │sync-to-supabase  │
                     │ JSON→Supabase    │──────────────────►  Supabase
                     │ (conflict-safe)  │                     (pages table)
                     └──────────────────┘
```

### Source of truth principles

- **Supabase** = content source of truth (text, images, field values)
- **HTML pages** = structural source of truth (DOM, annotations, layout)
- **JSON files** = local content cache (synced with Supabase)
- **Block registry** = schema source of truth (valid block types and field patterns)
- **shared-styles.css** = sole CSS file (no inline styles, no per-page CSS files)

---

## HTML Annotation Layer

Every content section is annotated with `data-*` attributes that enable the pipeline:

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

---

## CLI Tools

### Extractor (`tools/extract.js`)

**Direction:** Annotated HTML → structured JSON

```bash
node tools/extract.js ../index.html ../content/startseite.json
```

How it works:
1. Parse HTML with Cheerio
2. Read `<body class="page-{slug}">` for page ID
3. Walk all `[data-block]` sections, extract type and ID
4. For each block, find all `[data-field]` elements
5. Extract value based on `data-field-type`:
   - `image` → `{ src, alt }` from attributes
   - `button`/`link` → text + `href`
   - `video` → label + thumbnail
   - `textarea` with children → `extractStructuredText()` (pipe-delimited)
   - `text` → `.text().trim()`
   - `html` → `.html()`
6. Match each field ID to registry patterns, assign `level` (basic/advanced)
7. Write JSON with `_meta`, `page`, and `blocks[]`

### Builder (`tools/build.js`)

**Direction:** JSON → annotated HTML (applies content values)

```bash
node tools/build.js ../content/startseite.json ../index.html
```

How it works:
1. Parse JSON, build lookup map keyed by `blockId:fieldId` (composite key)
2. Parse HTML with Cheerio
3. Walk all `[data-field]` elements
4. Resolve block scope via `$el.closest('[data-block-id]')`
5. Look up field: `fieldMap.get(\`${blockId}:${fieldId}\`)`
6. Call `applyField()` from `lib/field-ops.js`

**Critical:** Block-scoped lookup prevents silent data corruption when the same block type appears multiple times on a page.

### Deploy (`tools/deploy.js`)

**Direction:** Supabase → JSON → HTML (full pipeline)

```bash
node tools/deploy.js                    # Pull all pages + build
node tools/deploy.js --page startseite  # Pull + build one page
node tools/deploy.js --local            # Build from local JSON only
```

Uses `lib/config.js` for PAGE_MAP, .env loading, and Supabase config. Fetches via REST API with service_role key.

### Reverse Sync (`tools/sync-to-supabase.js`)

**Direction:** Local JSON → Supabase (conflict-safe)

```bash
node tools/sync-to-supabase.js --page fuer-kommunen        # With conflict check
node tools/sync-to-supabase.js --page fuer-kommunen --force # Skip check
```

Conflict detection: compares local `_meta.lastEdited` with Supabase. Skips if remote is newer (unless `--force`).

### Validator (`tools/validate.js`)

Checks HTML/JSON field consistency. Detects orphans (in JSON but not HTML) and ghosts (in HTML but not JSON).

```bash
node tools/validate.js startseite          # Normal mode
node tools/validate.js startseite --strict # Strict mode (ghosts = errors)
```

### Round-trip Test (`tools/test-roundtrip.js`)

Runs extract → build → validate for all 7 pages. Verifies pipeline integrity.

```bash
node tools/test-roundtrip.js             # All pages
node tools/test-roundtrip.js startseite  # One page
```

---

## Shared Libraries

### `lib/config.js`

Centralizes configuration for CLI tools:

| Export | Purpose |
|--------|---------|
| `loadEnv()` | Parse `tools/.env` into `process.env` |
| `PAGE_IDS` | Array of all 7 page identifiers |
| `getPageMap()` | Build `{ pageId: { html, json } }` mapping |
| `getSupabaseConfig()` | Validate and return `{ url, key }` from env vars |
| `CONTENT_DIR`, `ROOT_DIR`, `TOOLS_DIR` | Resolved path constants |

### `lib/registry.js`

Block type alias resolution:

| Export | Purpose |
|--------|---------|
| `resolveBlockDef(blockType, registry)` | Look up block definition by type or alias. Returns `null` if not found. |

### `lib/field-ops.js`

Shared field application logic used by `build.js` and `deploy.js`:

| Function | Purpose |
|----------|---------|
| `resolveImage(field)` | Normalize image to `{ src, alt }` — handles nested and legacy flat formats |
| `applyField($, $el, fieldType, field)` | Apply field value to Cheerio element based on type |
| `setTextOnly($, $el, newText)` | Replace text node only, preserving SVG/icon children |
| `applyStructuredText($, $el, text)` | Apply pipe-delimited text to structured containers (cards, lists), preserving HTML |

---

## CMS Editor (`tools/admin.html`)

Single-page app (~3400 lines) providing:

| Feature | Details |
|---------|---------|
| Supabase auth | Email/password login |
| Page loading/saving | JSONB content column in `pages` table |
| Field editing | By block type, fields grouped by entity |
| Live preview | Iframe + postMessage bridge |
| Image upload | Supabase Storage (tmp/ → final path on save) |
| Draft autosave | localStorage |
| Content normalization | Merge missing fields from reference JSON |
| Feedback form | Insert to `feedback` table |
| Compact grid | Short text fields rendered side-by-side |
| Collapse/expand | Blocks collapsed by default except the first |
| German labels | `BLOCK_LABELS` / `FIELD_LABELS` lookup objects |

### Field Grouping

`groupByEntity()` (~line 1727) groups a block's fields into three sections:

1. **`_header_`** — non-repeatable, non-button fields (section title, overline)
2. **Entities** — repeatable fields grouped by entity key (e.g., all `tab-hilfe-*` fields)
3. **`_footer_`** — non-repeatable button/link fields (CTAs)

`resolveFieldEntity()` (~line 1682) determines entity membership:
1. Find block definition by type/alias in registry
2. Flatten all variant field maps
3. Sort patterns by specificity (fewer placeholders first)
4. Match field ID: exact match → `_header_`; regex with `{N}`/`{key}` → extract entity key
5. Fallback: unmatched fields go to `_header_`

### Live Preview Architecture

The preview uses an iframe + postMessage bridge pattern:

1. **`preview-bridge.js`** is a static file loaded by all prototype pages via `shared-scripts.js`
2. Self-activates only inside iframe (`window !== window.top`)
3. Sends `hp-cms-ready` → admin.html responds with `hp-cms-init` (full page JSON)
4. Field edits dispatch `hp-cms-update` messages (debounced 150ms)
5. Field focus sends `hp-cms-highlight` → outline + scroll-into-view in preview

**Message protocol:**

| Direction | Type | Payload |
|-----------|------|---------|
| Admin → Preview | `hp-cms-init` | Full page JSON |
| Admin → Preview | `hp-cms-update` | `{ fieldId, prop, value }` |
| Admin → Preview | `hp-cms-highlight` | `{ fieldId }` |
| Admin → Preview | `hp-cms-unhighlight` | — |

**Preview mode:** `window.__CMS_PREVIEW__ = true` disables slider autoplay and suppresses animations via `.cms-preview` CSS class.

**Security:** All postMessage calls use `location.origin` as targetOrigin, and all receivers check `e.origin`. Same-origin only.

---

## Known Technical Debt

### Active issues

| Issue | Impact | Future fix |
|-------|--------|------------|
| Header/footer duplicated in all 7 pages | Manual updates across all files | HTML includes or build-time injection |
| München page uses hardcoded hex colors | Inconsistent with CSS variable system | Replace with `var(--*)` references |
| `deploy.js` inlines `build.js` iteration loop | Code duplication (shared `field-ops.js` mitigates) | Extract shared build function |
| `admin.html` is a 3400-line monolith | Hard to navigate | No immediate plans to split |
| Cheerio serialization artifacts | False diffs after build round-trip | Use `git checkout` after testing |

### Resolved issues

See [CHANGELOG.md](./CHANGELOG.md) for fixed tech debt items.
