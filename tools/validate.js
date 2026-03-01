#!/usr/bin/env node
// Schema/annotation validator for Helferportal CMS
// Usage: node validate.js <page> [--strict]
// Example: node validate.js startseite
//          node validate.js startseite --strict

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const pageName = args.find(a => !a.startsWith('--'));

if (!pageName) {
  console.error('Usage: node validate.js <page> [--strict]');
  console.error('Example: node validate.js startseite');
  process.exit(1);
}

// Resolve file paths
const rootDir = path.resolve(__dirname, '..');
const jsonPath = path.join(rootDir, 'content', `${pageName}.json`);
const htmlPath = pageName === 'startseite'
  ? path.join(rootDir, 'index.html')
  : path.join(rootDir, `${pageName}.html`);

// Validate files exist
if (!fs.existsSync(jsonPath)) {
  console.error(`JSON not found: ${jsonPath}`);
  process.exit(1);
}
if (!fs.existsSync(htmlPath)) {
  console.error(`HTML not found: ${htmlPath}`);
  process.exit(1);
}

// Parse JSON
const contentData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const jsonFields = new Map(); // id -> field object
const blockIds = [];

for (const block of contentData.blocks) {
  blockIds.push(block.id);
  for (const field of block.fields) {
    jsonFields.set(field.id, { ...field, blockId: block.id });
  }
}

// Parse HTML
const html = fs.readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html);

const htmlFields = new Map(); // fieldId -> [elements]
const htmlBlockIds = [];

$('[data-block-id]').each((_, el) => {
  htmlBlockIds.push($(el).attr('data-block-id'));
});

$('[data-field]').each((_, el) => {
  const fieldId = $(el).attr('data-field');
  if (!htmlFields.has(fieldId)) {
    htmlFields.set(fieldId, []);
  }
  htmlFields.get(fieldId).push({
    tag: el.tagName,
    type: $(el).attr('data-field-type') || null,
  });
});

// Validation results
const errors = [];
const warnings = [];

// --- Check 1: Duplicate data-field IDs in HTML ---
for (const [fieldId, elements] of htmlFields) {
  if (elements.length > 1) {
    errors.push(`DUPLICATE data-field="${fieldId}" appears ${elements.length} times in HTML`);
  }
}

// --- Check 2: Duplicate block IDs ---
const blockIdCounts = {};
for (const id of htmlBlockIds) {
  blockIdCounts[id] = (blockIdCounts[id] || 0) + 1;
}
for (const [id, count] of Object.entries(blockIdCounts)) {
  if (count > 1) {
    errors.push(`DUPLICATE data-block-id="${id}" appears ${count} times in HTML`);
  }
}

// --- Check 3: Orphans (in HTML but not in JSON) ---
for (const fieldId of htmlFields.keys()) {
  if (!jsonFields.has(fieldId)) {
    warnings.push(`ORPHAN: data-field="${fieldId}" in HTML but missing in JSON`);
  }
}

// --- Check 4: Ghosts (in JSON but not in HTML) ---
for (const [fieldId, field] of jsonFields) {
  if (!htmlFields.has(fieldId)) {
    const msg = `GHOST: field "${fieldId}" in JSON (block ${field.blockId}) but missing in HTML`;
    if (strict) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }
}

// --- Check 5: Validate field types ---
const VALID_TYPES = new Set(['text', 'textarea', 'image', 'button', 'link']);
for (const [fieldId, field] of jsonFields) {
  if (!VALID_TYPES.has(field.type)) {
    warnings.push(`UNKNOWN TYPE: field "${fieldId}" has type "${field.type}" (expected: ${[...VALID_TYPES].join(', ')})`);
  }
}

// --- Check 6: Validate level property ---
const VALID_LEVELS = new Set(['basic', 'advanced']);
for (const [fieldId, field] of jsonFields) {
  if (!field.level) {
    errors.push(`MISSING LEVEL: field "${fieldId}" has no "level" property (must be "basic" or "advanced")`);
  } else if (!VALID_LEVELS.has(field.level)) {
    errors.push(`INVALID LEVEL: field "${fieldId}" has level "${field.level}" (must be "basic" or "advanced")`);
  }
}

// --- Check 7: Legacy image format (string value instead of {src, alt}) ---
for (const [fieldId, field] of jsonFields) {
  if (field.type === 'image' && typeof field.value === 'string') {
    warnings.push(`LEGACY IMAGE: field "${fieldId}" uses string value format, will be rewritten on next save`);
  }
}

// --- Check 8: Field ID prefix soft check (strict only) ---
if (strict) {
  // Build prefix-to-block mapping from conventions
  for (const block of contentData.blocks) {
    const blockId = block.id;
    for (const field of block.fields) {
      // Check if field ID has a reasonable prefix for its block
      // This is a soft check, just a warning
      const fieldPrefix = field.id.split('-')[0];
      const blockType = block.type;
      // Only warn if it seems clearly misplaced
      // e.g., "partner-1-logo" inside block with type "testimonial"
      const prefixMap = {
        'hero-slider': ['slide'],
        'quick-actions': ['qa'],
        'tabs-section': ['tabs', 'tab'],
        'video-section': ['video'],
        'staedte-section': ['staedte', 'stadt'],
        'how-it-works': ['steps', 'step'],
        'info-tabs': ['info'],
        'testimonial': ['testimonial'],
        'partners': ['partners', 'partner'],
      };
      const expectedPrefixes = prefixMap[blockType] || [];
      if (expectedPrefixes.length > 0 && !expectedPrefixes.includes(fieldPrefix)) {
        warnings.push(`PREFIX MISMATCH: field "${field.id}" (prefix "${fieldPrefix}") inside block type "${blockType}" (expected: ${expectedPrefixes.join('/')})`);
      }
    }
  }
}

// --- Output ---
console.log(`\n=== Validate: ${pageName} ${strict ? '(STRICT)' : ''} ===\n`);
console.log(`JSON: ${jsonFields.size} fields across ${contentData.blocks.length} blocks`);
console.log(`HTML: ${htmlFields.size} unique data-field attributes, ${htmlBlockIds.length} blocks\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('All checks passed.\n');
} else {
  if (errors.length > 0) {
    console.log(`ERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`  [ERROR] ${e}`));
    console.log();
  }
  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  [WARN]  ${w}`));
    console.log();
  }
}

// Summary
const passed = errors.length === 0;
console.log(`Result: ${passed ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)`);
process.exit(passed ? 0 : 1);
