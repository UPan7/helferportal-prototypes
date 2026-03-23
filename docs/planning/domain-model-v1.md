# Domain Model v1

> Core concepts and their relationships in the Helferportal prototype system.

## Entities

### Page
A single HTML prototype page representing one section of the Helferportal website.
- Has: title, slug, URL, color theme (blue/orange/purple)
- Contains: ordered list of Blocks
- Stored in: `{slug}.html` (HTML) + `content/{slug}.json` (JSON) + Supabase `pages` table

### Block
A content section within a page (hero, tabs, FAQ, etc.).
- Has: id (b1, b2...), type (from registry), sequential position
- Contains: ordered list of Fields
- Annotated via: `data-block` + `data-block-id` attributes
- Defined in: `tools/block-registry.json`

### Field
A single editable content element within a block.
- Has: id, type (text/textarea/image/link/html), value, level (basic/advanced)
- Annotated via: `data-field` + `data-field-type` attributes
- Editable through CMS or direct HTML editing

### Block Registry
Frozen schema defining all valid block types, field patterns, and aliases.
- Version: v1.1 (15 block types, 24 aliases)
- File: `tools/block-registry.json`

## Audiences

| Audience | Pages | Tone | Color |
|----------|-------|------|-------|
| Help seekers | Hilfe finden | Formal (Sie) | Blue |
| Volunteers | Engagieren | Informal (du) | Orange |
| Municipalities | Fur Kommunen | Formal (Sie) | Purple |
| General | Startseite, Uber uns, Kontakt | Formal (Sie) | Blue |

## Content Flow

```
CMS Editor ──save──▶ Supabase ──deploy.js──▶ JSON ──build.js──▶ HTML ──push──▶ GitHub Pages
                                                ◀──extract.js──  ◀────────────── (live site)
```
