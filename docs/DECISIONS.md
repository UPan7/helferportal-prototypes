# Architecture Decision Records

> Why specific technical choices were made. Prevents re-litigating settled decisions.

---

## ADR-001: HTML as Structural Source of Truth

**Date:** 2026-02-26 | **Status:** Accepted

**Context:** The project needs a way to define what blocks and fields exist on each page. Options: (a) derive structure from a schema file, (b) derive from HTML annotations.

**Decision:** HTML pages define blocks and fields via `data-block` and `data-field` attributes. JSON is a derived artifact extracted from HTML.

**Consequences:**
- Adding a new block = editing HTML, not a config file
- Round-trip (HTML → JSON → HTML) must preserve DOM structure
- Registry is descriptive (documents what exists), not prescriptive (doesn't generate HTML)

---

## ADR-002: Convention Over Configuration

**Date:** 2026-02-26 | **Status:** Accepted

**Context:** Block types and field patterns could be defined in a complex schema builder, or through naming conventions and a thin registry.

**Decision:** Naming conventions (`{prefix}-{N}-{property}`) plus a lightweight JSON registry. No schema builder, no admin panel for defining field types.

**Consequences:**
- Low overhead for adding fields (just follow the pattern)
- Requires discipline — wrong names silently fail instead of throwing schema errors
- Registry validates with soft warnings, not hard errors

---

## ADR-003: Preview Bridge as Static File

**Date:** 2026-03-01 | **Status:** Accepted

**Context:** The CMS editor needs a live preview of prototype pages. Options: (a) inject JavaScript into iframe at runtime, (b) load a static bridge script on every page.

**Decision:** `preview-bridge.js` is a regular script loaded by `shared-scripts.js`. It self-activates only inside iframes (`window !== window.top`). Zero overhead in production.

**Consequences:**
- No CSP issues or `contentDocument` access problems
- Debuggable in DevTools as a real source file
- No race conditions with iframe load timing
- Must use `postMessage` with `location.origin` for security (same-origin only)

---

## ADR-004: No Framework Rewrite

**Date:** 2026-02-26 | **Status:** Accepted

**Context:** Prototypes could be rebuilt in React/Vue/Svelte for better component reuse.

**Decision:** Keep static HTML + CSS + vanilla JS. No framework rewrite.

**Consequences:**
- Prototypes remain accessible to non-technical reviewers (just open in browser)
- No build step — deploy = push to GitHub
- Header/footer duplication across 7 files (accepted trade-off)
- Design tokens live in CSS variables, not a JS theme object

---

## ADR-005: Supabase JSONB Content Column

**Date:** 2026-02-27 | **Status:** Accepted

**Context:** Page content could be stored as: (a) individual rows per field in a relational table, (b) a single JSONB column containing the full block/field structure.

**Decision:** Single `content JSONB` column in the `pages` table. Full block/field structure stored as one document per page.

**Consequences:**
- Simple to read/write — one fetch per page, one upsert per save
- No need for field-level relational queries (the editor always loads the full page)
- Conflict detection via `_meta.lastEdited` timestamp comparison
- Trade-off: no field-level SQL queries (acceptable for this use case)

---

## ADR-006: Single CSS File with Page-Scoped Selectors

**Date:** 2026-02-26 | **Status:** Accepted

**Context:** CSS could be split per-page or kept in one file.

**Decision:** One `shared-styles.css` file. Shared components are unscoped; page-specific styles are scoped under `.page-{slug}`.

**Consequences:**
- Single HTTP request for all CSS
- Shared components (buttons, FAQ, tabs) work on every page
- Page-specific overrides don't leak to other pages
- File is large (~5900 lines) but well-organized
- Each page's `<body class="page-{slug}">` sets `--accent` and `--accent-light` for context-aware coloring

---

## ADR-007: Cheerio for Server-Side DOM

**Date:** 2026-02-26 | **Status:** Accepted

**Context:** CLI tools need to parse and modify HTML. Options: (a) JSDOM (full browser simulation), (b) Cheerio (jQuery-like DOM manipulation).

**Decision:** Cheerio. Lightweight, fast, sufficient for attribute reading and text/value setting.

**Consequences:**
- Minimal dependency footprint (only npm package)
- Serialization artifacts: Cheerio reformats HTML (boolean attributes, entity encoding)
- Must use `git checkout` to restore originals after testing round-trips
- No JavaScript execution — only static DOM manipulation

---

## ADR-008: FAQ Uses Single .active Class

**Date:** 2026-03-08 | **Status:** Accepted

**Context:** FAQ accordion originally used dual classes (`.open` + `.active`), causing inconsistent state.

**Decision:** Unified to single `.active` class. CSS uses `display: none/block` (not `max-height` transitions).

**Consequences:**
- Simpler toggle logic in JavaScript
- Consistent state — one class to check
- Trade-off: no animated open/close (acceptable for prototypes)

---

## ADR-009: Textarea Structured Text Uses Pipe-Delimited Format

**Date:** 2026-03-08 | **Status:** Accepted

**Context:** Some textarea fields contain structured HTML (card h3+p pairs, list items with SVGs, stat-cards). The CMS editor needs a text representation that round-trips cleanly.

**Decision:** `extractStructuredText()` converts HTML → pipe-delimited text (`Title | Description` per line). `applyStructuredText()` reverses it: updates text in-place, preserves HTML structure. Clones/removes children when line count changes.

**Consequences:**
- CMS editor can display structured content as editable text
- HTML structure (SVGs, nested elements) is preserved during round-trip
- `data-field` must stay on containers — never remove fields from structured elements

---

## ADR-010: Block Registry Frozen at v1.1

**Date:** 2026-03-01 | **Status:** Accepted

**Context:** The block registry could evolve continuously or be frozen at a known-good state.

**Decision:** Freeze at v1.1 with 15 block types and 24 aliases. Changes require explicit justification and follow the caps in [CONSTRAINTS.md](./CONSTRAINTS.md).

**Consequences:**
- Stability — tools can rely on a fixed set of patterns
- New block types require explicit process (2+ page reuse, written justification)
- Aliases can still be added without breaking the freeze

---

## ADR-011: BLOCK_LABELS Stay in admin.html

**Date:** 2026-03-08 | **Status:** Accepted

**Context:** `BLOCK_LABELS` and `FIELD_LABELS` in `admin.html` could be migrated to the block registry for single-source-of-truth consistency.

**Decision:** Keep label objects in `admin.html`. They work fine and are trivial to maintain. Migrate only when/if maintaining >30 block types becomes painful.

**Consequences:**
- UI labels are decoupled from registry (slightly inconsistent)
- Zero risk of breaking the editor with a registry migration
- Labels can use German umlauts freely without JSON encoding concerns
