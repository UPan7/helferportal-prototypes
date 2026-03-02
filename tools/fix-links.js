/**
 * fix-links.js
 *
 * Replaces absolute helferportal.kamanin.at URLs with root-relative paths
 * across all 7 HTML prototype files. Does NOT touch external links
 * (hilfe.helferportal.de, helfen.helferportal.de) or the CNAME file.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'index.html',
  'hilfe-finden.html',
  'engagieren.html',
  'fuer-kommunen.html',
  'ueber-uns.html',
  'kontakt.html',
  'muenchen.html',
];

// Order matters: more-specific (longer) patterns first, catch-all last.
const REPLACEMENTS = [
  ['https://www.helferportal.kamanin.at/hilfe-finden', '/hilfe-finden.html'],
  ['https://www.helferportal.kamanin.at/engagieren',   '/engagieren.html'],
  ['https://www.helferportal.kamanin.at/fuer-kommunen', '/fuer-kommunen.html'],
  ['https://www.helferportal.kamanin.at/ueber-uns',    '/ueber-uns.html'],
  ['https://www.helferportal.kamanin.at/kontakt',      '/kontakt.html'],
  ['https://www.helferportal.kamanin.at/muenchen',     '/muenchen.html'],
  ['https://www.helferportal.kamanin.at/',             '/'],
  ['https://www.helferportal.kamanin.at',              '/'],
];

let totalReplacements = 0;

for (const file of FILES) {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileCount = 0;

  for (const [search, replace] of REPLACEMENTS) {
    // Count occurrences before replacing
    let idx = 0;
    let count = 0;
    while ((idx = content.indexOf(search, idx)) !== -1) {
      count++;
      idx += search.length;
    }

    if (count > 0) {
      // Use split/join for literal (non-regex) global replacement
      content = content.split(search).join(replace);
      fileCount += count;
    }
  }

  if (fileCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  console.log('  ' + file + ': ' + fileCount + ' replacement(s)');
  totalReplacements += fileCount;
}

console.log('\nTotal: ' + totalReplacements + ' replacement(s) across ' + FILES.length + ' files.');
