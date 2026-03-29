#!/usr/bin/env node
/**
 * extract.js — Parse an annotated HTML prototype and extract all
 * data-block / data-field content into a structured JSON file.
 *
 * Usage:
 *   node extract.js <input.html> <output.json>
 *   node extract.js ../index.html ../content/startseite.json
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { resolveBlockDef } = require('./lib/registry');

// Recursively sort object keys for stable JSON output
function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// --- CLI args ---
const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node extract.js <input.html> <output.json>');
  process.exit(1);
}

const htmlPath = path.resolve(__dirname, inputPath);
const jsonPath = path.resolve(__dirname, outputPath);

// --- Read HTML ---
const html = fs.readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html);

// --- Extract page meta ---
const pageTitle = $('title').text().trim();
const bodyClass = $('body').attr('class') || '';
const pageId = bodyClass.replace('page-', '') || path.basename(inputPath, '.html');

// --- Extract blocks ---
const blocks = [];

$('[data-block]').each((_, blockEl) => {
  const $block = $(blockEl);
  const block = {
    id: $block.attr('data-block-id'),
    type: $block.attr('data-block'),
    fields: []
  };

  // Find all data-field elements within this block
  $block.find('[data-field]').each((_, fieldEl) => {
    const $field = $(fieldEl);
    const fieldId = $field.attr('data-field');
    const fieldType = $field.attr('data-field-type') || 'text';
    const field = { id: fieldId, type: fieldType };

    switch (fieldType) {
      case 'image':
        field.value = {
          src: $field.attr('src') || '',
          alt: $field.attr('alt') || ''
        };
        break;

      case 'link':
      case 'button':
        field.href = $field.attr('href') || '';
        // Get only direct text, not SVG/icon content
        field.value = getTextOnly($, $field);
        break;

      case 'video':
        // For video cards, get the label and thumbnail
        const $thumb = $field.find('.video-thumbnail');
        const $label = $field.find('.video-card-label');
        field.value = $label.text().trim();
        field.thumbnail = $thumb.attr('src') || '';
        field.alt = $thumb.attr('alt') || '';
        break;

      case 'textarea':
        if ($field.children().length > 0) {
          field.value = extractStructuredText($, $field);
        } else {
          field.value = $field.text().trim();
        }
        break;

      case 'html':
        field.value = $field.html().trim();
        break;

      default: // 'text'
        field.value = $field.text().trim();
        break;
    }

    block.fields.push(field);
  });

  blocks.push(block);
});

// --- Assign levels from block-registry ---
const registryPath = path.resolve(__dirname, 'block-registry.json');
let registry = null;
try { registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')); } catch (e) { /* optional */ }

if (registry) {
  for (const block of blocks) {
    // Resolve block definition (direct or alias)
    const blockDef = resolveBlockDef(block.type, registry);
    if (!blockDef?.fields) {
      // Unknown block type — default all fields to 'basic'
      for (const field of block.fields) {
        if (!field.level) field.level = 'basic';
      }
      continue;
    }

    // Flatten variant field maps
    const allPatterns = {};
    for (const [key, val] of Object.entries(blockDef.fields)) {
      if (key.startsWith('_')) Object.assign(allPatterns, val);
      else allPatterns[key] = val;
    }

    for (const field of block.fields) {
      // Try exact match first, then regex match
      if (allPatterns[field.id]) {
        field.level = allPatterns[field.id].level || 'basic';
      } else {
        for (const [pattern, meta] of Object.entries(allPatterns)) {
          if (!meta.repeatable) continue;
          const regex = new RegExp('^' + pattern.replace(/\{[^}]+\}/g, '(.+)') + '$');
          if (regex.test(field.id)) { field.level = meta.level || 'basic'; break; }
        }
      }
      if (!field.level) field.level = 'basic'; // Default fallback
    }
  }
}

// --- Build output ---
const output = {
  _meta: {
    generator: 'helferportal-content-tools/extract.js',
    source: path.basename(inputPath),
    extracted: new Date().toISOString(),
    schema_version: '2.0'
  },
  page: {
    id: pageId,
    title: pageTitle,
    url: pageId === 'startseite' ? '/' : `/${path.basename(inputPath)}`
  },
  blocks
};

// --- Write JSON ---
const outputDir = path.dirname(jsonPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(jsonPath, JSON.stringify(sortKeys(output), null, 2), 'utf-8');

console.log(`✓ Extracted ${blocks.length} blocks, ${blocks.reduce((s, b) => s + b.fields.length, 0)} fields`);
console.log(`  → ${jsonPath}`);

// --- Helpers ---

/**
 * Get only text content, excluding SVG and other non-text children.
 */
function getTextOnly($, $el) {
  let text = '';
  $el.contents().each((_, node) => {
    if (node.type === 'text') {
      text += $(node).text();
    }
  });
  return text.trim();
}

/**
 * Extract structured text from card-like containers.
 * Finds h3/h4 + p pairs → pipe-delimited "Title | Description".
 * Falls back to cleaned text per child element.
 * Recurses into wrapper divs (tags-grid, benefits-list, etc.).
 */
function extractStructuredText($, $el) {
  const items = [];
  $el.children().each((_, child) => {
    const $child = $(child);
    const title = $child.find('h3, h4').first().text().trim();
    const desc  = $child.find('p').first().text().trim();
    if (title) {
      items.push(desc ? `${title} | ${desc}` : title);
    } else {
      const text = getTextOnly($, $child);
      if (text) {
        items.push(text);
      } else if ($child.children().length > 0) {
        // Recurse into wrapper containers (e.g., tags-grid → spans, benefits-list → divs)
        $child.children().each((_, grandchild) => {
          const $gc = $(grandchild);
          const gcTitle = $gc.find('h3, h4').first().text().trim();
          const gcDesc  = $gc.find('p').first().text().trim();
          if (gcTitle) {
            items.push(gcDesc ? `${gcTitle} | ${gcDesc}` : gcTitle);
          } else {
            const gcText = getTextOnly($, $gc);
            if (gcText) items.push(gcText);
          }
        });
      }
    }
  });
  return items.length > 0
    ? items.join('\n')
    : $el.text().replace(/\s+/g, ' ').trim();
}
