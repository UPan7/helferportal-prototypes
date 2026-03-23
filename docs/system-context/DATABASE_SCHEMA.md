# Database Schema

> Supabase tables and their purpose. For detailed JSON schema and field types, see [DATA-MODEL.md](../DATA-MODEL.md).

## Tables

### `pages`

Primary content storage. One row per page.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Page slug: `startseite`, `hilfe-finden`, etc. |
| title | text | Page display title |
| slug | text | URL-safe identifier |
| content | jsonb | Full page content (blocks + fields) |
| updated_at | timestamptz | Last edit timestamp |

### `page_versions`

Auto-snapshot of previous content (trigger-based).

| Column | Type | Notes |
|--------|------|-------|
| id | serial (PK) | Auto-increment |
| page_id | text (FK → pages.id) | Which page |
| content | jsonb | Snapshot of OLD content before UPDATE |
| created_at | timestamptz | When snapshot was taken |

**Trigger:** `before_page_update` — automatically saves old `content` to `page_versions` on every UPDATE to `pages`.

### `feedback`

User feedback from prototype pages.

| Column | Type | Notes |
|--------|------|-------|
| id | serial (PK) | Auto-increment |
| page_id | text | Which page feedback is about |
| block_id | text | Optional — specific block |
| message | text | Feedback text |
| created_at | timestamptz | Submission time |

## Content Safety Layers

1. **Supabase `page_versions`** — auto-snapshot trigger
2. **Local backups** — `deploy.js` → `content/backups/` (10 per page)
3. **Git history** — all JSON committed

## References

- Full JSON schema, field types, block registry: [DATA-MODEL.md](../DATA-MODEL.md)
- Migration files: `supabase/migrations/`
