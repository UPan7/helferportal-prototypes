# Data Model

> JSON content schema, field types, block registry, and Supabase tables.

---

## Content JSON Schema

### File structure

Each page has a JSON file in `content/{page}.json`:

```json
{
  "_meta": {
    "generator": "helferportal-content-tools/extract.js",
    "source": "index.html",
    "extracted": "2026-03-01T22:30:34.794Z",
    "schema_version": "2.0",
    "lastEdited": "2026-03-08T14:21:21.618Z",
    "editedBy": "anon"
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
        }
      ]
    }
  ]
}
```

### `_meta` object

| Property | Type | Description |
|----------|------|-------------|
| `generator` | string | Tool that created the file |
| `source` | string | Source HTML filename |
| `extracted` | ISO timestamp | When extracted from HTML |
| `schema_version` | string | Content schema version (currently `"2.0"`) |
| `lastEdited` | ISO timestamp | Last edit time (used for conflict detection) |
| `editedBy` | string | Editor identifier |

### `page` object

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Page slug (e.g., `startseite`, `hilfe-finden`) |
| `title` | string | Page `<title>` content |
| `url` | string | Root-relative URL (e.g., `/`, `/hilfe-finden.html`) |

### `blocks[]` array

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Page-local sequential ID (`b1`, `b2`, `b3`...) |
| `type` | string | Semantic block type from registry (e.g., `hero-slider`, `tabs-section`) |
| `fields` | Field[] | Content fields within this block |

### `fields[]` array

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique field identifier within block (e.g., `slide-1-heading`) |
| `type` | string | Field type: `text`, `textarea`, `image`, `button`, `link`, `video`, `html` |
| `value` | string or object | Field value (format depends on type — see below) |
| `level` | string | `"basic"` or `"advanced"` (from registry match) |
| `href` | string | URL for `button` and `link` types |
| `thumbnail` | string or object | Thumbnail for `video` type |

---

## Field Types Reference

### text

Short text content — headings, labels, names.

```json
{ "id": "slide-1-heading", "type": "text", "value": "Willkommen", "level": "basic" }
```

**Application:** Sets element's text content (`.text()` in Cheerio, `.textContent` in DOM).

### textarea

Paragraphs and structured card content.

**Plain text:**
```json
{ "id": "section-description", "type": "textarea", "value": "A paragraph of text...", "level": "basic" }
```

**Structured (pipe-delimited):**
```json
{ "id": "card-1-text", "type": "textarea", "value": "Card Title | Card description text", "level": "basic" }
```

**Application:** Plain text uses `.text()`. Structured text (elements with children) uses `applyStructuredText()` — updates h3/h4 + p pairs, li > svg + text, and multi-paragraph stat-cards in-place, preserving HTML structure.

### image

Images with accessibility alt text.

**Current standard (nested):**
```json
{ "id": "slide-1-image", "type": "image", "value": { "src": "https://...", "alt": "Description" }, "level": "basic" }
```

**Legacy format (flat string — still supported):**
```json
{ "id": "slide-1-image", "type": "image", "value": "https://...", "alt": "Description", "level": "basic" }
```

`resolveImage()` in `field-ops.js` normalizes both formats to `{ src, alt }`. The validator warns on legacy format.

### button

CTA buttons with link.

```json
{ "id": "slide-1-btn", "type": "button", "value": "Jetzt starten", "href": "/hilfe-finden.html", "level": "basic" }
```

**Application:** Sets text content + `href` attribute. Uses `setTextOnly()` to preserve SVG/icon children.

### link

Standalone links.

```json
{ "id": "partner-1-link", "type": "link", "value": "Mehr erfahren", "href": "/ueber-uns.html", "level": "basic" }
```

**Application:** Same as button — text + `href`.

### video

Video cards with label and thumbnail.

```json
{ "id": "video-1", "type": "video", "value": "Einführungsvideo", "thumbnail": { "src": "https://...", "alt": "Preview" }, "level": "basic" }
```

**Application:** Sets label text + thumbnail `src`/`alt`.

### html

Raw HTML content. **Internal use only** — never exposed to client-editable free text.

```json
{ "id": "mission-content", "type": "html", "value": "<p>Rich HTML content...</p>", "level": "advanced" }
```

**Application:** Sets `innerHTML` directly. No sanitizer — security relies on the constraint that only internal editors use `html` fields.

---

## Field Levels

| Level | Audience | Examples |
|-------|----------|----------|
| `basic` | Content editors | Titles, paragraphs, primary images, CTAs |
| `advanced` | Power users / developers | Icons, alt text, secondary links, metadata |

The CMS editor uses levels to show/hide fields. Basic fields are always visible; advanced fields are behind a toggle.

---

## Block Registry

**Source of truth:** `tools/block-registry.json` (frozen at v1.1)

### Purpose

The registry defines all valid block types, their field patterns, and aliases. It's used by:
- `extract.js` — field level assignment and validation warnings
- `validate.js` — field pattern matching
- `admin.html` — field grouping by entity (groupByEntity / resolveFieldEntity)
- `lib/registry.js` — alias resolution (`resolveBlockDef()`)

### Constraints

- **Max 15 block types** — merge or justify before adding a 16th
- **Max 4 variants per block** — if more needed, it's two different blocks
- **New blocks require 2+ page reuse** — one-off layouts stay as custom HTML

### Current block types

| Block Type | Aliases | Pages | Purpose |
|------------|---------|-------|---------|
| `hero` | `hero-slider`, `hero-city` | All 7 | Page entry section |
| `tabs` | `tabs-section`, `info-tabs` | 4 | Tabbed content panels |
| `cards` | `quick-actions`, `schulungen-section`, `schulungen`, `problems-section`, `support-section` | 5 | Grid of cards with icons/images |
| `vorteile` | `vorteile-section`, `shared-vorteile-section` | 2 | Feature advantages grid |
| `video` | `video-section` | 1 | Video showcase grid |
| `cities` | `staedte-section` | 2 | City/location cards |
| `steps` | `how-it-works` | 2 | How-it-works sequential |
| `accordion` | — | varies | Expandable info sections |
| `faq` | `faq-section` | All 7 | Q&A accordion |
| `testimonial` | — | 1 | Quote + attribution |
| `logos` | `partners` | 2 | Partner/sponsor logo grid |
| `text-section` | `mission-section`, `timeline-section`, `team-section` | varies | Freeform content |
| `contact-form` | `contact-section` | 1 | Contact/inquiry form |
| `cta-banner` | `cta-section`, `cta-download-section` | varies | Call-to-action section |

### Field patterns

Patterns use placeholders for repeatable fields:
- `{N}` — numeric index (1-based): `slide-{N}-title` matches `slide-1-title`, `slide-2-title`
- `{key}` — semantic slug: `tab-{key}-name` matches `tab-hilfe-name`, `tab-engagierte-name`

Each field in the registry specifies: `type`, `label`, `level` (basic/advanced), `repeatable` (boolean), and optional `required`.

---

## Supabase Schema

### `pages` table

```sql
CREATE TABLE pages (
  id          TEXT PRIMARY KEY,    -- 'startseite', 'hilfe-finden', etc.
  title       TEXT NOT NULL,
  url         TEXT DEFAULT '/',
  content     JSONB,              -- full block/field structure
  updated_at  TIMESTAMPTZ,
  updated_by  TEXT                -- editor's email
);
```

- **RLS:** Authenticated users can read/write
- **Trigger:** `updated_at` auto-updates on each write
- **Content column:** Stores the full `blocks[]` + `fields[]` structure as JSONB

### `feedback` table

```sql
CREATE TABLE feedback (
  id          SERIAL PRIMARY KEY,
  page_slug   TEXT,               -- which page the feedback is about
  message     TEXT,               -- feedback message (stored unsanitized)
  email       TEXT,               -- optional contact email
  created_at  TIMESTAMP DEFAULT NOW()
);
```

- **RLS:** anon role = INSERT only; authenticated role = SELECT + INSERT
- **XSS note:** Messages stored unsanitized. Any UI reading feedback must escape HTML on render.
- **Maxlength:** 2000 characters (client-side). No server-side validation yet.
- **No notifications:** Check Supabase dashboard to read submissions.

### Storage

- **Bucket:** `images` (public read, authenticated write)
- **Path convention:** `images/{pageId}/{fieldId}-{timestamp}.{ext}`
- **No CDN or resize pipeline** — not needed at this stage

---

## Naming Conventions

### Field IDs

| Pattern | Example | Usage |
|---------|---------|-------|
| `{prefix}-{N}-{property}` | `slide-1-title` | Repeatable numeric fields |
| `{prefix}-{key}-{property}` | `tab-hilfe-name` | Repeatable semantic fields |
| `section-{property}` | `section-title` | Non-repeatable block-level fields |
| Standard suffixes | `-title`, `-text`, `-image`, `-btn`, `-href`, `-name`, `-icon` | All blocks |

### Block IDs

Sequential per page: `b1`, `b2`, `b3`... The `data-block` value is the semantic type; `data-block-id` is the page-local counter.

### Content files

`content/{page-slug}.json` — one file per page, matching the page's `id` field.

---

## Data Contracts

### Stability guarantees

- **Page JSON structure:** Stable. No breaking changes planned.
- **Block structure:** Stable. No `variant`, `schema`, or `meta` properties.
- **Image format:** Nested `{ src, alt }` is the standard. Legacy flat format supported via `resolveImage()`.
- **Field `width` property:** Optional extension (`"half"` for compact layout, absent = full width). Backward-compatible.

### Field width (optional)

```json
{ "id": "stadt-1-name", "type": "text", "value": "München", "width": "half" }
```

Set during extraction from `data-field-width` HTML attribute. Admin.html falls back to regex heuristic if absent.
