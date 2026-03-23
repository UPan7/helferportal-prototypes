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
├── content/backups/               ← local JSON backups before overwrite (gitignored)
├── tools/
│   ├── admin.html                ← CMS editor (browser-based)
│   ├── extract.js                ← HTML → JSON extractor
│   ├── build.js                  ← JSON → HTML builder
│   ├── deploy.js                 ← Supabase → JSON → HTML pipeline (with backup)
│   ├── sync-to-supabase.js       ← JSON → Supabase (reverse sync, conflict-safe)
│   ├── validate.js               ← HTML/JSON integrity checker
│   ├── test-roundtrip.js         ← round-trip test (extract→build→validate)
│   ├── block-registry.json       ← canonical block type definitions
│   ├── lib/
│   │   ├── config.js             ← shared config (.env, PAGE_IDS, Supabase)
│   │   ├── registry.js           ← block type alias resolution
│   │   └── field-ops.js          ← shared field application logic
│   ├── package.json              ← Node deps (cheerio only)
│   └── .env                      ← Supabase credentials (gitignored)
├── supabase/
│   ├── migrations/               ← SQL migration files
│   │   └── 002_page_versions.sql ← page_versions table + auto-snapshot trigger
│   └── functions/
│       └── publish/index.ts      ← Edge Function: CMS publish → GitHub Actions
├── .github/
│   └── workflows/
│       └── deploy-content.yml    ← GitHub Actions: Supabase → JSON → HTML → push
├── .claude/
│   └── agents/                   ← agent definitions (reviewer, impl, QA, docs, designer)
├── docs/
│   ├── PRODUCT-VISION.md         ← business context, audiences
│   ├── ARCHITECTURE.md           ← system overview, diagrams, tools
│   ├── SPEC.md                   ← design tokens, components, CSS architecture
│   ├── DATA-MODEL.md             ← JSON schema, field types, Supabase tables
│   ├── CONTENT-PIPELINE.md       ← content flow, workflows, CLI reference
│   ├── CONSTRAINTS.md            ← hard rules, caps, non-negotiables
│   ├── DECISIONS.md              ← architecture decision records (ADRs)
│   ├── CHANGELOG.md              ← phase-by-phase project history
│   ├── EXECUTION.md              ← living roadmap (completed + upcoming phases)
│   ├── ideas/                    ← future features, auto-captured gaps
│   ├── planning/                 ← domain model, current state, product gaps
│   ├── system-context/           ← agent quick-reference docs
│   └── reference/context-hub/    ← cached API docs
├── tasks/
│   ├── dashboard.md              ← human-readable team status
│   ├── dashboard.json            ← machine-readable status (agents-dashboard)
│   └── task-template.md          ← template for each task
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

**Never inline CSS or JS in page files** (except for page-specific `<title>` and meta).

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

All inter-page links use root-relative paths (`/hilfe-finden.html`), NOT relative and NOT full domain URLs.

External app links: `https://hilfe.helferportal.de` (help seekers), `https://helfen.helferportal.de` (volunteers).

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

### 5. Block Numbering

Blocks are numbered sequentially per page: b1, b2, b3... The `data-block` value is the semantic type (e.g., `hero-slider`, `tabs-section`, `faq-section`). The `data-block-id` is the page-local sequential ID.

## Page Inventory

| # | Page | URL | Blocks | Color |
|---|------|-----|--------|-------|
| 1 | Startseite | `/` | 9 | Blue |
| 2 | Hilfe finden | `/hilfe-finden` | 5 | Blue |
| 3 | Engagieren | `/engagieren` | 6 | Orange |
| 4 | Für die öffentliche Hand & soziale Akteure | `/fuer-kommunen` | 5 | Purple |
| 5 | Über uns | `/ueber-uns` | 6 | Blue |
| 6 | Anmelden / Kontakt | `/kontakt` | 3 | Blue |
| 7 | München (Stadtseite) | `/muenchen` | 7 | Orange |

All subpages follow: Mini Hero → Content blocks → FAQ → shared header/footer.

## Content Pipeline & Source of Truth

**Supabase is the single source of truth for content.** Structural HTML changes (nav, footer, CSS) are done locally.

### Content tools (run from `tools/` directory)

```bash
node deploy.js                           # Pull Supabase → JSON → HTML (all pages, with backup)
node deploy.js --page fuer-kommunen      # Pull one page
node deploy.js --local                   # Build from local JSON (no Supabase)

node extract.js ../page.html ../content/page.json   # HTML → JSON
node build.js ../content/page.json ../page.html      # JSON → HTML

node sync-to-supabase.js --page fuer-kommunen        # Push JSON → Supabase (conflict check)
node sync-to-supabase.js --page fuer-kommunen --force # Push without conflict check
node sync-to-supabase.js --dry-run                    # Preview what would change (no writes)

node validate.js startseite              # Check HTML/JSON consistency
node test-roundtrip.js                   # Round-trip test all pages
```

### Before starting local work (MANDATORY)

**ALWAYS run before ANY edits to HTML pages or content JSON:**

```bash
cd tools && node deploy.js
```

This pulls the latest content from Supabase (source of truth) and applies it to local files. Skipping this step risks silently overwriting content edited via CMS. `deploy.js` creates a backup before overwriting, but prevention is better than recovery.

### Updating content text

**Preferred**: CMS (admin.html) → Save → Supabase → `node deploy.js` → `git push`.

**Locally**: `deploy.js` → edit HTML → `extract.js` → `sync-to-supabase.js` → `git push`.

### Structural changes (nav, footer, CSS)

`deploy.js` → edit HTML → `git push`. Even for structural-only changes, deploy first — CMS field values may have changed and need to be applied to your local HTML.

### Publishing from CMS

CMS → Save → "Veröffentlichen" → Edge Function → GitHub Actions → `deploy.js` → git push → GitHub Pages.
The PAT stays server-side in the Edge Function. Content appears on the live site in ~1–2 min.

### Content safety

Three layers protect against content loss:
1. **Supabase `page_versions`** — auto-snapshot trigger saves OLD content on every UPDATE
2. **Local backups** — `deploy.js` copies existing JSON to `content/backups/` before overwriting (10 per page, auto-cleanup)
3. **Git history** — all JSON changes are committed

For detailed workflows see [docs/CONTENT-PIPELINE.md](docs/CONTENT-PIPELINE.md).

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

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Supabase Realtime disconnects | Fallback to 30s polling via React Query staleTime |
| Edge Function returns 500 | Toast with "Verbindungsfehler. Bitte erneut versuchen." + retry button |
| Edge Function returns 202XX | Treat as transient, retry once automatically |
| task_cache empty on first login | Show loading skeleton → trigger `fetch-clickup-tasks` → populate |
| Webhook down (stale data) | Portal works with cached data. Manual refresh button triggers full sync |
| Comment post fails | Revert optimistic update, show error toast |

## Context Hub (chub)

Tool for fetching LLM-optimized API docs on demand instead of guessing from training data.

- **Install:** `npm install -g @aisuite/chub` (already installed globally)
- **Skill:** `~/.claude/skills/get-api-docs/SKILL.md` (global)
- **Usage:** Before writing code against an external API → `chub search [api]` → `chub get [id] --lang js`
- **Add gotchas:** `chub annotate [id] "note"` (overwrites — combine all notes for same ID into one call)
- **Available for our stack:** `supabase/client` (v2.76.1) — includes our portal-specific annotations
- **Not available (yet):** React, Tailwind, ClickUp, Mailjet, Vite — registry is growing

## Docs Update Protocol

After ANY structural change:
1. Update relevant doc in `docs/`
2. Update this CLAUDE.md if project-level context changed
3. Add entry to `docs/DECISIONS.md` for architecture decisions
4. Add entry to `docs/CHANGELOG.md`

## Rules

- **Supabase = source of truth**: Never overwrite Supabase content without checking for conflicts first. Use `sync-to-supabase.js` (has built-in conflict detection).
- **Deploy first, always**: `node deploy.js` is MANDATORY before any local work. The full local workflow is: **pull → edit → extract → sync → commit → push**. Never skip the pull step — CMS edits happen asynchronously and your local copy may be stale.
- **deploy.js textarea handler**: `field-ops.js` textarea handler now uses `applyStructuredText()` for elements with children, preserving nested HTML structure. Plain-text textarea fields still use `.text()`. Round-trip tested across all 7 pages.
- At the end of every session, when asked to wrap up, update the Session Log section below following the standard format.

## Workflow Rules

- **Plan mode**: Use for any non-trivial task (3+ steps or architectural decisions). If something goes sideways, STOP and re-plan — don't keep pushing.
- **Verify before done**: Always run `node validate.js {page}` + `node test-roundtrip.js` after changes. For content pipeline changes, verify idempotency: deploy → extract → diff should produce no changes.
- **Autonomous bug fixing**: When given a bug report, just fix it. Point at logs/errors, then resolve. Zero context switching required from the user.
- **Lessons learned**: After corrections from the user, update `MEMORY.md` with the pattern to prevent repeating the same mistake.

## Supervisor Role (Lead Session)

This session acts as the Supervisor for the agent team.
You are responsible for this project. Yuri is your manager. You manage the agent team.

### Core Rules

- Frame tasks clearly before execution using the task template (`tasks/task-template.md`)
- Stop uncontrolled scope growth
- **Dashboard discipline:** Update BOTH `tasks/dashboard.md` AND `tasks/dashboard.json` at EVERY phase transition
- After every completed step, immediately trigger the next step
- **Approval gate:** Wait for explicit user approval before launching implementation-agent
- Each checkpoint: verify (1) actual task status and (2) dashboard accuracy

### Must NOT Do

- Skip review just to move faster
- Treat first implementation as automatically acceptable
- Let silent multi-hour drift happen

### Standard Workflow Sequence

1. Supervisor frames the task (using task template)
2. reviewer-architect critiques the plan (pre-code review)
3. **WAIT for user approval**
4. implementation-agent executes scoped work
5. reviewer-architect reviews the result (post-code review)
6. qa-agent verifies behavior and regressions
7. Supervisor decides accept / revise
8. docs-memory-agent updates documentation

### Minimum Handoff Content

Each handoff to an agent MUST include:
- Task goal
- In-scope / Out-of-scope changes
- Affected files/modules
- Constraints / references to consult
- Known risks
- Required outputs

### Documentation Ownership

After EVERY completed task:
- Update `docs/CHANGELOG.md`
- Verify `docs/ARCHITECTURE.md`, `docs/system-context/DATABASE_SCHEMA.md`
- Create/update task file in `tasks/TASK-XXX-*.md`
- Failing to update docs = supervisor failure

### Ideas — Auto-Capture

During ANY task, if you discover something that should be built but is out of scope:
- Create a file in `docs/ideas/`
- Add to `tasks/dashboard.json` ideas array
- Don't wait for user — if you see a gap, write it down

## Available Agents

| Agent | Model | Role |
|-------|-------|------|
| reviewer-architect | Sonnet | Pre-code & post-code review, architecture gate |
| implementation-agent | Opus | Coding, follows approved scope |
| designer | Opus | UI/UX design + implementation |
| qa-agent | Sonnet | Build verification, data flow, edge cases, browser checks |
| docs-memory-agent | Sonnet | Updates docs, records decisions |

## Further Reading

| Document | Purpose |
|----------|---------|
| [docs/PRODUCT-VISION.md](docs/PRODUCT-VISION.md) | Business context, target audiences, project role |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System overview, diagrams, CLI tools, CMS editor internals |
| [docs/SPEC.md](docs/SPEC.md) | Design tokens, UI components, CSS architecture, Excel format |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | JSON schema, field types, block registry, Supabase tables |
| [docs/CONTENT-PIPELINE.md](docs/CONTENT-PIPELINE.md) | Content flow, operational workflows, CLI reference, validation |
| [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md) | Hard rules, architecture caps, what we will NOT build |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture Decision Records (ADRs) — why choices were made |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Phase-by-phase project history |
| [docs/EXECUTION.md](docs/EXECUTION.md) | Living roadmap — completed and upcoming phases |
| [docs/system-context/](docs/system-context/) | Agent quick-reference: tech stack, DB schema, constraints |
| [docs/planning/](docs/planning/) | Current state map, domain model, product gaps |
| [tasks/](tasks/) | Team dashboard, task files, template |
