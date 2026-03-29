/**
 * Shared configuration for Helferportal tools.
 * - .env loading
 * - Page registry (IDs + path helpers)
 * - Supabase config validation
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(TOOLS_DIR, '..');
const CONTENT_DIR = path.resolve(ROOT_DIR, 'content');

// --- .env loader ---
function loadEnv() {
  const envPath = path.resolve(TOOLS_DIR, '.env');
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
}

// --- Page registry ---
const PAGE_IDS = [
  'startseite', 'engagieren', 'kontakt',
  'ueber-uns', 'hilfe-finden', 'fuer-kommunen', 'muenchen',
  'presse', 'projekte'
];

/**
 * Build PAGE_MAP: { pageId: { html, json } }
 * startseite maps to index.html, others to {id}.html
 */
function getPageMap() {
  const map = {};
  for (const id of PAGE_IDS) {
    const htmlFile = id === 'startseite' ? 'index.html' : `${id}.html`;
    map[id] = {
      html: path.resolve(ROOT_DIR, htmlFile),
      json: path.resolve(CONTENT_DIR, `${id}.json`)
    };
  }
  return map;
}

// --- Supabase config ---
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('  ✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    console.error('    Set them as environment variables or in tools/.env');
    process.exit(1);
  }
  return { url, key };
}

module.exports = { loadEnv, PAGE_IDS, getPageMap, getSupabaseConfig, CONTENT_DIR, ROOT_DIR, TOOLS_DIR };
