# System Constraints

> Hard rules, architecture caps, and non-negotiables. Never violate these.

---

## Hard Rules

### CSS

- **Never add a new `:root`** — all tokens live in the single `:root` block at the top of `shared-styles.css`
- **Never use page-scoped selectors for shared components** — `.page-startseite .btn-primary` is wrong; `.btn-primary.blue` is right
- **No inline CSS in HTML pages** (except `admin.html` which is a standalone SPA)

### Fields & Registry

- **Never invent field IDs outside registry patterns** — new fields must follow `{prefix}-{N}-{property}` and be documented in `block-registry.json`
- **Never add new block types without a registry entry** — every `data-block` value must resolve to a registry type or alias
- **`html` field type: internal use only** — `el.innerHTML = value` is the one place arbitrary markup enters the DOM. Use only for pre-authored content (internal editors), never for client-editable free text

### Links

- **Always use root-relative links** — `/hilfe-finden.html`, not `hilfe-finden.html` or full domain URLs

### Security

- **Never commit the `service_role` key** — must ONLY exist in `tools/.env` (gitignored). The anon key in `admin.html` is intentionally public (client-side, RLS-protected).

### Validation

- **Always validate before merge** — run `node validate.js {page}` for every modified page
- **Always run round-trip test** after content pipeline changes — `node test-roundtrip.js`

---

## Architecture Caps

| Constraint | Limit | Rationale |
|-----------|-------|-----------|
| Block types | Max 15 | Merge two existing ones or justify in writing before adding a 16th |
| Variants per block | Max 4 | If a block needs more, it's two different blocks |
| New block type | Requires 2+ page reuse | One-off layouts stay as custom HTML, not registered blocks |
| Config files | Minimize | No config for things that can be conventions |

These are **process rules**, not technical limits. Enforce in code review, not in code.

---

## What We Will NOT Build

- No drag-and-drop block reordering
- No dynamic block creation from the editor UI
- No nested/recursive block structures
- No field schema builder or admin panel for defining field types
- No multi-tenant auth or user roles (this is an internal tool)
- No visual design editing (colors, fonts, spacing)
- No component library or design system renderer
- No server-side rendering or SSR framework
- No React/Vue/Svelte rewrite of the prototypes

---

## Anti-Complexity Rules

1. If a feature requires more than 100 lines of new code, it needs a written justification.
2. If a new abstraction serves fewer than 3 use cases, inline the logic instead.
3. No config files for things that can be conventions.
4. Shared logic lives in one file, imported by others — never duplicated.

---

## Soft Guidelines

- Keep CSS under `.page-{slug}` scope for page-specific styles
- Prefer `--accent` / `--accent-light` over hardcoded colors in shared components
- Use `basic` level for content editors, `advanced` for developer/power-user fields
- Image fields must use `{ src, alt }` format (not flat string)
- Button/link fields must have both `value` (text) and `href` (URL)
- Run `node validate.js {page} --strict` for thorough checks including prefix validation
