# Helferportal CMS — Development Plan v2

## 1. Current State Summary

**What exists:**
- Annotation-based CMS: HTML `data-block`/`data-field` attributes → JSON → Supabase JSONB
- Web editor (`admin.html`): two-panel SPA, offline/online modes, image upload, compact grid layout
- CLI pipeline: `extract.js` (HTML→JSON), `build.js` (JSON→HTML), `deploy.js` (Supabase→JSON→HTML)
- One page fully annotated: Startseite (9 blocks, 94 fields, 6 field types)
- Supabase: `pages` table with anon RLS, `images` storage bucket

**What works well:**
- Round-trip integrity: extract → edit → build preserves HTML structure
- Dual mode (online/offline) with seamless fallback
- Smart compact grid for short fields, collapse/expand for blocks
- German labels, field type badges, image preview + upload

**What doesn't scale:**
- Field type logic duplicated in 4 files (extract, build, deploy, admin)
- No live preview — client edits blindly, must deploy to see changes
- Only 1 of 7 pages annotated
- No block type registry — block structure is implicit in HTML
- Image handling inconsistent (some `<img>`, some CSS `background-image`)

---

## 2. Design Principles

### What we build
- **Convention over configuration.** Block types are defined by naming conventions and a thin registry, not by a schema builder.
- **HTML remains source of truth.** The prototype HTML file defines what blocks and fields exist. JSON is a derived artifact.
- **Incremental evolution.** Every change must leave the existing pipeline functional. No big rewrites.
- **Preview is read-only.** The iframe renders the actual prototype HTML. The editor only sends field updates via postMessage. No DOM construction in JavaScript.

### What we explicitly will NOT build
- No drag-and-drop block reordering
- No dynamic block creation from the editor UI
- No nested/recursive block structures
- No field schema builder or admin panel for defining field types
- No multi-tenant auth or user roles (this is an internal tool)
- No visual design editing (colors, fonts, spacing)
- No component library or design system renderer
- No server-side rendering or SSR framework
- No React/Vue/Svelte rewrite

### Anti-complexity rules
1. If a feature requires more than 100 lines of new code, it needs a written justification.
2. If a new abstraction serves fewer than 3 use cases, inline the logic instead.
3. No config files for things that can be conventions.
4. Shared logic lives in one file, imported by others — never duplicated.

### Hard guardrails
- **Max 15 block types.** If you need a 16th, merge two existing ones or justify in writing.
- **Max 4 design variants per block.** If a block needs more, it's two different blocks.
- **New block type requires reuse in 2+ pages.** One-off layouts stay as custom HTML, not as a registered block type.
- **`html` field type: internal use only.** `el.innerHTML = value` is the one place where arbitrary markup enters the DOM. Use `html` fields only for pre-authored content (internal editors), never for client-editable free text. If a client needs rich text, use `textarea` and render markdown. No sanitizer needed today — this rule prevents the need for one.
- These caps are process rules, not technical limits. Enforce them in code review, not in code.

---

## 3. Proposed Data Contracts

### 3.1 Page JSON (no change)

Current structure is sufficient. No breaking changes needed.

```jsonc
{
  "_meta": {
    "generator": "helferportal-content-tools/extract.js",
    "source": "index.html",
    "extracted": "2026-02-26T...",
    "lastEdited": "2026-02-27T...",
    "editedBy": "anon"
  },
  "page": {
    "id": "startseite",
    "title": "Helferportal – Unterstützung finden, Engagement ermöglichen",
    "url": "/"
  },
  "blocks": [ /* Block[] */ ]
}
```

### 3.2 Block structure (no change)

```jsonc
{
  "id": "b1",              // sequential per page
  "type": "hero-slider",   // semantic block type
  "fields": [ /* Field[] */ ]
}
```

No `variant`, `schema`, or `meta` properties needed yet. Block types are implicit in HTML. If we later need a block registry, it can be derived from scanning all page JSONs — not stored as a separate schema.

### 3.3 Field structure (minor extension)

Current:
```jsonc
{ "id": "slide-0-title", "type": "text", "value": "..." }
{ "id": "slide-0-image", "type": "image", "value": "https://...", "alt": "..." }
{ "id": "slide-0-btn", "type": "button", "value": "Click", "href": "/page" }
```

**One new optional property — `width`:**
```jsonc
{ "id": "stadt-1-name", "type": "text", "value": "München", "width": "half" }
```

Values: `"half"` (compact grid) or absent (full width, default). This replaces the brittle regex heuristic in admin.html (`/title|subtitle|heading|overline|quote/`). The `width` hint is set during `extract.js` based on a `data-field-width` HTML attribute, or omitted.

**This is optional and backward-compatible.** Admin.html falls back to the current regex if `width` is absent.

### 3.4 Image references

No change to JSON structure. Images are stored as full URLs (Unsplash or Supabase Storage). The editor already handles both. No need for a separate asset registry.

Storage path convention (already implemented):
```
images/{pageId}/{fieldId}-{timestamp}.{ext}
```

---

## 4. Live Preview Architecture

### 4.1 Overview

```
┌─────────────────────────────────────────────────┐
│  admin.html                                     │
│  ┌──────────┐  ┌─────────────────────────────┐  │
│  │ Sidebar   │  │ Editor (current)            │  │
│  │           │  │                             │  │
│  │ Block nav │  │  ┌───────────────────────┐  │  │
│  │           │  │  │ Preview iframe        │  │  │
│  │           │  │  │ (prototype HTML)      │  │  │
│  │           │  │  │                       │  │  │
│  │           │  │  └───────────────────────┘  │  │
│  │           │  │  ┌───────────────────────┐  │  │
│  │           │  │  │ Field editor          │  │  │
│  │           │  │  │ (current form)        │  │  │
│  │           │  │  └───────────────────────┘  │  │
│  └──────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Layout change:** The main content area splits into two panels:
- **Top: Preview iframe** (resizable, default ~50% height)
- **Bottom: Field editor** (current form, scrollable)

Toggle button: "Editor only" / "Preview + Editor" / "Preview only" (three states).

### 4.2 How the iframe loads

```html
<iframe id="previewFrame" src="/index.html"></iframe>
```

- The iframe loads the actual prototype HTML file from the same origin (served by the dev server).
- The page URL comes from `contentData.page.url` — e.g., `/` for Startseite, `/hilfe-finden.html` for subpages.
- No `sandbox` attribute needed — same origin, no injection.

### 4.3 Bridge as a static file (not injection)

**`preview-bridge.js` is a regular script loaded by every prototype page**, not injected at runtime. This avoids CSP issues, `sandbox` restrictions, and `contentDocument` access problems.

**Preferred loading method:** dynamically appended by `shared-scripts.js` (single point of entry, zero risk of forgetting a page):

```javascript
// At the end of shared-scripts.js
const bridgeScript = document.createElement('script');
bridgeScript.src = '/assets/preview-bridge.js';
bridgeScript.defer = true;
document.head.appendChild(bridgeScript);
```

Do NOT add `<script>` tags to individual HTML files — that creates N maintenance points instead of 1.

**The bridge self-activates only when inside an iframe:**

```javascript
// preview-bridge.js — does nothing in production, activates only in CMS iframe
if (window === window.top) {
    // Not in iframe — exit silently. Zero overhead in production.
} else {
    window.addEventListener('message', (e) => {
        if (e.origin !== location.origin) return; // security: same-origin only
        handleCmsMessage(e);
    });
    // Notify parent that bridge is ready
    window.parent.postMessage({ type: 'hp-cms-ready' }, location.origin);
}
```

**Admin.html waits for the bridge to signal readiness, then sends init:**

```javascript
window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return; // security: same-origin only
    if (e.data.type === 'hp-cms-ready') {
        previewFrame.contentWindow.postMessage({
            type: 'hp-cms-init',
            content: contentData
        }, location.origin);
    }
});
```

**postMessage security:** Always use `location.origin` as targetOrigin (not `'*'`), and always check `e.origin` on receipt. This prevents cross-origin message spoofing if the tool is ever served from a different port or domain.

**Why this is better than injection:**
- No `contentDocument` access needed (works even with stricter security)
- Debuggable in browser DevTools as a real source file
- No race conditions with iframe load timing
- Zero overhead in production (`window === window.top` check is instant)
- Origin-checked messages prevent accidental cross-origin leaks

### 4.4 Message protocol

**Admin → Preview:**

```jsonc
// Full sync (on page load or page switch)
{ "type": "hp-cms-init", "content": { /* full page JSON */ } }

// Single field update (on each keystroke, debounced)
{ "type": "hp-cms-update", "fieldId": "slide-0-title", "prop": "value", "value": "New text" }

// Highlight field in preview (on field focus in editor)
{ "type": "hp-cms-highlight", "fieldId": "slide-0-title" }

// Remove highlight (on field blur)
{ "type": "hp-cms-unhighlight" }
```

**Preview → Admin (optional, future):**

```jsonc
// Click-to-edit: user clicks element in preview → editor scrolls to field
{ "type": "hp-cms-select", "fieldId": "slide-0-title" }
```

### 4.5 DOM update logic (inside preview-bridge.js)

```javascript
window.addEventListener('message', (e) => {
    if (e.data.type === 'hp-cms-update') {
        const el = document.querySelector(`[data-field="${e.data.fieldId}"]`);
        if (!el) return;
        const type = el.getAttribute('data-field-type');
        applyFieldValue(el, type, e.data.prop, e.data.value);
    }
});

function applyFieldValue(el, type, prop, value) {
    switch (type) {
        case 'text':
        case 'textarea':
            el.textContent = value;
            break;
        case 'image':
            if (prop === 'value') el.src = value;
            if (prop === 'alt') el.alt = value;
            break;
        case 'button':
        case 'link':
            if (prop === 'value') setTextOnly(el, value); // preserve SVG icons
            if (prop === 'href') el.href = value;
            break;
        case 'video':
            // composite — route by prop
            if (prop === 'value') el.querySelector('.video-card-label').textContent = value;
            if (prop === 'thumbnail') el.querySelector('.video-thumbnail').src = value;
            break;
        case 'html':
            el.innerHTML = value;
            break;
    }
}
```

**This is the same switch logic as build.js but for live DOM.** This is the one justified duplication — build.js operates on Cheerio (server), preview-bridge operates on real DOM (browser). The logic is identical but the API is different (`.text()` vs `.textContent`, `.attr()` vs `.src`).

### 4.6 Highlight overlay

When the user focuses a field in the editor, the preview highlights the corresponding element:

```javascript
function highlightField(fieldId) {
    const el = document.querySelector(`[data-field="${fieldId}"]`);
    if (!el) return;
    el.style.outline = '2px solid #E65100';
    el.style.outlineOffset = '2px';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

### 4.7 Preview mode: taming prototype JS

Prototype pages run their own JavaScript (slider autoplay, tab switching, scroll animations). In the preview iframe, these can fight with CMS field updates — e.g., a slider auto-advancing while the user edits slide 3.

**Strategy:** `preview-bridge.js` sets a global flag and a body class on activation:

```javascript
window.__CMS_PREVIEW__ = true;
document.body.classList.add('cms-preview');
```

**`shared-scripts.js` respects the flag:**

```javascript
// Disable autoplay in CMS preview
const isPreview = window.__CMS_PREVIEW__ || false;
const SLIDER_AUTOPLAY = isPreview ? 0 : 5000;  // 0 = disabled
```

**CSS can suppress animations:**

```css
.cms-preview * {
    animation-play-state: paused !important;
    transition-duration: 0s !important;
}
```

This is lightweight and non-invasive. No refactoring of existing prototype JS needed — just check one flag at the decision points (autoplay interval, scroll triggers, tab auto-switching).

### 4.8 Performance

- **Debounce field updates:** 150ms after last keystroke (not on every character).
- **No full re-render:** Each update targets one DOM element by `data-field` selector. No page reload.
- **Image updates:** Only update `src` when URL changes (not on every keystroke in the URL input — debounce 500ms).
- **Init sync:** Send full `hp-cms-init` only on page load/switch, not on individual edits.
- **Iframe doesn't reload:** Once loaded, stays alive. Only DOM mutations via postMessage.

### 4.9 Offline mode

Same behavior. The iframe loads the same HTML file from the local dev server. postMessage works identically — it's same-origin in both cases.

---

## 5. Supabase Strategy

### 5.1 Current `pages` table — sufficient

The table schema handles everything needed:

```sql
pages (id TEXT PK, title, url, content JSONB, updated_at, updated_by)
```

No schema changes needed for live preview (preview is a client-side feature).

### 5.2 Lightweight versioning (Phase 3, optional)

**Approach: snapshot table, not git-like history.**

```sql
CREATE TABLE page_versions (
    id SERIAL PRIMARY KEY,
    page_id TEXT REFERENCES pages(id),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    note TEXT  -- optional: "Before client review", "After meeting 2026-03-01"
);
```

- **On save**: if `?snapshot=true` param or explicit button click → insert into `page_versions`
- **NOT on every save.** Only on explicit "Create Snapshot" action.
- **Max 20 versions per page** (auto-prune oldest on insert via trigger or app logic).
- **Restore**: Load version content into editor, user saves to overwrite current.

This is Phase 3. Do not implement until Phase 1 (preview) and Phase 2 (standardization) are done.

### 5.3 Image storage — no change needed

Current structure works:
```
images/{pageId}/{fieldId}-{timestamp}.{ext}
```

Public bucket with anon upload is fine for an internal tool. No CDN or resize pipeline needed at this stage.

---

## 6. Phased Roadmap

> **Execution order:** Phase 1 first (Preview MVP on Startseite), then Phase 0 in parallel as pages are needed, then Phase 2, then Phase 3. Preview should not wait for all pages to be annotated.

### Phase 1 — Live Preview MVP (2–3 days) **← START HERE**

**Deliverables:**
- [ ] `assets/preview-bridge.js` — standalone file (< 80 lines), loaded by prototype pages, self-activating only inside iframe (`window !== window.top`)
- [ ] Preview iframe panel in admin.html (resizable split, toggle button)
- [ ] Field update → postMessage dispatch (debounced 150ms)
- [ ] Full init sync on iframe load and page switch
- [ ] Field focus → highlight in preview (outline + scroll-into-view)
- [ ] Click element in preview → scroll to field in editor (nice-to-have)

**Definition of Done:**
User can edit a text field in the editor and see the change reflected in the preview iframe within 200ms. Image URL changes show updated image. Button text/href changes work. Preview works in both online and offline mode. Works on Startseite; other pages supported as they are annotated.

**Risks:**
- Cross-origin issues if admin.html and prototype HTML are served from different ports → must use same dev server
- Some CSS transitions/animations in the prototype may interfere with highlight overlay
- Prototype JavaScript (e.g., slider autoplay) may conflict with field updates → preview-bridge must not reinitialize page scripts

---

### Phase 0 — Page Annotation (ongoing, in parallel)

**Scope:** Do NOT annotate all 6 pages upfront. Annotate pages on-demand, starting with the most client-relevant.

**Priority order:**
1. Startseite — already done
2. Hilfe finden + Kontakt — annotate next (highest client visibility)
3. Remaining pages — as needed, in parallel with other work

**Per-page checklist:**
- [ ] HTML file exists with `data-block`/`data-field` attributes
- [ ] `extract.js` produces clean JSON
- [ ] JSON added to `content/` + `manifest.json` updated
- [ ] `PAGE_MAP` entry added in `deploy.js`
- [ ] Round-trip verified: extract → build → zero diff
- [ ] Editable images use `<img>` tags, not CSS `background-image`

**Definition of Done (per page):**
Page JSON exists, round-trip clean, page loads in CMS editor + preview.

**Risks:**
- CSS `background-image` to `<img>` migration may break visual layout on some blocks
- Some subpages may not exist yet as HTML (need to create prototype first)

---

### Phase 2 — Block Standardization (2–3 days)

**Deliverables:**
- [ ] `tools/block-registry.json` — catalog of 10–15 block types with expected fields and width hints
- [ ] Shared field-update module (`tools/lib/field-ops.js`) used by both `build.js` and `deploy.js`
- [ ] `extract.js` validates output against block registry (soft warnings, not errors)
- [ ] `data-field-width="half"` support in extract.js + admin.html (falls back to regex if absent)
- [ ] BLOCK_LABELS/FIELD_LABELS in admin.html left untouched — migrate only when painful

**Block Registry format:**
```jsonc
{
  "hero-slider": {
    "label": "Hero Slider",
    "repeatable": "slide",     // field prefix pattern for repeated items
    "fields": {
      "{n}-image": { "type": "image", "label": "Bild", "width": "full" },
      "{n}-tag": { "type": "text", "label": "Tag", "width": "half" },
      "{n}-title": { "type": "text", "label": "Titel", "width": "full" },
      "{n}-text": { "type": "textarea", "label": "Text", "width": "full" },
      "{n}-btn": { "type": "button", "label": "Button", "width": "full" }
    }
  },
  "staedte-section": {
    "label": "Städte Sektion",
    "repeatable": "stadt",
    "fields": {
      "{n}": { "type": "link", "label": "Link", "width": "full" },
      "{n}-image": { "type": "image", "label": "Bild", "width": "full" },
      "{n}-name": { "type": "text", "label": "Name", "width": "half" },
      "{n}-status": { "type": "text", "label": "Status", "width": "half" }
    }
  }
}
```

This is a **descriptive** registry, not a prescriptive schema. It describes what already exists in the HTML, not what must exist. It's used for:
1. Validation warnings in extract.js (soft warnings, not hard errors)
2. `width` hints for field layout in admin.html
3. Documentation for future page authors

**Important: Do NOT replace BLOCK_LABELS/FIELD_LABELS in admin.html with registry lookups.** The existing label objects work fine and are trivial to maintain. Migrating UI labels to registry adds risk for zero user benefit. Migrate only when/if the label objects actually become painful to maintain (>30 block types).

**Definition of Done:**
build.js and deploy.js share field-update logic from one module. Block registry covers all current block types. extract.js logs soft warnings for unexpected fields. Admin.html reads `width` from field JSON (falls back to regex heuristic).

**Risks:**
- Registry may become stale if HTML changes without updating it → keep it loose (warnings, not errors)
- Shared module requires refactoring build.js/deploy.js → small risk of regressions in deploy pipeline
- `{n}` pattern matching adds complexity → keep implementation simple (string replace, not full regex engine)

---

### Phase 3 — Persistence Refinements (1–2 days)

**Deliverables:**
- [ ] "Create Snapshot" button in admin.html → saves to `page_versions` table
- [ ] "Version History" sidebar panel → list snapshots with dates, restore button
- [ ] `page_versions` table + RLS in `supabase-setup.sql`
- [ ] Auto-prune: max 20 versions per page
- [ ] Optional: show diff between current and selected version (text fields only)

**Definition of Done:**
User can create a named snapshot, view version list, and restore any previous version. Old versions auto-pruned beyond 20.

**Risks:**
- JSONB diff is non-trivial → keep it simple: show field-by-field comparison, not a unified diff
- Large content JSONs may bloat `page_versions` table → 20-version cap mitigates this
- Restore must not bypass unsaved-changes check → show confirmation dialog

---

## 7. Concrete Task List

### Phase 1 — Live Preview MVP (start here)

```
P1-01  Create assets/preview-bridge.js as static file with window !== window.top guard
P1-02  Load preview-bridge.js dynamically from shared-scripts.js (single entry point, not per-page tags)
P1-03  Implement postMessage listener: hp-cms-init, hp-cms-update, hp-cms-highlight, hp-cms-unhighlight
P1-04  Implement applyFieldValue() for all 6 field types (text, textarea, image, button, link, video)
P1-05  Add setTextOnly() helper in preview-bridge (preserve SVG icons in buttons)
P1-06  Add hp-cms-ready message from bridge → admin.html listens and sends init
P1-07  Design preview panel layout in admin.html: split editor area into iframe (top) + fields (bottom)
P1-08  Add CSS for resizable split panel (CSS resize or drag handle)
P1-09  Add toggle button: "Editor" / "Preview + Editor" / "Preview"
P1-10  Wire onFieldChange in admin.html → postMessage dispatch (debounced 150ms)
P1-11  Send hp-cms-init when bridge signals ready, and on page switch
P1-12  Add field highlight: focus field → outline element in preview + scroll into view
P1-13  Add field unhighlight: blur field → remove outline
P1-14  Test with Startseite: edit text field → verify live update in preview
P1-15  Test with Startseite: edit image URL → verify image update in preview
P1-16  Test with Startseite: edit button text/href → verify in preview
P1-17  Test offline mode: same preview behavior without Supabase
P1-18  Handle iframe load errors gracefully (page not found → show message in iframe area)
P1-19  Optional: click element in preview → postMessage hp-cms-select → scroll to field in editor
```

### Phase 0 — Page Annotation (parallel, on-demand)

```
P0-01  Annotate hilfe-finden.html with data-block/data-field + extract JSON
P0-02  Annotate kontakt.html with data-block/data-field + extract JSON
P0-03  Update manifest.json + deploy.js PAGE_MAP for hilfe-finden + kontakt
P0-04  Verify round-trip for new pages: extract → build → zero diff
P0-05  Fix editable images: replace CSS background-image with <img> where needed
       --- remaining pages: do when client needs them ---
P0-06  Annotate engagieren.html + extract JSON
P0-07  Annotate fuer-kommunen.html + extract JSON
P0-08  Annotate ueber-uns.html + extract JSON
P0-09  Annotate stadt-template.html + extract JSON
P0-10  Update manifest.json + deploy.js PAGE_MAP for all remaining pages
```

### Phase 2 — Block Standardization

```
P2-01  Create tools/block-registry.json with all current block types (from all page JSONs)
P2-02  Extract shared field-update logic from build.js into tools/lib/field-ops.js
P2-03  Refactor build.js to import from lib/field-ops.js
P2-04  Refactor deploy.js to import from lib/field-ops.js
P2-05  Verify build.js + deploy.js produce identical output after refactor
P2-06  Add data-field-width="half" attribute support in extract.js
P2-07  Update admin.html: read width from field JSON, fall back to regex heuristic if absent
P2-08  Add extract.js validation: soft warnings for fields not matching registry
P2-09  Document block-registry.json format in CMS-OVERVIEW.md
       Note: Do NOT migrate BLOCK_LABELS/FIELD_LABELS to registry yet — leave them as-is
```

### Phase 3 — Persistence Refinements

```
P3-01  Add page_versions table to supabase-setup.sql
P3-02  Add RLS policies for page_versions (anon read/write)
P3-03  Add "Create Snapshot" button in admin.html toolbar
P3-04  Implement saveSnapshot() → insert into page_versions
P3-05  Add version history sidebar panel (collapsible)
P3-06  Implement loadVersionList() → query page_versions for current page
P3-07  Implement restoreVersion() → load content into editor (with confirmation)
P3-08  Add auto-prune trigger: DELETE oldest when count > 20 per page
P3-09  Optional: simple field diff view between current and selected version
P3-10  Test full cycle: edit → snapshot → edit more → restore → verify content
```
