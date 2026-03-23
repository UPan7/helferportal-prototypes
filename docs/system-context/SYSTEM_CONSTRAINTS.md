# System Constraints

> Quick-reference constraints for agents. For the full list with rationale, see [CONSTRAINTS.md](../CONSTRAINTS.md).

## Non-Negotiable Rules

### Architecture
- **No build step** — HTML files are served as-is from repo root
- **No frameworks** — vanilla HTML/CSS/JS only for prototype pages
- **Single CSS file** — all styles in `shared-styles.css`
- **Single JS file** — all scripts in `shared-scripts.js`
- **No inline CSS/JS** in HTML pages (except admin.html)

### Content
- **Supabase = source of truth** for field values
- **`deploy.js` before any local work** — always pull latest first
- **Never commit `service_role` key** — only in `tools/.env`
- **Root-relative links only** — `/hilfe-finden.html`, not relative

### HTML Annotations
- Every `<section>` needs `data-block` + `data-block-id`
- Content elements need `data-field` + `data-field-type`
- Block IDs are sequential per page: b1, b2, b3...
- New fields must follow registry patterns in `block-registry.json`

### CMS
- Block registry is frozen at v1.1 — no new block types without ADR
- `html` field type is internal-only, never for client-editable text
- Header/footer identical across all 7 pages — update ALL when changing

### Languages
- UI content: German (formal "Sie" for B2B, informal "du" for Engagierte)
- Code/comments: English
- CSS classes: English

## References

- Full constraints with rationale: [CONSTRAINTS.md](../CONSTRAINTS.md)
- Architecture decisions: [DECISIONS.md](../DECISIONS.md)
