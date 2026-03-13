# Changelog

> Phase-by-phase project history. What was built, when, and why.

---

## 2026-03-13 — Content Updates

- Content update for München page
- Restored Publish button in CMS, fixed partner logo centering

## 2026-03-12 — Client Feedback Round 2

- Applied client feedback: München + Für Kommunen content updates
- Updated text, images, and links based on client review

## 2026-03-08 — Phase 2: Architecture Refactor

Major consolidation and quality pass across the entire project.

### Shared libraries (lib/)
- Created `lib/config.js` — eliminated .env + PAGE_IDS duplication between deploy.js and sync-to-supabase.js
- Created `lib/registry.js` — consolidated alias resolution (3 copies → 1 `resolveBlockDef()`)
- Created `lib/field-ops.js` — shared field application logic (applyField, applyStructuredText, setTextOnly, resolveImage)

### Testing infrastructure
- Added `test-roundtrip.js` — extract → build → validate round-trip test, all 7 pages pass
- Added pre-commit hook: validates all pages when HTML/JSON files are staged

### CMS editor cleanup
- Removed dead Publish code (~80 lines)
- Extracted `afterPageLoad()` helper (3 copies → 1)

### CSS/JS fixes
- Fixed `--purple-light` (was set to blue-dark value → corrected to `#CE93D8`)
- Consolidated `.btn-white` (4 duplicates → 1 global component with `.orange`/`.blue`/`.purple` modifiers)
- Unified FAQ to single `.active` class (was dual `.open` + `.active`)
- Removed dead HEADER BUTTONS code from shared-scripts.js
- Extracted shared `initTabGroup()` helper (removed 3 duplicate tab init loops)
- Added `loading="lazy"` to 80+ images across all 7 pages

### Content fixes
- Fixed tag duplication in engagieren tabs
- Removed quick-contact cards, standardized FAQ structure
- Added feedback chat panel
- Fixed remaining tag duplication in tab-organisation-benefits

## 2026-03-08 — Client Feedback Round 1

- Applied client feedback: testimonials, cities, partners, Schulungen links
- Synced client Supabase edits
- Renamed "Für Kommunen" → "Für die öffentliche Hand und soziale Akteure" across all 7 pages
- Fixed broken tabs layout: restored card HTML
- Systemic fix: preserved HTML structure in textarea fields
- Restored client-uploaded images (partner logo and founder photo)
- Redesigned testimonial cards for 3-column layout
- Fixed partner text field grouping in CMS editor

## 2026-03-02 — Phase 1: Live Preview & Page Annotations

### Live preview
- Created `preview-bridge.js` — postMessage bridge, self-activating in iframe
- Added preview iframe panel to admin.html
- Field updates via debounced postMessage
- Field highlight (outline + scroll-into-view) on focus

### Page annotations (Phase 0 completed)
- All 7 pages annotated with `data-block` / `data-field` attributes
- JSON content files generated for all pages
- Block registry created and frozen at v1.1 (15 types, 24 aliases)
- `validate.js` enhanced: block-scoped duplicate check, structural guards

### CMS improvements
- Added hero-image field to all subpage hero blocks
- Disabled (then removed) Publish feature
- Added team photo to Über uns page
- Fixed startseite tabs header styling

## 2026-03-01 — CMS Editor Enhancement

- JSON schema audit + advanced fields UX + content normalization
- `resolveFieldEntity()` for smart field grouping by entity
- Content normalization: merge missing fields from reference JSON

## 2026-02-28 — CMS: Client-Ready Release

- Auth flow: Config → Login → App
- Live preview integration
- Draft autosave to localStorage
- UI polish: toasts, unsaved indicator, Ctrl+S, warn-on-leave

## 2026-02-27 — CMS: Editor UX

- Collapse blocks by default, compact grid for short fields
- German labels (`BLOCK_LABELS` / `FIELD_LABELS`)
- Image fields with drag-drop upload
- Auto-load from `content/manifest.json` (offline mode)

## 2026-02-26 — Project Start

- Initial Startseite prototype
- CLI tools: extract.js, build.js, deploy.js
- Supabase integration (pages table, RLS, image storage)
- admin.html: two-panel SPA editor
- Project documentation: CLAUDE.md, CMS-OVERVIEW.md
