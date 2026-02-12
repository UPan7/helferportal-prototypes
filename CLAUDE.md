# Helferportal Prototypes — Project Instructions

## What This Project Is

This project generates **visual HTML prototypes** and **Excel content tables** for the Helferportal website. The prototypes serve as clickable wireframes (~70-80% of final design fidelity) that show the client what each page will look like. The Excel tables document every content field on every page in a structured, editable format.

**These are NOT production files.** They are deliverables for client review and content gathering, which will later feed into a React-based Content Editor.

## Project Structure

The project structure is **deploy-ready** — the root of the repo IS the document root of `https://helferportal.kamanin.at/`. Plesk Git auto-deploys on push.

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
├── stadt-template.html
├── assets/
│   ├── shared-styles.css         ← all CSS
│   ├── shared-scripts.js         ← all JS
│   └── images/                   ← local images (if any)
├── content/                      ← Excel tables (not served, for reference)
│   ├── 1_Startseite.xlsx
│   ├── 2_Hilfe_finden.xlsx
│   └── ...
└── reference/                    ← source materials (not served)
    ├── Helferportal_Content_Tabelle.xlsx
    └── brand-guidelines.md
```

**Git workflow:** Push to GitHub → Plesk auto-pulls → site is live.
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
- "Für Sie": Hilfe finden, Engagieren, Für Kommunen, Für Organisationen
- "Über uns": Das Konzept, So funktioniert's, Unsere Partner, Aktuelles
- "Kontakt": Kontakt aufnehmen, Demo vereinbaren, FAQ

### 3. Links Between Pages

**Hosting domain:** `https://helferportal.kamanin.at/`

All inter-page links use absolute paths from the root:
```html
<!-- Navigation and internal links -->
<a href="/hilfe-finden.html">Hilfe finden</a>
<a href="/engagieren.html">Engagieren</a>
<a href="/fuer-kommunen.html">Für Kommunen</a>
<a href="/ueber-uns.html">Über uns</a>
<a href="/kontakt.html">Anmelden</a>
<a href="/">Startseite</a>  <!-- Logo link -->
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
<section class="hero" data-block="hero-slider" data-block-id="b1">
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
--orange-primary: #E65100;   /* Helpers / Volunteers */
--blue-primary: #1565C0;     /* Help seekers */
--purple-primary: #7B1FA2;   /* B2B (Kommunen, Organisationen, Dienstleister) */
--green-primary: #2E7D32;    /* Accent (cost-free, positive) */
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

| Component | CSS Class | Used On |
|-----------|-----------|---------|
| Hero Slider | `.hero`, `.hero-slider`, `.slide` | Startseite |
| Mini Hero | `.hero-mini` | Subpages |
| Tabs Section | `.tabs-section`, `.tabs-nav`, `.tab-panel` | Startseite, Hilfe finden, Engagieren, Kommunen |
| Quick Actions | `.quick-actions`, `.quick-action-card` | Startseite |
| Steps/How It Works | `.how-it-works`, `.step-card` | Startseite, subpages |
| FAQ Accordion | `.faq-section`, `.faq-item` | All pages |
| Testimonial | `.testimonial-section` | Startseite |
| Partners Logo Row | `.partners-section` | Startseite, Über uns |
| Cities Grid | `.staedte-section`, `.stadt-card` | Startseite |
| About Section | `.about-section` | Startseite |
| Cost-Free Info | `.kostenfrei-section` | Startseite |
| Advantages Grid | `.vorteile-section` | Hilfe finden, Engagieren |
| Contact Form | `.kontakt-form` | Kontakt |

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
| Column | Header | Purpose |
|--------|--------|---------|
| A | Content-Typ (Element / Rolle) | What this element is (Tag, Heading, Button, etc.) |
| B | Beschreibung / Ausprägung | Description for the editor/developer |
| C | Titel (sichtbarer Content) | Short visible text (headings, button labels, names) |
| D | Text (sichtbarer Content) | Long visible text (paragraphs, descriptions) |
| E | Dateiname / Bild | Image filename or reference |
| F | Kommentar / Verlinkung | Links, icons, developer notes |

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

| # | Page | URL | Content Source | Status |
|---|------|-----|---------------|--------|
| 1 | Startseite | / | Sheet: 1_Startseite (10 blocks) | ✅ Done |
| 2 | Hilfe finden | /hilfe-finden | Sheet: 2_Hilfe_finden (4 blocks) | Pending |
| 3 | Engagieren | /engagieren | Sheet: 3_Engagieren (4 blocks) | Pending |
| 4 | Für Kommunen & soziale Akteure | /fuer-kommunen | Sheet: 4_Kommunen_Akteure (5 blocks) | Pending |
| 5 | Über uns | /ueber-uns | Sheet: 5_Ueber_uns (4 blocks) | Pending |
| 6 | Anmelden / Kontakt | /kontakt | Sheet: 6_Anmelden_Kontakt (3 blocks) | Pending |
| 7 | Stadtseite (Template) | /stadt/[name] | Sheet: 7_Stadtseite_Template | Pending |

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

## Workflow: Updating Content

When the client provides updated text:
1. Update the Excel file in `content/`
2. Update the corresponding HTML in `pages/`
3. Ensure consistency between Excel and HTML

## Image Strategy

Use Unsplash placeholder images with descriptive URLs:
```html
<!-- Good: descriptive, appropriate size -->
<img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="Alia Tagba" />

<!-- For hero backgrounds: use w=1400 -->
background: url("https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1400") center/cover;
```
Image motifs should match the social/care context of Helferportal.

## Language Rules
- **All visible content**: German (formal "Sie" for B2B/help seekers, informal "du" for Engagierte pages)
- **Code comments**: English
- **File names**: German-friendly but URL-safe (hilfe-finden.html, not hilfe_finden.html)
- **CSS classes**: English (`.hero-slider`, `.tab-panel`, `.faq-section`)

## Deployment

**Production URL:** `https://helferportal.kamanin.at/`
**Hosting:** Plesk with Git auto-deploy (push to GitHub → Plesk pulls automatically)
**Document root:** The repo root IS the document root. No build step.

```bash
# Deploy = commit + push
git add -A
git commit -m "Add hilfe-finden page"
git push origin main
# → Plesk auto-deploys within seconds
```

**Local development:** `npx serve .` in the repo root, then open `http://localhost:3000`.

## Quality Checklist (for every page)

- [ ] Links to shared-styles.css and shared-scripts.js
- [ ] Header and footer match all other pages
- [ ] All inter-page links are relative and correct
- [ ] Every `<section>` has `data-block` and `data-block-id`
- [ ] Key text elements have `data-field` attributes
- [ ] Color logic matches audience (blue/orange/purple)
- [ ] Responsive behavior works (1024px, 768px breakpoints)
- [ ] Matching Excel file exists in content/
- [ ] Excel has no merged cells in editable content rows
- [ ] Block numbering in Excel matches HTML
