# Helferportal Prototypes — Project Instructions

## What This Project Is

This project generates **visual HTML prototypes** and **Excel content tables** for the Helferportal website. The prototypes serve as clickable wireframes (~70-80% of final design fidelity) that show the client what each page will look like. The Excel tables document every content field on every page in a structured, editable format.

**These are NOT production files.** They are deliverables for client review and content gathering, which will later feed into a React-based Content Editor.

## Project Structure

The project structure is **deploy-ready** — the root of the repo IS the document root of `https://www.helferportal.kamanin.at/`. GitHub Pages auto-deploys on push to `main`.

```
helferportal-prototypes/          ← Git repo root = document root
├── CLAUDE.md                     ← project instructions (not served)
├── .gitignore
├── index.html                    ← Startseite
├── hilfe-finden.html
├── engagieren.html
├── fuer-kommunen.html
├── ueber-uns.html
├── kontakt.html
├── muenchen.html
├── assets/
│   ├── shared-styles.css         ← all CSS
│   ├── shared-scripts.js         ← all JS
│   ├── preview-bridge.js         ← live preview bridge (CMS iframe only)
│   └── images/                   ← local images (if any)
├── content/                      ← JSON content files (synced with Supabase)
│   ├── manifest.json             ← page registry for CMS offline mode
│   ├── startseite.json
│   ├── hilfe-finden.json
│   ├── engagieren.json
│   ├── fuer-kommunen.json
│   ├── ueber-uns.json
│   ├── kontakt.json
│   └── muenchen.json
├── tools/
│   ├── admin.html                ← CMS editor (browser-based)
│   ├── extract.js                ← HTML → JSON extractor
│   ├── build.js                  ← JSON → HTML builder
│   ├── deploy.js                 ← Supabase → JSON → HTML pipeline
│   ├── sync-to-supabase.js       ← JSON → Supabase (reverse sync, conflict-safe)
│   ├── validate.js               ← HTML/JSON integrity checker
│   ├── block-registry.json       ← canonical block type definitions
│   ├── lib/field-ops.js          ← shared field application logic
│   ├── package.json              ← Node deps (cheerio only)
│   └── .env                      ← Supabase credentials (gitignored)
├── docs/
│   ├── PROJECT_CONTEXT.md        ← canonical reference for developers/LLMs
│   ├── CMS-OVERVIEW.md           ← CMS architecture overview
│   └── DEVELOPMENT-PLAN.md       ← development roadmap
└── reference/                    ← source materials (not served)
    ├── feedback_rows.csv         ← client feedback items
    ├── pages_rows.csv            ← Supabase pages table dump
    └── intake/                   ← original content intake files
```

**Git workflow:** Push to GitHub → GitHub Pages auto-deploys → site is live.
**Deploy = push.** No build step, no copy step.

## Core Rules

### 1. Shared Styles & Scripts

All pages link to the SAME CSS and JS files via root-relative paths:

```html
<link rel="stylesheet" href="/assets/shared-styles.css" />
<script src="/assets/shared-scripts.js" defer></script>
```

**Never inline CSS or JS in page files** (except for page-specific `<title>` and meta). The Startseite (index.html) currently has everything inline — extract it.

### 2. Consistent Header & Footer

Every page has an identical `<header>` and `<footer>`. When updating navigation, update ALL pages.

Header navigation:

- Logo → index.html
- "Hilfe finden" → hilfe-finden.html
- "Engagieren" → engagieren.html
- ":: Mehr" → mega-menu with all pages
- "Anmelden" → kontakt.html

Footer columns:

- "Für Sie": Hilfe finden, Engagieren, Für die öffentliche Hand, Für Organisationen
- "Über uns": Das Konzept, So funktioniert's, Unsere Partner, Aktuelles
- "Kontakt": Kontakt aufnehmen, Demo vereinbaren, FAQ

### 3. Links Between Pages

**Hosting domain:** `https://www.helferportal.kamanin.at/`

All inter-page links use absolute paths from the root:

```html
<!-- Navigation and internal links -->
<a href="/hilfe-finden.html">Hilfe finden</a>
<a href="/engagieren.html">Engagieren</a>
<a href="/fuer-kommunen.html">Für die öffentliche Hand</a>
<a href="/ueber-uns.html">Über uns</a>
<a href="/kontakt.html">Anmelden</a>
<a href="/">Startseite</a>
<!-- Logo link -->
```

External app links (to the actual Helferportal platform):

```html
<a href="https://hilfe.helferportal.de">Jetzt Unterstützung finden</a>
<a href="https://helfen.helferportal.de">Jetzt registrieren</a>
```

**Important:** Use root-relative paths (`/hilfe-finden.html`), NOT relative (`hilfe-finden.html`) and NOT full domain URLs. This way the links work both locally (via live-server) and on the hosted domain without changes.

When deploying, the file structure maps directly:

```
/ → pages/index.html
/hilfe-finden.html → pages/hilfe-finden.html
/engagieren.html → pages/engagieren.html
/assets/shared-styles.css → assets/shared-styles.css
```

### 4. data-block and data-field Attributes

Every `<section>` that represents a content block MUST have:

```html
<section class="hero" data-block="hero-slider" data-block-id="b1"></section>
```

Key content elements SHOULD have:

```html
<h1 data-field="slide-1-heading" data-field-type="text">...</h1>
<p data-field="slide-1-subheading" data-field-type="textarea">...</p>
<img data-field="slide-1-image" data-field-type="image" src="..." />
```

These attributes enable future automated parsing by the Content Editor.

### 5. Block Numbering

Blocks are numbered sequentially per page: b1, b2, b3... The `data-block` value is the semantic type (e.g., `hero-slider`, `tabs-section`, `faq-section`). The `data-block-id` is the page-local sequential ID.

## Design System

### Brand Colors

```css
--orange-primary: #e65100; /* Helpers / Volunteers */
--blue-primary: #1565c0; /* Help seekers */
--purple-primary: #7b1fa2; /* B2B (Kommunen, Organisationen, Dienstleister) */
--green-primary: #2e7d32; /* Accent (cost-free, positive) */
```

### Color Logic (critical)

- **Orange** = Engagierte / Helfer
- **Blue** = Hilfesuchende / Pflegende Angehörige
- **Purple** = Kommunen, Organisationen, Gesundheitsdienstleister (B2B)
- **Green** = Positive accents (kostenfrei, Checkmarks, Sicherheit)

### Typography

- **Display font**: Plus Jakarta Sans (headings, labels, navigation)
- **Body font**: DM Sans (paragraphs, descriptions, form fields)

### Component Patterns

Reuse these across all pages:

| Component          | CSS Class                                  | Used On                                        |
| ------------------ | ------------------------------------------ | ---------------------------------------------- |
| Hero Slider        | `.hero`, `.hero-slider`, `.slide`          | Startseite                                     |
| Mini Hero          | `.hero-mini`                               | Subpages                                       |
| Tabs Section       | `.tabs-section`, `.tabs-nav`, `.tab-panel` | Startseite, Hilfe finden, Engagieren, Kommunen |
| Quick Actions      | `.quick-actions`, `.quick-action-card`     | Startseite                                     |
| Steps/How It Works | `.how-it-works`, `.step-card`              | Startseite, subpages                           |
| FAQ Accordion      | `.faq-section`, `.faq-item`                | All pages                                      |
| Testimonial        | `.testimonial-section`                     | Startseite                                     |
| Partners Logo Row  | `.partners-section`                        | Startseite, Über uns                           |
| Cities Grid        | `.staedte-section`, `.stadt-card`          | Startseite                                     |
| About Section      | `.about-section`                           | Startseite                                     |
| Cost-Free Info     | `.kostenfrei-section`                      | Startseite                                     |
| Advantages Grid    | `.vorteile-section`                        | Hilfe finden, Engagieren                       |
| Contact Form       | `.kontakt-form`                            | Kontakt                                        |

### Buttons

```html
<button class="btn-primary blue">Hilfe finden</button>
<button class="btn-primary orange">Jetzt engagieren</button>
<button class="btn-primary purple">Demo vereinbaren</button>
<button class="btn-secondary">Mehr erfahren</button>
```

## Excel Content Table Format

### Structure per page (one .xlsx file per page)

- **Row 1**: Header row (dark background, white text)
- **Rows 2-4**: Page meta (Seite, URL, Block-Typ)
- **Block headers**: `═══ BLOCK N: NAME ═══` — orange background, white text, bold
- **Sub-headers**: e.g., `Tab 1: Hilfesuchende (Blau)` — colored background matching the color logic, NOT merged across columns
- **Content rows**: one row per content field

### Columns (A-F)

| Column | Header                        | Purpose                                             |
| ------ | ----------------------------- | --------------------------------------------------- |
| A      | Content-Typ (Element / Rolle) | What this element is (Tag, Heading, Button, etc.)   |
| B      | Beschreibung / Ausprägung     | Description for the editor/developer                |
| C      | Titel (sichtbarer Content)    | Short visible text (headings, button labels, names) |
| D      | Text (sichtbarer Content)     | Long visible text (paragraphs, descriptions)        |
| E      | Dateiname / Bild              | Image filename or reference                         |
| F      | Kommentar / Verlinkung        | Links, icons, developer notes                       |

### Critical Rule: No Merged Cells for Editable Content

Tab names, option titles, and other editable content must be in individual cells, NOT merged rows. Sub-headers (like `Tab 1: Hilfesuchende`) are visual separators only — the actual editable tab name goes in a separate `Tab-Name` row.

### Column Widths

A=35, B=40, C=50, D=70, E=25, F=50

### Styling

- Header row: Font Calibri 11 bold white, Fill #2D3748
- Block headers: Font Calibri 12 bold white, Fill #E65100 (orange)
- Sub-headers (slides/tabs): Font Calibri 11 bold, Fill matches color logic (blue=#E3F2FD, orange=#FFF3E0, purple=#F3E5F5)
- Content rows: Font Calibri 10, descriptions in gray (#666666)
- Link references: Font color #1565C0 (blue)

## Page Inventory & Content Source

### Pages to generate:

| #   | Page                                       | URL            | Blocks | Status  |
| --- | ------------------------------------------ | -------------- | ------ | ------- |
| 1   | Startseite                                 | /              | 9      | ✅ Done |
| 2   | Hilfe finden                               | /hilfe-finden  | 5      | ✅ Done |
| 3   | Engagieren                                 | /engagieren    | 6      | ✅ Done |
| 4   | Für die öffentliche Hand & soziale Akteure  | /fuer-kommunen | 5      | ✅ Done |
| 5   | Über uns                                   | /ueber-uns     | 6      | ✅ Done |
| 6   | Anmelden / Kontakt                         | /kontakt       | 3      | ✅ Done |
| 7   | München (Stadtseite)                       | /muenchen      | 7      | ✅ Done |

### Subpage Pattern

All subpages (2-7) follow the same pattern:

1. **Mini Hero** (compact, no slider — just H1 + subheading + optional gradient)
2. **Content blocks** (tabs, cards, text sections — varies per page)
3. **FAQ** (page-specific questions)
4. Shared header + footer

## Workflow: Adding a New Page

1. Read the content from `reference/Helferportal_Content_Tabelle.xlsx` (the corresponding sheet)
2. Create the HTML file in the repo root (e.g., `hilfe-finden.html`) using shared styles/scripts
3. Add `data-block` and `data-field` attributes to all sections and key elements
4. Create the matching Excel file in `content/`
5. Update navigation links on ALL pages (header "Mehr" menu, footer)
6. Verify all inter-page links work
7. `git add -A && git commit -m "Add [page name]" && git push`

## Content Pipeline & Source of Truth

**Supabase is the single source of truth for content.** All content changes flow through the CMS (admin.html → Supabase). Structural HTML changes (nav, footer, new sections) are done locally and don't conflict.

### Content tools (run from `tools/` directory)

```bash
node deploy.js                           # Pull Supabase → JSON → HTML (all pages)
node deploy.js --page fuer-kommunen      # Pull one page
node deploy.js --local                   # Build from local JSON (no Supabase)

node extract.js ../page.html ../content/page.json   # HTML → JSON
node build.js ../content/page.json ../page.html      # JSON → HTML

node sync-to-supabase.js --page fuer-kommunen        # Push JSON → Supabase (with conflict check)
node sync-to-supabase.js --page fuer-kommunen --force # Push without conflict check

node validate.js startseite              # Check HTML/JSON consistency
```

### Workflow: Before starting local work

Always pull the latest content from Supabase first:
```bash
cd tools && node deploy.js
```

### Workflow: Updating content text

**Preferred**: Edit via CMS (admin.html) → Save → content is in Supabase.
Then pull: `node deploy.js` → push to GitHub.

**If editing locally** (e.g., applying client feedback):
1. `node deploy.js` — pull latest from Supabase
2. Edit HTML
3. `node extract.js ../page.html ../content/page.json` — regenerate JSON
4. `node sync-to-supabase.js --page {id}` — push to Supabase (checks for conflicts)
5. `git push` — deploy to GitHub Pages

### Workflow: Structural HTML changes (nav, footer, CSS)

These elements have no `data-field` attributes → they don't conflict with Supabase content.
1. Edit HTML directly
2. `git push` — deploy to GitHub Pages
No Supabase sync needed.

## Image Strategy

Use Unsplash placeholder images with descriptive URLs:

```html
<!-- Good: descriptive, appropriate size -->
<img
  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400"
  alt="Alia Tagba"
/>

<!-- For hero backgrounds: use w=1400 -->
background:
url("https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1400")
center/cover;
```

Image motifs should match the social/care context of Helferportal.

## Language Rules

- **All visible content**: German (formal "Sie" for B2B/help seekers, informal "du" for Engagierte pages)
- **Code comments**: English
- **File names**: German-friendly but URL-safe (hilfe-finden.html, not hilfe_finden.html)
- **CSS classes**: English (`.hero-slider`, `.tab-panel`, `.faq-section`)

## Deployment

**Production URL:** `https://www.helferportal.kamanin.at/`
**Hosting:** GitHub Pages (branch: `main`, root: `/`)
**Custom domain:** Configured via `CNAME` file (`www.helferportal.kamanin.at`)
**Document root:** The repo root IS the document root. No build step.

```bash
# Deploy = commit + push
git add -A
git commit -m "Add hilfe-finden page"
git push origin main
# → GitHub Pages auto-deploys within ~1 minute
```

**Local development:** `npx serve .` in the repo root, then open `http://localhost:3000`.

## Quality Checklist (for every page)

- [ ] Links to shared-styles.css and shared-scripts.js
- [ ] Header and footer match all other pages
- [ ] All inter-page links are root-relative and correct
- [ ] Every `<section>` has `data-block` and `data-block-id`
- [ ] Key text elements have `data-field` and `data-field-type` attributes
- [ ] Color logic matches audience (blue/orange/purple)
- [ ] Responsive behavior works (1024px, 768px breakpoints)
- [ ] Matching JSON file exists in content/
- [ ] `node validate.js {page}` passes with 0 errors

## Rules

- **Documentation auto-update**: When making changes that affect project structure, workflows, tool scripts, page inventory, or navigation — update CLAUDE.md and relevant docs/ files in the same commit. Do not defer documentation updates to a separate step.
- **Supabase = source of truth**: Never overwrite Supabase content without checking for conflicts first. Use `sync-to-supabase.js` (has built-in conflict detection). Always `node deploy.js` before starting local work.
- **deploy.js textarea caution**: `field-ops.js` textarea handler (`$el.text()`) destroys nested HTML structure (SVGs, child elements). If a page has structured HTML inside textarea-typed elements, apply text changes manually instead of running deploy.js on that page.
- At the end of every session, when asked to wrap up, update the Session Log section below following the standard format.
