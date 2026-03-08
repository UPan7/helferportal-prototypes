#!/usr/bin/env node
/**
 * test-roundtrip.js — Verify that extract→build round-trip preserves content.
 *
 * For each page: extract HTML → temp JSON, then compare with existing JSON.
 * Also checks that build.js can apply JSON back to HTML without errors.
 *
 * Usage:
 *   node test-roundtrip.js              # Test all pages
 *   node test-roundtrip.js startseite   # Test one page
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PAGE_IDS, ROOT_DIR, CONTENT_DIR } = require('./lib/config');

const targetPage = process.argv[2];
const pagesToTest = targetPage ? [targetPage] : PAGE_IDS;

const TOOLS_DIR = path.resolve(__dirname);
const TMP_DIR = path.join(TOOLS_DIR, '.test-tmp');

// Setup temp dir
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

let passed = 0;
let failed = 0;
const failures = [];

console.log('');
console.log('  Round-trip Test');
console.log('  ===============');
console.log('');

for (const pageId of pagesToTest) {
  const htmlFile = pageId === 'startseite' ? 'index.html' : `${pageId}.html`;
  const htmlPath = path.join(ROOT_DIR, htmlFile);
  const jsonPath = path.join(CONTENT_DIR, `${pageId}.json`);

  if (!fs.existsSync(htmlPath)) {
    console.log(`  SKIP  ${pageId} — HTML not found`);
    continue;
  }
  if (!fs.existsSync(jsonPath)) {
    console.log(`  SKIP  ${pageId} — JSON not found`);
    continue;
  }

  const errors = [];

  // --- Test 1: Extract HTML → temp JSON ---
  const tmpJsonPath = path.join(TMP_DIR, `${pageId}.json`);
  try {
    execSync(`node "${path.join(TOOLS_DIR, 'extract.js')}" "${path.relative(TOOLS_DIR, htmlPath)}" "${path.relative(TOOLS_DIR, tmpJsonPath)}"`, {
      cwd: TOOLS_DIR,
      stdio: 'pipe'
    });
  } catch (err) {
    errors.push(`extract.js failed: ${err.stderr?.toString().trim() || err.message}`);
  }

  // --- Test 2: Compare field values ---
  if (fs.existsSync(tmpJsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const extracted = JSON.parse(fs.readFileSync(tmpJsonPath, 'utf-8'));

    // Compare block counts
    if (existing.blocks.length !== extracted.blocks.length) {
      errors.push(`Block count mismatch: JSON has ${existing.blocks.length}, extracted has ${extracted.blocks.length}`);
    }

    // Compare field counts per block
    const existingBlockMap = new Map(existing.blocks.map(b => [b.id, b]));
    for (const block of extracted.blocks) {
      const existingBlock = existingBlockMap.get(block.id);
      if (!existingBlock) {
        errors.push(`Block "${block.id}" (${block.type}) found in extract but not in JSON`);
        continue;
      }

      if (existingBlock.fields.length !== block.fields.length) {
        errors.push(`Block "${block.id}": field count ${existingBlock.fields.length} (JSON) vs ${block.fields.length} (extracted)`);
      }

      // Check for empty values (info only, not failures)
      let emptyCount = 0;
      for (const field of block.fields) {
        const val = field.value;
        if (val === undefined || val === null || val === '') emptyCount++;
      }
      if (emptyCount > 0) {
        console.log(`        (info: ${emptyCount} empty fields in block "${block.id}")`);
      }
    }
  }

  // --- Test 3: Build JSON → temp HTML (non-destructive) ---
  const tmpHtmlPath = path.join(TMP_DIR, htmlFile);
  fs.copyFileSync(htmlPath, tmpHtmlPath);
  try {
    execSync(`node "${path.join(TOOLS_DIR, 'build.js')}" "${path.relative(TOOLS_DIR, jsonPath)}" "${path.relative(TOOLS_DIR, tmpHtmlPath)}"`, {
      cwd: TOOLS_DIR,
      stdio: 'pipe'
    });
  } catch (err) {
    errors.push(`build.js failed: ${err.stderr?.toString().trim() || err.message}`);
  }

  // --- Test 4: Validate (run validate.js) ---
  try {
    execSync(`node "${path.join(TOOLS_DIR, 'validate.js')}" ${pageId}`, {
      cwd: TOOLS_DIR,
      stdio: 'pipe'
    });
  } catch (err) {
    const stderr = err.stderr?.toString().trim() || '';
    const stdout = err.stdout?.toString().trim() || '';
    errors.push(`validate.js failed: ${stderr || stdout || err.message}`);
  }

  // --- Report ---
  if (errors.length === 0) {
    console.log(`  PASS  ${pageId}`);
    passed++;
  } else {
    console.log(`  FAIL  ${pageId} (${errors.length} issues)`);
    for (const e of errors) {
      console.log(`        - ${e}`);
    }
    failures.push({ page: pageId, errors });
    failed++;
  }
}

// Cleanup
fs.rmSync(TMP_DIR, { recursive: true, force: true });

// Summary
console.log('');
console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} pages`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
