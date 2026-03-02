#!/usr/bin/env node
/**
 * build.js — Read a content JSON file and apply its values back
 * into the annotated HTML prototype, updating text, images, and links.
 *
 * Usage:
 *   node build.js <content.json> <target.html>
 *   node build.js ../content/startseite.json ../index.html
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { applyField } = require('./lib/field-ops');

// --- CLI args ---
const [,, jsonInputPath, htmlTargetPath] = process.argv;

if (!jsonInputPath || !htmlTargetPath) {
  console.error('Usage: node build.js <content.json> <target.html>');
  process.exit(1);
}

const jsonPath = path.resolve(__dirname, jsonInputPath);
const htmlPath = path.resolve(__dirname, htmlTargetPath);

// --- Read inputs ---
const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const html = fs.readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html, { decodeEntities: false });

// --- Build a lookup: "blockId:fieldId" → field data ---
// Keyed by block to handle multiple blocks with the same field IDs
// (e.g. two "cards" blocks on one page both having "card-1-title").
const fieldMap = new Map();
for (const block of content.blocks) {
  for (const field of block.fields) {
    fieldMap.set(`${block.id}:${field.id}`, field);
  }
}

// --- Apply fields ---
let updated = 0;

$('[data-field]').each((_, el) => {
  const $el = $(el);
  const fieldId = $el.attr('data-field');
  const fieldType = $el.attr('data-field-type') || 'text';
  const blockId = $el.closest('[data-block-id]').attr('data-block-id');
  const field = blockId
    ? fieldMap.get(`${blockId}:${fieldId}`)
    : fieldMap.get(fieldId);  // fallback for unscoped elements

  if (!field) return; // field not in JSON, skip

  if (applyField($, $el, fieldType, field)) updated++;
});

// --- Write output ---
const output = $.html();
fs.writeFileSync(htmlPath, output, 'utf-8');

console.log(`✓ Applied ${updated} field updates to ${path.basename(htmlPath)}`);
console.log(`  Fields in JSON: ${fieldMap.size}, Fields in HTML: ${$('[data-field]').length}`);

// Report any fields in JSON that weren't found in HTML
const htmlFields = new Set();
$('[data-field]').each((_, el) => {
  const fId = $(el).attr('data-field');
  const bId = $(el).closest('[data-block-id]').attr('data-block-id');
  htmlFields.add(bId ? `${bId}:${fId}` : fId);
});
const missing = [...fieldMap.keys()].filter(id => !htmlFields.has(id));
if (missing.length > 0) {
  console.warn(`  ⚠ ${missing.length} fields in JSON not found in HTML: ${missing.join(', ')}`);
}
