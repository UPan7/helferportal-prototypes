#!/usr/bin/env node
/**
 * deploy.js — Pull content from Supabase and build HTML prototypes.
 *
 * Flow: Supabase → JSON files → build.js → updated HTML
 *
 * Usage:
 *   node deploy.js                      # Pull all pages & build
 *   node deploy.js --page startseite    # Pull & build one page
 *   node deploy.js --local              # Build from local JSON only (no Supabase)
 *
 * Environment variables (or .env file):
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJhbG...  (service_role key for server-side access)
 */

const fs = require('fs');
const path = require('path');

// --- Try to load .env ---
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// --- Page registry: maps page ID → HTML file + JSON file ---
const PAGE_MAP = {
  startseite: {
    html: path.resolve(__dirname, '..', 'index.html'),
    json: path.resolve(__dirname, '..', 'content', 'startseite.json')
  },
  engagieren: {
    html: path.resolve(__dirname, '..', 'engagieren.html'),
    json: path.resolve(__dirname, '..', 'content', 'engagieren.json')
  },
  kontakt: {
    html: path.resolve(__dirname, '..', 'kontakt.html'),
    json: path.resolve(__dirname, '..', 'content', 'kontakt.json')
  },
  'ueber-uns': {
    html: path.resolve(__dirname, '..', 'ueber-uns.html'),
    json: path.resolve(__dirname, '..', 'content', 'ueber-uns.json')
  }
};

// --- CLI args ---
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const pageArgIdx = args.indexOf('--page');
const targetPage = pageArgIdx >= 0 ? args[pageArgIdx + 1] : null;

// --- Main ---
async function main() {
  console.log('');
  console.log('  Helferportal Deploy');
  console.log('  ===================');
  console.log('');

  const pagesToBuild = targetPage ? [targetPage] : Object.keys(PAGE_MAP);

  if (!isLocal) {
    // Pull from Supabase
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      console.error('  ✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
      console.error('    Set them as environment variables or in tools/.env');
      console.error('    Or use --local to build from existing JSON files.');
      process.exit(1);
    }

    console.log(`  Mode: Supabase → JSON → HTML`);
    console.log(`  URL:  ${url}`);
    console.log('');

    for (const pageId of pagesToBuild) {
      const mapping = PAGE_MAP[pageId];
      if (!mapping) {
        console.warn(`  ⚠ Unknown page: ${pageId} (skipping)`);
        continue;
      }

      console.log(`  Pulling "${pageId}" from Supabase...`);

      try {
        // Fetch from Supabase REST API
        const response = await fetch(
          `${url}/rest/v1/pages?id=eq.${pageId}&select=*`,
          {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rows = await response.json();

        if (rows.length === 0) {
          console.warn(`  ⚠ Page "${pageId}" not found in Supabase (skipping)`);
          continue;
        }

        const content = rows[0].content;

        // Write JSON file
        const jsonDir = path.dirname(mapping.json);
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
        fs.writeFileSync(mapping.json, JSON.stringify(content, null, 2), 'utf-8');
        console.log(`    ✓ Saved ${path.basename(mapping.json)}`);

      } catch (err) {
        console.error(`    ✗ Failed to pull "${pageId}": ${err.message}`);
        continue;
      }
    }

    console.log('');
  } else {
    console.log('  Mode: Local JSON → HTML (no Supabase)');
    console.log('');
  }

  // Build HTML from JSON
  const cheerio = require('cheerio');
  const { applyField } = require('./lib/field-ops');

  for (const pageId of pagesToBuild) {
    const mapping = PAGE_MAP[pageId];
    if (!mapping) continue;

    if (!fs.existsSync(mapping.json)) {
      console.warn(`  ⚠ JSON file missing: ${path.basename(mapping.json)} (skipping build)`);
      continue;
    }

    if (!fs.existsSync(mapping.html)) {
      console.warn(`  ⚠ HTML file missing: ${path.basename(mapping.html)} (skipping build)`);
      continue;
    }

    console.log(`  Building ${path.basename(mapping.html)}...`);

    const content = JSON.parse(fs.readFileSync(mapping.json, 'utf-8'));
    const html = fs.readFileSync(mapping.html, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Build field lookup keyed by "blockId:fieldId" to handle
    // multiple blocks sharing the same field IDs (e.g. section-title)
    const fieldMap = new Map();
    for (const block of content.blocks) {
      for (const field of block.fields) {
        fieldMap.set(`${block.id}:${field.id}`, field);
      }
    }

    // Apply fields
    let updated = 0;

    $('[data-field]').each((_, el) => {
      const $el = $(el);
      const fieldId = $el.attr('data-field');
      const fieldType = $el.attr('data-field-type') || 'text';
      const blockId = $el.closest('[data-block-id]').attr('data-block-id');
      const field = blockId
        ? fieldMap.get(`${blockId}:${fieldId}`)
        : fieldMap.get(fieldId);  // fallback for unscoped elements
      if (!field) return;

      if (applyField($, $el, fieldType, field)) updated++;
    });

    fs.writeFileSync(mapping.html, $.html(), 'utf-8');
    console.log(`    ✓ Applied ${updated} field updates to ${path.basename(mapping.html)}`);
  }

  console.log('');
  console.log('  ✓ Deploy complete!');
  console.log('');
}

main().catch(err => {
  console.error('  ✗ Deploy failed:', err.message);
  process.exit(1);
});
