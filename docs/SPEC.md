# Design Specification

> Design tokens, UI components, CSS architecture, responsive breakpoints, and content table format.

---

## Brand Colors

### Color Logic (audience mapping)

| Color | Audience | Usage |
|-------|----------|-------|
| **Orange** `#E65100` | Engagierte / Helfer (volunteers) | Engagieren page, volunteer CTAs, helper profiles |
| **Blue** `#1565C0` | Hilfesuchende / Pflegende Angehörige (help seekers) | Hilfe finden page, help-seeker CTAs, default accent |
| **Purple** `#7B1FA2` | Kommunen, Organisationen, Gesundheitsdienstleister (B2B) | Für Kommunen page, B2B CTAs, demo bookings |
| **Green** `#2E7D32` | Positive accents | Kostenfrei badges, checkmarks, security indicators |

### Full Token Inventory

From `:root` in `shared-styles.css` (lines 10–82):

**Brand colors (16):**
```css
--orange-primary: #E65100;    --orange-light: #FF8A65;
--orange-lighter: #FFF3E0;    --orange-dark: #BF360C;

--blue-primary: #1565C0;      --blue-light: #42A5F5;
--blue-lighter: #E3F2FD;      --blue-dark: #0D47A1;

--purple-primary: #7B1FA2;    --purple-light: #CE93D8;
--purple-lighter: #F3E5F5;    --purple-dark: #4A148C;

--green-primary: #2E7D32;     --green-light: #66BB6A;
--green-lighter: #E8F5E9;     --green-dark: #1B5E20;
```

**Additional colors (5):**
```css
--yellow-primary: #F9A825;    --yellow-light: #FDD835;
--yellow-lighter: #FFFDE7;
--white: #FFFFFF;             --black: #1A1A1A;
```

**Neutrals (11):**
```css
--gray-50: #FAFAFA;   --gray-100: #F5F5F5;  --gray-200: #EEEEEE;
--gray-300: #E0E0E0;  --gray-400: #BDBDBD;  --gray-500: #9E9E9E;
--gray-600: #757575;  --gray-700: #616161;  --gray-800: #424242;
--gray-900: #212121;
```

**Shadows (5):**
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25);
```

**Radii (5):**
```css
--radius-sm: 6px;    --radius-md: 8px;    --radius-lg: 12px;
--radius-xl: 16px;   --radius-full: 9999px;
```

**Spacing (7):**
```css
--space-xs: 4px;    --space-sm: 8px;    --space-md: 16px;
--space-lg: 24px;   --space-xl: 32px;   --space-2xl: 48px;
--space-3xl: 64px;
```

**Fonts (2):**
```css
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body: 'DM Sans', sans-serif;
```

**Transitions (3):**
```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms ease;
```

---

## Typography

| Role | Font Family | Usage |
|------|-------------|-------|
| Display | Plus Jakarta Sans | Headings, labels, navigation, buttons |
| Body | DM Sans | Paragraphs, descriptions, form fields |

Both fonts loaded via Google Fonts in each HTML page's `<head>`.

---

## Component Catalog

### Hero

| Variant | CSS Classes | Pages |
|---------|-------------|-------|
| Slider | `.hero`, `.hero-slider`, `.slide` | Startseite |
| Mini | `.hero-mini` | All subpages |
| City | `.hero-city` | München |

### Tabs Section

`.tabs-section`, `.tabs-nav`, `.tab-panel`, `.tab-option`

Used on: Startseite, Hilfe finden, Engagieren, Für Kommunen

### Cards

| Variant | CSS Classes | Pages |
|---------|-------------|-------|
| Quick Actions | `.quick-actions`, `.quick-action-card` | Startseite |
| Feature Cards | `.feature-card` | Various |
| Schulungen | `.schulungen-section` | Engagieren |

### Vorteile (Advantages)

`.vorteile-section`, `.vorteil-card`

Used on: Hilfe finden, Engagieren

### Steps / How It Works

`.how-it-works`, `.step-card`

Used on: Startseite, subpages

### FAQ Accordion

`.faq-section`, `.faq-item`

Used on: All 7 pages. Uses single `.active` class + `display: none/block`.

### Testimonial

`.testimonial-section`

Used on: Startseite

### Partners / Logos

`.partners-section`

Used on: Startseite, Über uns

### Cities Grid

`.staedte-section`, `.stadt-card`

Used on: Startseite

### Text Sections

`.about-section`, `.kostenfrei-section`, `.mission-section`, `.timeline-section`, `.team-section`

### Contact Form

`.kontakt-form`

Used on: Kontakt

### CTA Banner

`.cta-section`

### Buttons

```html
<button class="btn-primary blue">Hilfe finden</button>
<button class="btn-primary orange">Jetzt engagieren</button>
<button class="btn-primary purple">Demo vereinbaren</button>
<button class="btn-secondary">Mehr erfahren</button>
<a class="btn-white orange" href="...">Link button</a>
```

`.btn-white` uses color modifiers: `class="btn-white orange"` (not page-scoped).

---

## CSS Architecture

### Single `:root` block

All design tokens live in one `:root` block at the top of `shared-styles.css` (lines 10–82). **Never add a second `:root`.**

### Shared components (lines 154–1711)

Not scoped by `.page-*`. Available to all pages:
- Header, navigation, mega menu, mobile menu
- `.hero-mini`, `.tabs-section`, `.faq-section`, `.cta-section`
- `.btn-primary`, `.btn-secondary`, `.btn-white`
- `.testimonial-section`, `.partners-section`, `.footer`

### Page-scoped CSS (lines 1715–5890)

Each page gets its own section scoped under `.page-{slug}`:

```css
.page-startseite    { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-hilfe-finden  { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-engagieren    { --accent: var(--orange-primary);  --accent-light: var(--orange-light); }
.page-fuer-kommunen { --accent: var(--purple-primary);  --accent-light: var(--purple-light); }
.page-ueber-uns     { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-kontakt       { --accent: var(--blue-primary);   --accent-light: var(--blue-light); }
.page-muenchen      { --accent: var(--orange-primary);  --accent-light: var(--orange-light); }
```

### Hybrid accent system

- Each page's `<body class="page-{slug}">` sets `--accent` and `--accent-light`
- Shared components reference `var(--accent)` for context-aware coloring
- Example: `.nav-btn.active { background: var(--accent); }` adapts to current page

### Do-not-regress checklist

- [ ] Exactly one `:root` block
- [ ] Shared components NOT scoped under `.page-*`
- [ ] Page-specific CSS scoped ONLY under `.page-{slug}`
- [ ] Every page's `<body>` has the correct `.page-{slug}` class
- [ ] `--accent` / `--accent-light` set on every page class
- [ ] No inline CSS in HTML pages (except admin.html)

---

## Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `> 1024px` | Desktop |
| `768px – 1024px` | Tablet |
| `< 768px` | Mobile |

Key behaviors at mobile:
- Navigation collapses to hamburger menu
- Card grids switch to single column
- Tabs may stack vertically
- Hero images scale down, text adjusts

---

## Image Strategy

### Unsplash Placeholders

Use descriptive Unsplash URLs with appropriate sizes:

```html
<!-- Standard images: w=400 -->
<img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="..." />

<!-- Hero backgrounds: w=1400 -->
background: url("https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1400") center/cover;
```

### Motif guidelines

Images should match the social/care context: elderly people, volunteers helping, community activities, healthcare settings, municipal buildings, diverse groups working together.

### Storage (uploaded images)

Path convention: `images/{pageId}/{fieldId}-{timestamp}.{ext}` in Supabase Storage.

---

## Excel Content Table Format

### Structure per page (one .xlsx file per page)

| Element | Formatting |
|---------|------------|
| Row 1 (header) | Dark background (`#2D3748`), white text, Calibri 11 bold |
| Rows 2-4 (meta) | Page name, URL, block type |
| Block headers | `═══ BLOCK N: NAME ═══` — orange (`#E65100`) background, white text, Calibri 12 bold |
| Sub-headers | Colored background matching color logic (blue=`#E3F2FD`, orange=`#FFF3E0`, purple=`#F3E5F5`), NOT merged |
| Content rows | Calibri 10, descriptions in gray (`#666666`) |
| Link references | Font color `#1565C0` (blue) |

### Columns (A-F)

| Column | Header | Purpose | Width |
|--------|--------|---------|-------|
| A | Content-Typ (Element / Rolle) | Element type (Tag, Heading, Button, etc.) | 35 |
| B | Beschreibung / Ausprägung | Description for editor/developer | 40 |
| C | Titel (sichtbarer Content) | Short visible text | 50 |
| D | Text (sichtbarer Content) | Long visible text | 70 |
| E | Dateiname / Bild | Image filename or reference | 25 |
| F | Kommentar / Verlinkung | Links, icons, developer notes | 50 |

### Critical rule: No merged cells

Tab names, option titles, and other editable content must be in individual cells, NOT merged rows. Sub-headers are visual separators only — actual editable content goes in separate rows.
