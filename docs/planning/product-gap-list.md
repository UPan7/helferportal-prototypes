# Product Gap List

> Known gaps between current state and desired state. Updated by agents during task execution.

## Open Gaps

### Content
- [ ] Munchen page uses hardcoded hex colors instead of CSS variables
- [ ] No automated spell-check for German content

### Pipeline
- [ ] deploy.js inlines build.js field application loop (shared field-ops.js, but iteration code duplicated)
- [ ] No automated visual regression testing

### CMS
- [ ] admin.html is a 3400-line monolith (CSS+HTML+JS mixed)
- [ ] No undo/redo in CMS editor
- [ ] No multi-user editing conflict resolution in real-time

### Infrastructure
- [ ] No staging environment (all changes go directly to production)
- [ ] No automated accessibility testing

## Resolved Gaps

- [x] Content safety (solved: 3-layer backup system)
- [x] Round-trip fidelity (solved: test-roundtrip.js)
- [x] Structured textarea handling (solved: applyStructuredText)
- [x] Duplicate code in tools (solved: lib/config.js, lib/registry.js)
