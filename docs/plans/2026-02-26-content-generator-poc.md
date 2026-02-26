# Content Generator POC — Design Document

**Date:** 2026-02-26
**Branch:** `feature/content-generator-poc`
**Scope:** Startseite (index.html) only

## Problem

The parallel `kamanin-content-editor` React app is becoming complex. We need a simpler way to let clients edit content without building a full CMS.

## Solution

A JSON-based content pipeline that separates content from templates:

```
index.html (template with data-field attributes)
    ↓ extract.js
content/startseite.json (structured content)
    ↓ client edits (via admin.html or directly)
    ↓ build.js
index.html (updated with new content)
```

## Architecture

### Data Attributes

Every content section has `data-block` + `data-block-id`:
```html
<section class="hero" data-block="hero-slider" data-block-id="b1">
```

Every editable element has `data-field` + `data-field-type`:
```html
<h1 data-field="slide-0-title" data-field-type="text">...</h1>
<p data-field="slide-0-text" data-field-type="textarea">...</p>
<img data-field="testimonial-image" data-field-type="image" src="...">
<a data-field="slide-0-btn" data-field-type="button" href="...">...</a>
```

### Field Types

| Type | Extracts | Applies to |
|------|----------|------------|
| `text` | textContent | headings, labels, short text |
| `textarea` | textContent | paragraphs, descriptions |
| `image` | src + alt | img elements |
| `button` | text + href | buttons/links with icons |
| `link` | text + href | navigation links |
| `video` | label + thumbnail | video cards |

### JSON Structure

```json
{
  "_meta": { "generator": "...", "source": "index.html" },
  "page": { "id": "startseite", "title": "...", "url": "/" },
  "blocks": [
    {
      "id": "b1",
      "type": "hero-slider",
      "fields": [
        { "id": "slide-0-title", "type": "text", "value": "..." },
        { "id": "slide-0-btn", "type": "button", "value": "...", "href": "..." }
      ]
    }
  ]
}
```

### Tools

| File | Purpose | Usage |
|------|---------|-------|
| `tools/extract.js` | HTML → JSON | `node extract.js ../index.html ../content/startseite.json` |
| `tools/build.js` | JSON → HTML | `node build.js ../content/startseite.json ../index.html` |
| `tools/admin.html` | Browser-based JSON editor | Open in browser, load JSON, edit, download |

### Dependencies

- `cheerio` (HTML parsing) — installed in `tools/`

## Results (POC)

- **9 blocks** annotated on Startseite
- **70 content fields** extracted
- Full round-trip tested: extract → modify → build → verify

## Next Steps

1. Annotate remaining pages (hilfe-finden, engagieren, etc.)
2. Add Excel export/import (JSON ↔ XLSX)
3. Consider replacing `kamanin-content-editor` with this lighter approach
4. Add validation in build.js (warn on missing fields)
5. Add image upload support in admin.html
