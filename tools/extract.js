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
        field.value = $field.attr('src') || '';
        field.alt = $field.attr('alt') || '';
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
        field.value = $field.text().trim();
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

// --- Build output ---
const output = {
  _meta: {
    generator: 'helferportal-content-tools/extract.js',
    source: path.basename(inputPath),
    extracted: new Date().toISOString()
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

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');

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
