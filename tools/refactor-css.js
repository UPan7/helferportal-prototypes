#!/usr/bin/env node
/**
 * refactor-css.js
 *
 * Reads  assets/shared-styles.css  (7 page sections, lots of duplication)
 * Writes assets/shared-styles.css  (one shared section + page-specific leftovers)
 *
 * Strategy
 * --------
 * 1. Split file into 7 page sections using the  PAGE:  comment headers.
 * 2. For each section, parse every top-level CSS rule/block (handling nested @media).
 * 3. Classify each rule as "shared" or "page-specific" by inspecting the selector
 *    after stripping the  .page-*  prefix.
 * 4. Collect shared rules from the FIRST section that contains them (Engagieren).
 * 5. Write a new file:
 *      SECTION 1  –  GLOBAL  (:root, reset, utilities)
 *      SECTION 2  –  SHARED COMPONENTS  (de-duped, no .page-* prefix)
 *      SECTION 3+ –  PAGE-SPECIFIC  (only unique rules, keeping .page-* prefix)
 *      LAST       –  Mobile tabs picker (already global)
 */

const fs = require('fs');
const path = require('path');

// ─── paths ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'assets', 'shared-styles.css');

// ─── shared-selector patterns ────────────────────────────────────────────────
const SHARED_ROOTS = [
  // Header
  'header', 'header-inner', 'header-left', 'header-right', 'header-scrolled',
  'logo', 'logo-img', 'logo-icon', 'logo-text',
  'nav-main', 'nav-btn', 'nav-btn-text', 'nav-mehr', 'nav-mehr-btn',
  'btn-login', 'btn-search',
  // Mega menu (old style)
  'mega-menu', 'mega-menu-overlay', 'mega-menu-inner', 'mega-menu-content',
  'menu-column', 'menu-column-title', 'menu-link', 'menu-link-icon',
  'menu-city-card', 'menu-city-cards', 'menu-city-name', 'menu-city-tag',
  'mega-close', 'mega-menu-footer', 'mega-menu-footer-inner', 'quick-links', 'quick-link',
  // Mega menu (new style — ueber-uns, kontakt, muenchen, engagieren, startseite)
  'menu-column-header', 'menu-column-icon',
  'menu-items', 'menu-item', 'menu-item-icon', 'menu-item-content', 'menu-item-arrow',
  'menu-featured', 'menu-featured-badge', 'menu-featured-cta',
  'menu-social', 'social-link',
  // Mobile menu
  'mobile-menu', 'mobile-menu-btn', 'mobile-menu-overlay', 'mobile-nav',
  'mobile-nav-item', 'mobile-menu-header', 'mobile-menu-bottom',
  // Footer
  'footer', 'footer-inner', 'footer-top', 'footer-brand', 'footer-brand-text',
  'footer-col', 'footer-col-title', 'footer-link', 'footer-links',
  'footer-bottom', 'footer-legal', 'footer-legal-links',
  // Cities grid (appears in footer / mega-menu across pages)
  'cities-grid', 'cities-column', 'city-card', 'city-card-image',
  'city-card-content', 'city-card-name', 'city-card-status', 'all-cities-link',
  // Buttons
  'btn-primary', 'btn-secondary',
  // Hero mini + breadcrumb
  'hero-mini', 'hero-mini-content', 'breadcrumb',
  // FAQ
  'faq-section', 'faq-section-inner', 'faq-header', 'faq-list',
  'faq-item', 'faq-question', 'faq-answer', 'faq-grid', 'faq-column',
  // CTA
  'cta-section', 'cta-content', 'cta-inner',
  // Tabs
  'tabs-section', 'tabs-container', 'tabs-nav', 'tabs-nav-header', 'tabs-header',
  'tab-btn', 'tab-btn-content', 'tab-panel', 'tab-panel-header',
  'tab-option', 'tab-options', 'tabs-content', 'tab-icon', 'tab-cta',
  // Section header (reused)
  'section-header',
  // Testimonials (reused on startseite + muenchen)
  'testimonial-section', 'testimonial-card', 'testimonial-image',
  'testimonial-content', 'testimonial-quote', 'testimonial-author',
  'testimonial-author-info', 'testimonial-logo',
  // Partners (reused)
  'partners-section', 'partners-section-inner', 'partners-grid', 'partner-logo', 'partner-card',
  // Utilities
  'sr-only', 'highlight-brand', 'tabs-nav-label',
  'icon', 'icon-sm', 'icon-lg',
];

// ─── page class names ────────────────────────────────────────────────────────
const PAGE_CLASSES = [
  'page-engagieren', 'page-startseite', 'page-hilfe-finden',
  'page-fuer-kommunen', 'page-ueber-uns', 'page-kontakt', 'page-muenchen',
];

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Find matching close brace, handling nesting. */
function findMatchingBrace(text, openPos) {
  let depth = 1;
  for (let i = openPos + 1; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Parse a CSS string into an array of top-level blocks.
 * Each block = { selector, body, isMedia, leadingComment, children }
 */
function parseBlocks(css) {
  const blocks = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    // skip whitespace
    while (i < len && /\s/.test(css[i])) i++;
    if (i >= len) break;

    // capture leading comment(s)
    let leadingComment = '';
    while (i < len && css.slice(i, i + 2) === '/*') {
      const end = css.indexOf('*/', i);
      if (end === -1) { i = len; break; }
      leadingComment += css.slice(i, end + 2) + '\n';
      i = end + 2;
      while (i < len && /\s/.test(css[i])) i++;
    }
    if (i >= len) break;

    // find the opening brace
    const bracePos = css.indexOf('{', i);
    if (bracePos === -1) break;

    const selector = css.slice(i, bracePos).trim();
    const closePos = findMatchingBrace(css, bracePos);
    if (closePos === -1) break;

    const body = css.slice(bracePos + 1, closePos).trim();
    const isMedia = /^@media\b/.test(selector) || /^@keyframes\b/.test(selector);

    blocks.push({
      selector,
      body,
      isMedia,
      leadingComment: leadingComment.trim(),
      children: isMedia ? parseBlocks(body) : [],
    });

    i = closePos + 1;
  }
  return blocks;
}

/**
 * Strip .page-xxx prefix from a selector.
 * ".page-engagieren .header" -> ".header"
 * "body.page-engagieren" -> null  (body rule handled separately)
 * ".page-engagieren .nav-mehr-btn:hover, .page-engagieren .nav-mehr-btn.active"
 *   -> ".nav-mehr-btn:hover, .nav-mehr-btn.active"
 */
function stripPagePrefix(selector) {
  const parts = selector.split(',').map(s => s.trim());
  const stripped = parts.map(part => {
    for (const pc of PAGE_CLASSES) {
      // body.page-xxx
      if (part === `body.${pc}`) return null;

      // .page-xxx .rest  =>  .rest
      const prefixRe = new RegExp(`^\\.${pc}\\s+`);
      if (prefixRe.test(part)) {
        return part.replace(prefixRe, '');
      }
    }
    return part;
  }).filter(s => s !== null);

  return stripped.length ? stripped.join(', ') : null;
}

/**
 * Get the "root class" from a (stripped) selector.
 * ".header" -> "header"
 * ".nav-btn.active" -> "nav-btn"
 * ".hero-mini .breadcrumb a" -> "hero-mini"
 */
function getRootClass(selector) {
  const first = selector.split(',')[0].trim();
  const m = first.match(/^\.([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Check if a (stripped) selector is "shared" */
function isSharedSelector(strippedSel) {
  if (!strippedSel) return false;
  const parts = strippedSel.split(',').map(s => s.trim());
  return parts.every(part => {
    const rc = getRootClass(part);
    return rc && SHARED_ROOTS.includes(rc);
  });
}

/** Indent a body string to a given level */
function indentBody(body, spaces) {
  const pad = ' '.repeat(spaces);
  return body.split('\n').map(line => {
    const trimmed = line.trim();
    return trimmed ? pad + trimmed : '';
  }).filter(line => line !== '').join('\n');
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
function main() {
  let css = fs.readFileSync(CSS_PATH, 'utf8');
  const oldLines = css.split('\n').length;

  // Normalize line endings to \n
  css = css.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ─── 1. Find section boundaries ─────────────────────────────────────────
  // Match:  /* ===...===\n   PAGE: Xxx ...\n   ... \n   ===...=== */
  const pageSectionRe = /\/\* =+\n\s+PAGE: (.+)\n[^]*?=+ \*\//g;
  const sectionHeaders = [];
  let m;
  while ((m = pageSectionRe.exec(css)) !== null) {
    sectionHeaders.push({ name: m[1].trim(), index: m.index, end: m.index + m[0].length });
  }

  console.log(`Found ${sectionHeaders.length} page sections:`);
  sectionHeaders.forEach(h => console.log(`  - ${h.name} (at byte ${h.index})`));

  if (sectionHeaders.length === 0) {
    console.error('ERROR: No PAGE: sections found. Aborting.');
    process.exit(1);
  }

  // Find GLOBAL: Mobile Menu header
  const globalMobileRe = /\/\* =+\n\s+GLOBAL: Mobile Menu[^]*?=+ \*\//;
  const globalMobileMatch = globalMobileRe.exec(css);
  const globalMobileStart = globalMobileMatch ? globalMobileMatch.index : null;

  // Find MOBILE TAB PICKER header
  const mobileTabRe = /\/\* =+\n\s+MOBILE TAB PICKER[^]*?=+ \*\//;
  const mobileTabMatch = mobileTabRe.exec(css);
  const mobileTabStart = mobileTabMatch ? mobileTabMatch.index : null;

  console.log(`Global mobile menu at byte: ${globalMobileStart}`);
  console.log(`Mobile tab picker at byte: ${mobileTabStart}`);

  // ─── 2. Split into page sections ────────────────────────────────────────
  const pageSections = [];
  for (let i = 0; i < sectionHeaders.length; i++) {
    const start = sectionHeaders[i].end; // content starts AFTER the header comment
    let end;
    if (i + 1 < sectionHeaders.length) {
      end = sectionHeaders[i + 1].index;
    } else {
      // Last page section ends at global mobile menu section
      end = globalMobileStart || mobileTabStart || css.length;
    }
    pageSections.push({
      name: sectionHeaders[i].name,
      css: css.slice(start, end),
    });
  }

  // Global tail: everything from globalMobileStart to end of file
  const globalTailStart = globalMobileStart || mobileTabStart || css.length;
  const globalTail = css.slice(globalTailStart).trim();

  // ─── 3. Parse each section ──────────────────────────────────────────────
  const parsedSections = pageSections.map(section => {
    // Detect page class
    let pageClass = null;
    for (const pc of PAGE_CLASSES) {
      if (section.css.includes(pc)) { pageClass = pc; break; }
    }

    const blocks = parseBlocks(section.css);
    return { name: section.name, pageClass, blocks };
  });

  // ─── 4. Classify blocks ────────────────────────────────────────────────
  const sectionResults = parsedSections.map(section => {
    const shared = [];
    const specific = [];

    for (const block of section.blocks) {
      // Skip :root blocks
      if (block.selector === ':root') continue;

      // Skip * { margin:0 }
      if (block.selector === '*') continue;

      // Skip body.page-xxx
      const isBodyRule = PAGE_CLASSES.some(pc => block.selector === `body.${pc}`);
      if (isBodyRule) continue;

      // Skip global rules that appear in the first section's preamble
      // (html,body / h1..blockquote / .sr-only etc.) — these are only in Engagieren preamble
      if (!block.selector.includes('page-') && !/^@/.test(block.selector)) {
        // Global rule without page scope — skip (we handle these in the global section)
        continue;
      }

      if (block.isMedia && /^@media\b/.test(block.selector)) {
        const sharedChildren = [];
        const specificChildren = [];

        for (const child of block.children) {
          // Skip body.page-xxx inside @media
          const isChildBody = PAGE_CLASSES.some(pc => child.selector === `body.${pc}`);
          if (isChildBody) continue;

          // Skip global selectors (no .page-) inside @media
          if (!child.selector.includes('page-') && !/^@/.test(child.selector)) {
            continue;
          }

          const stripped = stripPagePrefix(child.selector);
          if (stripped && isSharedSelector(stripped)) {
            sharedChildren.push({ ...child, strippedSelector: stripped });
          } else if (stripped === null) {
            continue;
          } else {
            specificChildren.push(child);
          }
        }

        if (sharedChildren.length > 0) {
          shared.push({
            type: 'media',
            selector: block.selector,
            children: sharedChildren,
            leadingComment: block.leadingComment,
          });
        }
        if (specificChildren.length > 0) {
          specific.push({
            type: 'media',
            selector: block.selector,
            children: specificChildren,
            leadingComment: block.leadingComment,
          });
        }
      } else if (block.isMedia && /^@keyframes\b/.test(block.selector)) {
        shared.push({ type: 'keyframes', block });
      } else {
        // Regular rule with .page- prefix
        const stripped = stripPagePrefix(block.selector);
        if (stripped && isSharedSelector(stripped)) {
          shared.push({
            type: 'rule',
            strippedSelector: stripped,
            body: block.body,
            block,
            leadingComment: block.leadingComment,
          });
        } else {
          specific.push({
            type: 'rule',
            block,
          });
        }
      }
    }

    return { ...section, shared, specific };
  });

  // ─── 5. De-duplicate shared rules ──────────────────────────────────────
  const collectedShared = [];
  const collectedSharedKeys = new Set();
  const collectedMediaShared = new Map(); // media selector -> Map<stripped key -> { selector, body }>
  const collectedKeyframes = new Set();

  const stats = { shared: 0, pageSpecific: {} };

  for (const section of sectionResults) {
    for (const item of section.shared) {
      if (item.type === 'rule') {
        const key = item.strippedSelector;
        if (!collectedSharedKeys.has(key)) {
          collectedSharedKeys.add(key);
          let body = item.body;
          // Replace .nav-btn.active hardcoded color with var(--accent)
          if (/\.nav-btn\.active$/.test(key) && !/\s/.test(key)) {
            body = body.replace(/background:\s*var\(--[a-z]+-primary\)/g, 'background: var(--accent)');
            body = body.replace(/background:\s*var\(--gray-800\)/g, 'background: var(--accent)');
          }
          collectedShared.push({ key, selector: key, body, comment: item.leadingComment });
          stats.shared++;
        }
      } else if (item.type === 'media') {
        if (!collectedMediaShared.has(item.selector)) {
          collectedMediaShared.set(item.selector, new Map());
        }
        const mediaMap = collectedMediaShared.get(item.selector);
        for (const child of item.children) {
          const cKey = child.strippedSelector;
          if (!mediaMap.has(cKey)) {
            mediaMap.set(cKey, { selector: cKey, body: child.body });
            stats.shared++;
          }
        }
      } else if (item.type === 'keyframes') {
        const kfKey = item.block.selector;
        if (!collectedKeyframes.has(kfKey)) {
          collectedKeyframes.add(kfKey);
          collectedShared.push({
            key: kfKey,
            selector: kfKey,
            body: item.block.body,
            comment: item.block.leadingComment,
            isKeyframes: true,
          });
        }
      }
    }
  }

  // ─── 6. Build the output ────────────────────────────────────────────────
  let output = '';

  // === SECTION 1: GLOBAL ===
  output += `/* ================================================================
   HELFERPORTAL — SHARED STYLES (refactored)
   ================================================================ */


/* ================================================================
   SECTION 1: GLOBAL — variables, reset, utilities
   ================================================================ */

:root {
    /* Brand Colors */
    --orange-primary: #E65100;
    --orange-light: #F39014;
    --orange-lighter: #FFF3E0;
    --orange-dark: #E77900;

    --blue-primary: #1565C0;
    --blue-light: #3D87B8;
    --blue-lighter: #E8F2FA;
    --blue-dark: #154785;

    --purple-primary: #7B1FA2;
    --purple-light: #154785;
    --purple-lighter: #E8EEF7;
    --purple-dark: #081E52;

    --green-primary: #2E7D32;
    --green-light: #4CAF50;
    --green-lighter: #E8F5E9;
    --green-dark: #1B5E20;

    --yellow-primary: #F9B02C;
    --yellow-light: #FDD835;
    --yellow-lighter: #FFFDE7;

    /* Neutrals */
    --gray-50: #FAFBFC;
    --gray-100: #F2F4F6;
    --gray-200: #E5E8EB;
    --gray-300: #D1D5DB;
    --gray-400: #B0B6BE;
    --gray-500: #8B929B;
    --gray-600: #6B7280;
    --gray-700: #53585A;
    --gray-800: #3D4249;
    --gray-900: #1F2328;

    --white: #FFFFFF;
    --black: #000000;

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(31,35,40,0.08);
    --shadow-md: 0 4px 12px rgba(31,35,40,0.12);
    --shadow-lg: 0 8px 24px rgba(31,35,40,0.15);
    --shadow-xl: 0 16px 40px rgba(31,35,40,0.18);
    --shadow-2xl: 0 25px 50px -12px rgba(31,35,40,0.25);

    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --radius-full: 9999px;

    /* Spacing */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    --space-3xl: 64px;

    /* Typography */
    --font-display: 'Plus Jakarta Sans', sans-serif;
    --font-body: 'DM Sans', sans-serif;

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease-out;
    --transition-slow: 400ms ease-out;
}

/* Page accent colors — product decision per page */
.page-startseite    { --accent: var(--blue-primary); --accent-light: var(--blue-light); }
.page-hilfe-finden  { --accent: var(--blue-primary); --accent-light: var(--blue-light); }
.page-engagieren    { --accent: var(--orange-primary); --accent-light: var(--orange-light); }
.page-fuer-kommunen { --accent: var(--purple-primary); --accent-light: var(--purple-light); }
.page-ueber-uns     { --accent: var(--blue-primary); --accent-light: var(--blue-light); }
.page-kontakt       { --accent: var(--blue-primary); --accent-light: var(--blue-light); }
.page-muenchen      { --accent: var(--orange-primary); --accent-light: var(--orange-light); }

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Global: prevent horizontal overflow */
html, body {
    overflow-x: hidden;
}

/* Global: word wrapping for long German compound words */
h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button, blockquote {
    overflow-wrap: break-word;
    word-wrap: break-word;
}

/* Body base style (all pages) */
body[class*="page-"] {
    font-family: var(--font-body);
    color: var(--gray-900);
    background: var(--gray-50);
    line-height: 1.65;
    letter-spacing: 0.1px;
    -webkit-font-smoothing: antialiased;
}

/* Utility: visually hidden but accessible to screen readers */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Utility: tabs-nav-label */
.tabs-nav-label {
    margin: 0;
}

/* Utility: highlight-brand */
.highlight-brand {
    font-weight: 700;
    color: #00ACC1;
}

/* Mobile: enable automatic hyphenation for headings (lang="de") */
@media (max-width: 768px) {
    h1, h2 {
        hyphens: auto;
        -webkit-hyphens: auto;
    }
}

`;

  // === SECTION 2: SHARED COMPONENTS ===
  output += `
/* ================================================================
   SECTION 2: SHARED COMPONENTS — header, nav, mega-menu, footer,
   buttons, hero-mini, tabs, FAQ, CTA  (no .page-* prefix)
   ================================================================ */

`;

  // Write collected shared rules (skip utilities already in global)
  const globalUtilities = new Set(['.sr-only', '.tabs-nav-label', '.highlight-brand']);

  for (const item of collectedShared) {
    if (globalUtilities.has(item.key)) continue;

    if (item.isKeyframes) {
      output += `${item.selector} {\n${indentBody(item.body, 4)}\n}\n\n`;
    } else {
      if (item.comment) output += item.comment + '\n';
      output += `${item.selector} {\n${indentBody(item.body, 4)}\n}\n\n`;
    }
  }

  // Write collected shared @media blocks
  for (const [mediaSel, rulesMap] of collectedMediaShared) {
    output += `${mediaSel} {\n`;
    for (const [, rule] of rulesMap) {
      output += `    ${rule.selector} {\n${indentBody(rule.body, 8)}\n    }\n\n`;
    }
    output += `}\n\n`;
  }

  // === SECTIONS 3+: PAGE-SPECIFIC ===
  for (const section of sectionResults) {
    const specificRules = section.specific;

    // Count
    let ruleCount = 0;
    for (const item of specificRules) {
      if (item.type === 'media') {
        ruleCount += item.children.length;
      } else {
        ruleCount++;
      }
    }
    stats.pageSpecific[section.name] = ruleCount;

    if (ruleCount === 0) continue;

    output += `
/* ================================================================
   PAGE-SPECIFIC: ${section.name}
   Scoped to body.${section.pageClass}
   ================================================================ */

`;

    for (const item of specificRules) {
      if (item.type === 'rule') {
        if (item.block.leadingComment) output += item.block.leadingComment + '\n';
        output += `${item.block.selector} {\n${indentBody(item.block.body, 4)}\n}\n\n`;
      } else if (item.type === 'media') {
        if (item.leadingComment) output += item.leadingComment + '\n';
        output += `${item.selector} {\n`;
        for (const child of item.children) {
          if (child.leadingComment) output += `    ${child.leadingComment}\n`;
          output += `    ${child.selector} {\n${indentBody(child.body, 8)}\n    }\n\n`;
        }
        output += `}\n\n`;
      }
    }
  }

  // === LAST: Global mobile menu + mobile tab picker ===
  output += `\n${globalTail}\n`;

  // ─── 7. Write output ───────────────────────────────────────────────────
  fs.writeFileSync(CSS_PATH, output, 'utf8');
  const newLines = output.split('\n').length;

  // ─── 8. Print statistics ───────────────────────────────────────────────
  console.log('\n=== CSS Refactor Complete ===\n');
  console.log(`Old line count: ${oldLines}`);
  console.log(`New line count: ${newLines}`);
  console.log(`Lines saved:    ${oldLines - newLines} (${Math.round((1 - newLines / oldLines) * 100)}% reduction)\n`);
  console.log(`Shared rules extracted: ${stats.shared}`);
  console.log(`\nPage-specific rules remaining:`);
  for (const [page, count] of Object.entries(stats.pageSpecific)) {
    console.log(`  ${page.padEnd(25)} ${count} rules`);
  }
  console.log('');
}

main();
