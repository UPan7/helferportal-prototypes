#!/usr/bin/env node
/**
 * sync-to-supabase.js — Push local JSON content to Supabase pages table.
 *
 * Flow: content/*.json → Supabase REST API (PATCH)
 *
 * Before writing, checks if Supabase has newer edits than our local copy.
 * If so, skips the page unless --force is used.
 *
 * Usage:
 *   node sync-to-supabase.js                      # Sync all pages (with conflict check)
 *   node sync-to-supabase.js --page fuer-kommunen  # Sync one page
 *   node sync-to-supabase.js --page fuer-kommunen --force  # Overwrite even if Supabase is newer
 *
 * Environment variables (or .env file):
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJhbG...
 */

const fs = require('fs');
const path = require('path');
const { loadEnv, PAGE_IDS, CONTENT_DIR, getSupabaseConfig } = require('./lib/config');

loadEnv();

// --- CLI args ---
const args = process.argv.slice(2);
const pageArgIdx = args.indexOf('--page');
const targetPage = pageArgIdx >= 0 ? args[pageArgIdx + 1] : null;
const forceOverwrite = args.includes('--force');

// --- Helpers ---
function supabaseHeaders(key) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

async function fetchSupabasePage(url, key, pageId) {
  const res = await fetch(
    `${url}/rest/v1/pages?id=eq.${pageId}&select=updated_at,content`,
    { headers: supabaseHeaders(key) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

// --- Main ---
async function main() {
  console.log('');
  console.log('  Helferportal Sync → Supabase');
  console.log('  ============================');
  if (forceOverwrite) console.log('  Mode: --force (skip conflict checks)');
  console.log('');

  const { url, key } = getSupabaseConfig();

  const pagesToSync = targetPage ? [targetPage] : PAGE_IDS;
  let synced = 0;
  let skipped = 0;

  for (const pageId of pagesToSync) {
    const jsonPath = path.join(CONTENT_DIR, `${pageId}.json`);

    if (!fs.existsSync(jsonPath)) {
      console.warn(`  ⚠ JSON file missing: ${pageId}.json (skipping)`);
      skipped++;
      continue;
    }

    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const localEditedAt = content._meta?.lastEdited || content._meta?.extracted;

    // --- Conflict check ---
    if (!forceOverwrite) {
      try {
        const remote = await fetchSupabasePage(url, key, pageId);

        if (remote) {
          const remoteEditedAt = remote.content?._meta?.lastEdited;
          // Compare: if Supabase was edited AFTER our local version was created
          if (remoteEditedAt && localEditedAt) {
            const remoteTime = new Date(remoteEditedAt).getTime();
            const localTime = new Date(localEditedAt).getTime();

            if (remoteTime > localTime) {
              const remoteBy = remote.content?._meta?.editedBy || 'unknown';
              console.log(`  ⚠ CONFLICT: "${pageId}"`);
              console.log(`    Supabase edited: ${remoteEditedAt} (by ${remoteBy})`);
              console.log(`    Local version:   ${localEditedAt}`);
              console.log(`    → Skipping to protect remote changes. Use --force to overwrite.`);
              console.log('');
              skipped++;
              continue;
            }
          }
        }
      } catch (err) {
        console.warn(`  ⚠ Could not check remote state for "${pageId}": ${err.message}`);
        console.warn(`    → Proceeding with sync anyway.`);
      }
    }

    // --- Sync ---
    console.log(`  Syncing "${pageId}" to Supabase...`);

    content._meta = content._meta || {};
    content._meta.lastEdited = new Date().toISOString();

    try {
      const response = await fetch(
        `${url}/rest/v1/pages?id=eq.${pageId}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders(key), 'Prefer': 'return=minimal' },
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

      // Update local JSON with new lastEdited timestamp
      fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2), 'utf-8');

      console.log(`    ✓ Updated "${pageId}" in Supabase`);
      synced++;
    } catch (err) {
      console.error(`    ✗ Failed to sync "${pageId}": ${err.message}`);
    }
  }

  console.log('');
  console.log(`  Done: ${synced} synced, ${skipped} skipped`);
  console.log('');
}

main().catch(err => {
  console.error('  ✗ Sync failed:', err.message);
  process.exit(1);
});
