# Tech Context

> Technology stack, runtime environment, and toolchain for agent reference.

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Pages | Static HTML/CSS/JS | 7 pages, no framework, no build step |
| Styling | CSS custom properties | Single `shared-styles.css`, design tokens in `:root` |
| Scripts | Vanilla JS | Single `shared-scripts.js`, defer loaded |
| Content store | Supabase (PostgreSQL) | Source of truth for field values |
| CMS editor | `tools/admin.html` | Browser-based SPA, connects to Supabase |
| Content pipeline | Node.js (cheerio) | extract.js, build.js, deploy.js, etc. |
| Hosting | GitHub Pages | Auto-deploy on push to `main`, no build step |
| Domain | `www.helferportal.kamanin.at` | CNAME in repo root |

## Key Paths

| Path | Purpose |
|------|---------|
| `/*.html` | Live prototype pages (7 total) |
| `/assets/shared-styles.css` | All CSS |
| `/assets/shared-scripts.js` | All JS |
| `/content/*.json` | Structured content per page |
| `/tools/` | CLI pipeline + CMS editor |
| `/tools/lib/` | Shared modules (config, registry, field-ops) |
| `/tools/block-registry.json` | Canonical block/field schema |

## Runtime Requirements

- **Node.js** for CLI tools (cheerio is the only dependency)
- **Supabase credentials** in `tools/.env` (gitignored)
- **Browser** for CMS editor and local preview (`npx serve .`)

## Deployment Model

```
Push to main → GitHub Pages auto-deploy → site live in ~1 min
```

No build step. Repo root = document root. HTML files are served as-is.

## References

- Detailed architecture: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Design tokens & components: [SPEC.md](../SPEC.md)
- Content pipeline workflows: [CONTENT-PIPELINE.md](../CONTENT-PIPELINE.md)
