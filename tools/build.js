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

// --- Build a lookup: fieldId → field data ---
const fieldMap = new Map();
for (const block of content.blocks) {
  for (const field of block.fields) {
    fieldMap.set(field.id, field);
  }
}

// --- Apply fields ---
let updated = 0;

$('[data-field]').each((_, el) => {
  const $el = $(el);
  const fieldId = $el.attr('data-field');
  const fieldType = $el.attr('data-field-type') || 'text';
  const field = fieldMap.get(fieldId);

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
$('[data-field]').each((_, el) => htmlFields.add($(el).attr('data-field')));
const missing = [...fieldMap.keys()].filter(id => !htmlFields.has(id));
if (missing.length > 0) {
  console.warn(`  ⚠ ${missing.length} fields in JSON not found in HTML: ${missing.join(', ')}`);
}
