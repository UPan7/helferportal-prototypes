#!/usr/bin/env node
/**
 * Download press article images from old WordPress site
 * and upload them to Supabase Storage.
 *
 * Usage: cd tools && node download-press-images.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env via shared config
const { loadEnv, getSupabaseConfig } = require('./lib/config');
loadEnv();
const { url: SUPABASE_URL, key: SUPABASE_KEY } = getSupabaseConfig();
const BUCKET = 'images';
const TEMP_DIR = path.join(__dirname, 'press-images');

const SOURCES = [
  'https://helferportal.de/wp-content/uploads/2025/09/20250911_195236-Kopie.jpg',
  'https://helferportal.de/wp-content/uploads/2025/07/Screenshot-2025-07-25-161507.png',
  'https://helferportal.de/wp-content/uploads/2025/06/IMG-20250626-WA0000.jpg',
  'https://helferportal.de/wp-content/uploads/2025/06/2025-06-18-assistenz-portal-northeim-tanja-holzapfel-wir-pflegen-ev.jpg',
  'https://helferportal.de/wp-content/uploads/2025/02/iStock-628754678-min.jpg',
  'https://helferportal.de/wp-content/uploads/2025/02/Screenshot-2025-02-11-110106.png',
  'https://helferportal.de/wp-content/uploads/2024/12/iStock-682884726_Terminfinder.png',
];

// Follow redirects (up to maxHops)
function download(url, maxHops = 5) {
  return new Promise((resolve, reject) => {
    if (maxHops <= 0) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (!loc) return reject(new Error('Redirect without Location header'));
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        return resolve(download(next, maxHops - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const contentType = res.headers['content-type'] || '';
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Upload buffer to Supabase Storage via REST API
function upload(storagePath, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/storage/v1/object/${BUCKET}/${storagePath}`, SUPABASE_URL);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-upsert': 'true',
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function extFromContentType(ct) {
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  return 'jpg'; // fallback
}

async function main() {
  // Ensure temp dir
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const publicUrls = [];

  for (let i = 0; i < SOURCES.length; i++) {
    const num = i + 1;
    const src = SOURCES[i];
    console.log(`\n[${num}/7] Downloading: ${src}`);

    const { buffer, contentType } = await download(src);
    const ext = extFromContentType(contentType);
    const filename = `press-${num}-image.${ext}`;

    // Save locally
    const localPath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    console.log(`  Saved ${localPath} (${(buffer.length / 1024).toFixed(0)} KB, ${contentType})`);

    // Upload to Supabase
    const storagePath = `presse/${filename}`;
    console.log(`  Uploading to ${storagePath}...`);
    await upload(storagePath, buffer, contentType);

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    publicUrls.push(publicUrl);
    console.log(`  OK: ${publicUrl}`);
  }

  console.log('\n=== All 7 public URLs ===');
  publicUrls.forEach((url, i) => console.log(`${i + 1}. ${url}`));
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
