# Changelog

> Phase-by-phase project history. What was built, when, and why.

---

## 2026-03-29 — CMS Editor Cleanup + München Removed

### Content editor sync (Round 3)
- Re-extracted all 9 pages from current HTML structure; synced to Supabase with `--force`
- `presse.html` and `projekte.html` registered in `tools/lib/config.js`, `content/manifest.json`, block-registry.json
- `sync-to-supabase.js` fixed: now does POST (INSERT) for new pages instead of silently failing with PATCH

### Block registry audit (v1.2)
- `info-tabs` extracted as standalone block type (was alias of `tabs` → scaffolded 18 empty `tab-{key}-*` stubs)
- `quick-actions` registered as standalone block type
- Removed 8 unused field patterns that scaffolded empty stubs in admin.html:
  `tabs-title`, `card-{N}-icon`, `card-{N}-href`, `_quick_actions_variant` (cards), `video-overline`, `video-{key}-file`, `section-image`, `section-btn`, `cta-image`, `logo-{N}-link`
- Removed `tab-{key}-vorteile` and `step-{N}-icon` (previous session)
- `projekte` block: `section-overline/title` moved to `_section_header_variant` group to prevent scaffolding on startseite's projekte-section

### München page removed
- Deleted `muenchen.html`, `content/muenchen.json`
- Removed from Supabase (`page_versions` + `pages` tables), `config.js`, `manifest.json`
- Pre-commit hook updated: muenchen → presse + projekte

---

## 2026-03-25 — Client Feedback Round (HTML-only, no Supabase sync)

Applied 9 client feedback items to HTML prototypes. Changes deployed to GitHub Pages for client review. Supabase/CMS intentionally left on previous version as fallback. Restore point: commit `00658db`.

### Navigation restructured (A1)
- Removed mega menu (HTML, CSS ~300 lines, JS) from all pages
- Replaced with classic horizontal navbar: Hilfe finden | Engagieren | Für Kommunen | Über uns + "App herunterladen" CTA
- Mobile hamburger menu updated, München/Städte references removed

### Color change: Kommunen purple → green (A2)
- `.page-fuer-kommunen` accent switched to `--green-primary`
- Added `.green` utility classes (tabs, buttons, icons, cards)
- Updated all purple HTML classes on index.html + fuer-kommunen.html
- Mobile tab picker updated for green

### Hero slider: 4 → 2 slides (B1)
- Removed intro slide and Kommunen slide
- Kept: Hilfesuchende (blue) + Engagierte (orange)
- Replaced progress bar animation with dot indicators
- 6-second autoplay retained

### Städte → Projekte section (B2)
- Removed 7-city grid from Startseite
- Replaced with "Forschung & Projekte" section (3 project cards)

### Video placeholders enhanced (B3)
- YouTube-style red/white play button (SVG)
- Dark frame overlay, duration badges, 16:9 aspect ratio

### App Download CTAs (C1)
- Added app-download strip below header on all 9 pages (closable, sessionStorage)
- App Store + Google Play badge placeholders (inline SVG)
- Updated slider CTAs, tab CTAs, subpage CTA sections
- fuer-kommunen: kept B2B CTAs (not app download)

### New pages (D1, D2)
- `presse.html`: hero-mini + 4 press release cards + media contact section
- `projekte.html`: hero-mini + 3 project detail cards + partners + CTA

### Font: Plus Jakarta Sans → Open Sans (E0)
- Updated Google Fonts import in all HTML pages
- Updated CSS font-family variable

### Wording consistency (E1)
- "Begleitung finden" → "Hilfe finden" on hilfe-finden.html
- Standardized CTA button labels

### Footer updates
- Added Presse + Projekte links to footer on all 9 pages

### Agent team infrastructure
- Created `tasks/dashboard.md` + `tasks/dashboard.json` for agent team tracking
- Full agent workflow: designer → reviewer-architect → implementation-agent → qa-agent

---

## 2026-03-13 — Content Safety & Publish Restoration

### Content backup system (3-layer protection)
- **Supabase `page_versions`**: auto-snapshot trigger saves OLD content on every `pages` UPDATE (`supabase/migrations/002_page_versions.sql`)
- **Local file backups**: `deploy.js` copies existing JSON to `content/backups/` before overwriting (10 per page, auto-cleanup)
- **Git history**: all JSON changes committed as before

### JSON normalization
- Added recursive `sortKeys()` to `deploy.js`, `extract.js`, and `sync-to-supabase.js` for stable JSON key ordering
- Eliminates noisy diffs caused by Supabase returning keys in different order

### CMS Publish restored
- Re-enabled "Veröffentlichen" button in admin.html (calls Supabase Edge Function → GitHub Actions)
- Restored `publishToLive()` function (Edge Function proxy pattern — PAT stays server-side)
- Re-enabled `workflow_dispatch` trigger in `.github/workflows/deploy-content.yml`
- Added workflow log annotations (`::notice::`) for better visibility

### sync-to-supabase.js improvements
- Added `--dry-run` flag: preview what would change without writing
- Improved `--force` UX: shows explicit WARNING with remote editor's name before overwriting

### Content updates
- Applied client feedback: München + Für Kommunen content changes
- Fixed partner logo centering on Über uns page (`.partner-logo` margin fix)
- Synced all 7 JSON files from Supabase with sorted keys

### Documentation restructuring
- Split monolithic docs into modular files: PRODUCT-VISION, ARCHITECTURE, SPEC, DATA-MODEL, CONTENT-PIPELINE, CONSTRAINTS, DECISIONS, EXECUTION
- Updated CLAUDE.md project structure tree with new directories

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
