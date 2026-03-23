# Current State Map

> What exists today and its status.

## Pages (7/7 complete)

| Page | File | Blocks | Status |
|------|------|--------|--------|
| Startseite | index.html | 9 | Live |
| Hilfe finden | hilfe-finden.html | 5 | Live |
| Engagieren | engagieren.html | 6 | Live |
| Fur die offentliche Hand | fuer-kommunen.html | 5 | Live |
| Uber uns | ueber-uns.html | 6 | Live |
| Kontakt | kontakt.html | 3 | Live |
| Munchen | muenchen.html | 7 | Live |

## Content Pipeline

| Component | Status | Notes |
|-----------|--------|-------|
| extract.js (HTML→JSON) | Working | With structured text support |
| build.js (JSON→HTML) | Working | Field-ops based |
| deploy.js (Supabase→JSON→HTML) | Working | With backup system |
| sync-to-supabase.js (JSON→Supabase) | Working | Conflict-safe, --dry-run |
| validate.js | Working | HTML/JSON consistency |
| test-roundtrip.js | Working | All 7 pages pass |
| admin.html (CMS) | Working | Browser-based, Supabase backend |
| Publish flow | Working | CMS→Edge Function→GitHub Actions→deploy |

## Infrastructure

| Component | Status |
|-----------|--------|
| GitHub Pages hosting | Active |
| Supabase backend | Active |
| page_versions auto-snapshot | Active |
| Local backup system | Active |
| Pre-commit validation hook | Active |

## Current Phase

Prototype review with client. Collecting feedback for visual/content adjustments.
See [EXECUTION.md](../EXECUTION.md) for full roadmap.
