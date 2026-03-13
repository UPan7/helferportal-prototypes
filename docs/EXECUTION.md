# Execution Plan

> Living development roadmap. Completed phases are summarized; active/upcoming phases have full task lists.

---

## Completed Phases

### Phase 0 — Page Annotation [DONE 2026-03-08]

All 7 pages annotated with `data-block`/`data-field` attributes. JSON content files generated. Block registry frozen at v1.1. Round-trip verified for all pages.

See [CHANGELOG.md](./CHANGELOG.md) for details.

### Phase 1 — Live Preview MVP [DONE 2026-03-02]

`preview-bridge.js` created as static file with iframe self-activation. Preview panel in admin.html with field updates via debounced postMessage. Highlight on field focus. Works in online and offline mode.

See [CHANGELOG.md](./CHANGELOG.md) for details.

### Phase 2 — Architecture Refactor [DONE 2026-03-08]

Shared libraries (`lib/config.js`, `lib/registry.js`, `lib/field-ops.js`). Round-trip test (`test-roundtrip.js`) — all 7 pages pass. CSS/JS cleanup, admin.html dead code removal.

See [CHANGELOG.md](./CHANGELOG.md) for details.

---

## Active / Upcoming

### Phase 3 — Persistence Refinements [PENDING]

**Goal:** Lightweight versioning for content snapshots.

**Deliverables:**

- [ ] `page_versions` table + RLS in Supabase
- [ ] "Create Snapshot" button in admin.html toolbar
- [ ] "Version History" sidebar panel (collapsible)
- [ ] Restore version → load content into editor (with confirmation)
- [ ] Auto-prune: max 20 versions per page
- [ ] Optional: simple field diff (text fields only)

**Definition of Done:**
User can create a named snapshot, view version list, and restore any previous version. Old versions auto-pruned beyond 20.

**Risks:**
- JSONB diff is non-trivial → keep it simple: field-by-field comparison
- Large content JSONs may bloat table → 20-version cap mitigates
- Restore must not bypass unsaved-changes check

**Database schema:**
```sql
CREATE TABLE page_versions (
    id SERIAL PRIMARY KEY,
    page_id TEXT REFERENCES pages(id),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    note TEXT  -- optional label
);
```

**Tasks:**
```
P3-01  Add page_versions table to supabase-setup.sql
P3-02  Add RLS policies (anon read/write)
P3-03  Add "Create Snapshot" button in toolbar
P3-04  Implement saveSnapshot() → insert into page_versions
P3-05  Add version history sidebar panel (collapsible)
P3-06  Implement loadVersionList() → query for current page
P3-07  Implement restoreVersion() → load content (with confirmation)
P3-08  Add auto-prune: DELETE oldest when count > 20 per page
P3-09  Optional: simple field diff view
P3-10  Test full cycle: edit → snapshot → edit more → restore → verify
```

---

### Phase 4 — Technical Debt [BACKLOG]

Items that improve quality but aren't blocking:

- [ ] **Header/footer templating** — eliminate 7-file duplication (HTML includes or build-time injection)
- [ ] **München CSS variables** — replace hardcoded hex colors with `var(--*)` references
- [ ] **deploy.js build extraction** — extract shared build function or have deploy.js call build.js
- [ ] **admin.html modularization** — split 3400-line monolith if/when maintenance becomes painful

---

## Implementation Rules

### DO

- Pull from Supabase before starting: `cd tools && node deploy.js`
- Validate after every change: `node validate.js {page}`
- Run round-trip test after pipeline changes: `node test-roundtrip.js`
- Update docs in the same commit as code changes

### DO NOT

- Skip conflict checks when pushing to Supabase
- Add new block types without registry entries
- Inline CSS or JS in HTML pages
- Add a second `:root` block
- Modify `admin.html` BLOCK_LABELS/FIELD_LABELS without testing the editor

### Quality Bar

- `validate.js` passes with 0 errors, 0 warnings for all affected pages
- `test-roundtrip.js` passes for all 7 pages
- No broken root-relative links
- No inline styles in HTML pages
