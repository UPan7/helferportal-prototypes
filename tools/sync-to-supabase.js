#!/usr/bin/env node
/**
 * sync-to-supabase.js — Push local JSON content to Supabase pages table.
 *
 * Flow: content/*.json → Supabase REST API (PATCH)
 *
 * Usage:
 *   node sync-to-supabase.js                     # Sync all pages
 *   node sync-to-supabase.js --page fuer-kommunen # Sync one page
 *
 * Environment variables (or .env file):
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJhbG...
 */

const fs = require('fs');
const path = require('path');

// --- Load .env ---
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

// --- Page registry ---
const CONTENT_DIR = path.resolve(__dirname, '..', 'content');
const PAGE_IDS = [
  'startseite', 'engagieren', 'kontakt',
  'ueber-uns', 'hilfe-finden', 'fuer-kommunen', 'muenchen'
];

// --- CLI args ---
const args = process.argv.slice(2);
const pageArgIdx = args.indexOf('--page');
const targetPage = pageArgIdx >= 0 ? args[pageArgIdx + 1] : null;

// --- Main ---
async function main() {
  console.log('');
  console.log('  Helferportal Sync → Supabase');
  console.log('  ============================');
  console.log('');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('  ✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    console.error('    Set them as environment variables or in tools/.env');
    process.exit(1);
  }

  const pagesToSync = targetPage ? [targetPage] : PAGE_IDS;

  for (const pageId of pagesToSync) {
    const jsonPath = path.join(CONTENT_DIR, `${pageId}.json`);

    if (!fs.existsSync(jsonPath)) {
      console.warn(`  ⚠ JSON file missing: ${pageId}.json (skipping)`);
      continue;
    }

    console.log(`  Syncing "${pageId}" to Supabase...`);

    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Update meta
    content._meta = content._meta || {};
    content._meta.lastEdited = new Date().toISOString();

    try {
      const response = await fetch(
        `${url}/rest/v1/pages?id=eq.${pageId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            content: content,
            title: content.page?.title || pageId,
            url: content.page?.url || '/',
            updated_by: 'sync-script'
          })
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      console.log(`    ✓ Updated "${pageId}" in Supabase`);
    } catch (err) {
      console.error(`    ✗ Failed to sync "${pageId}": ${err.message}`);
    }
  }

  console.log('');
  console.log('  ✓ Sync complete!');
  console.log('');
}

main().catch(err => {
  console.error('  ✗ Sync failed:', err.message);
  process.exit(1);
});
