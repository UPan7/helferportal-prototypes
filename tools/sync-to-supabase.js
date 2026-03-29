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
 *   node sync-to-supabase.js --dry-run                    # Show what would change (no writes)
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
const dryRun = args.includes('--dry-run');

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
  if (dryRun) console.log('  Mode: --dry-run (no writes)');
  else if (forceOverwrite) console.log('  Mode: --force (skip conflict checks)');
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
    let remote = null;
    try {
      remote = await fetchSupabasePage(url, key, pageId);

      if (remote) {
        const remoteEditedAt = remote.content?._meta?.lastEdited;
        if (remoteEditedAt && localEditedAt) {
          const remoteTime = new Date(remoteEditedAt).getTime();
          const localTime = new Date(localEditedAt).getTime();

          if (remoteTime > localTime) {
            const remoteBy = remote.content?._meta?.editedBy || 'unknown';
            console.log(`  ⚠ CONFLICT: "${pageId}"`);
            console.log(`    Supabase edited: ${remoteEditedAt} (by ${remoteBy})`);
            console.log(`    Local version:   ${localEditedAt}`);

            if (dryRun) {
              console.log(`    → Would skip (remote is newer)`);
              console.log('');
              skipped++;
              continue;
            }

            if (!forceOverwrite) {
              console.log(`    → Skipping to protect remote changes. Use --force to overwrite.`);
              console.log('');
              skipped++;
              continue;
            }

            console.log(`    ⚠ WARNING: --force used — overwriting remote changes by ${remoteBy}`);
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠ Could not check remote state for "${pageId}": ${err.message}`);
      if (dryRun) { skipped++; continue; }
      console.warn(`    → Proceeding with sync anyway.`);
    }

    if (dryRun) {
      console.log(`  ✓ Would sync "${pageId}" (no conflict)`);
      synced++;
      continue;
    }

    // --- Sync ---
    console.log(`  Syncing "${pageId}" to Supabase...`);

    content._meta = content._meta || {};
    content._meta.lastEdited = new Date().toISOString();

    try {
      let response;
      if (!remote) {
        // Page doesn't exist in Supabase yet — INSERT
        response = await fetch(
          `${url}/rest/v1/pages`,
          {
            method: 'POST',
            headers: { ...supabaseHeaders(key), 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              id: pageId,
              content: content,
              title: content.page?.title || pageId,
              url: content.page?.url || '/',
              updated_by: 'sync-script'
            })
          }
        );
      } else {
        // Page exists — UPDATE
        response = await fetch(
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
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      // Update local JSON with new lastEdited timestamp (sorted keys)
      fs.writeFileSync(jsonPath, JSON.stringify(sortKeys(content), null, 2), 'utf-8');

      if (!remote) {
        console.log(`    ✓ Inserted "${pageId}" into Supabase (new page)`);
      } else {
        console.log(`    ✓ Updated "${pageId}" in Supabase`);
      }
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
