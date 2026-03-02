/**
 * fix-header-footer.js
 *
 * Standardizes headers, mobile menus, mega menus, and footers
 * across all 7 HTML files using index.html as the canonical source.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const PAGE_CONFIG = {
  "index.html":        { logo: "logo-orange-quer.png", activeNav: null },
  "hilfe-finden.html": { logo: "logo-blue-quer.png",   activeNav: "/hilfe-finden.html" },
  "engagieren.html":   { logo: "logo-orange-quer.png", activeNav: "/engagieren.html" },
  "fuer-kommunen.html":{ logo: "logo-blue-quer.png",   activeNav: null },
  "ueber-uns.html":    { logo: "logo-blue-quer.png",   activeNav: null },
  "kontakt.html":      { logo: "logo-blue-quer.png",   activeNav: null },
  "muenchen.html":     { logo: "logo-orange-quer.png", activeNav: null },
};

const indexPath = path.join(ROOT, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

// Extract header
const headerRe = /<header class="header">[\s\S]*?<\/header>/;
const headerMatch = indexHtml.match(headerRe);
if (!headerMatch) { console.error("ERROR: header not found"); process.exit(1); }
const canonicalHeader = headerMatch[0];

// Extract mobile menu + overlay
const mobileRe = /<div class="mobile-menu" id="mobileMenu">[\s\S]*?<div class="mobile-menu-overlay" id="mobileMenuOverlay"><\/div>/;
const mobileMenuMatch = indexHtml.match(mobileRe);
if (!mobileMenuMatch) { console.error("ERROR: mobile menu not found"); process.exit(1); }
const canonicalMobileMenu = mobileMenuMatch[0];

// Extract mega menu
const megaStart = indexHtml.indexOf("<div class=\"mega-menu-overlay\"");
if (megaStart === -1) { console.error("ERROR: mega-menu-overlay not found"); process.exit(1); }
const afterOverlay = indexHtml.substring(megaStart);
const sectionSearchRe = /<section[\s>]|<!-- ===/;
const firstSectionAfterMega = afterOverlay.search(sectionSearchRe);
if (firstSectionAfterMega === -1) { console.error("ERROR: section after mega menu not found"); process.exit(1); }
const canonicalMegaMenu = afterOverlay.substring(0, firstSectionAfterMega).trimEnd();

// Extract footer
const footerRe = /<footer class="footer">[\s\S]*?<\/footer>/;
const footerMatch = indexHtml.match(footerRe);
if (!footerMatch) { console.error("ERROR: footer not found"); process.exit(1); }
const canonicalFooter = footerMatch[0];

console.log("=== Canonical templates extracted from index.html ===");
console.log("  Header: " + canonicalHeader.length + " chars");
console.log("  Mobile menu: " + canonicalMobileMenu.length + " chars");
console.log("  Mega menu: " + canonicalMegaMenu.length + " chars");
console.log("  Footer: " + canonicalFooter.length + " chars");

// Process each page
let totalReplacements = 0;

for (const [filename, config] of Object.entries(PAGE_CONFIG)) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.log("\nWARNING: " + filename + " not found, skipping.");
    continue;
  }

  console.log("\n--- Processing " + filename + " ---");
  let html = fs.readFileSync(filePath, "utf8");
  let replacements = 0;

  // Customize header
  let customHeader = canonicalHeader;
  const logoRe = /logo-(?:orange|blue|white)-quer\.png/g;
  customHeader = customHeader.replace(logoRe, config.logo);
  const navBtnRe = /class="nav-btn(?:\s+active(?:-(?:blue|orange))?)"/g;
  customHeader = customHeader.replace(navBtnRe, "class=\"nav-btn\"");
  if (config.activeNav) {
    const esc = config.activeNav.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const activeRe = new RegExp("(href=\"" + esc + "\"\\s+class=\"nav-btn)(\")");
    customHeader = customHeader.replace(activeRe, "$1 active$2");
  }

  // Customize mobile menu
  let customMobileMenu = canonicalMobileMenu;
  customMobileMenu = customMobileMenu.replace(/logo-(?:orange|blue|white)-quer\.png/g, config.logo);

  // Replace header
  if (headerRe.test(html)) {
    html = html.replace(headerRe, customHeader);
    replacements++;
    console.log("  [OK] Header replaced");
  } else {
    console.log("  [SKIP] Header not found");
  }

  // Replace mobile menu
  let mobileReplaced = false;
  const mobileCommentRe = /<!-- MOBILE MENU -->[\s\S]*?<div class="mobile-menu-overlay" id="mobileMenuOverlay"><\/div>/;
  if (mobileCommentRe.test(html)) {
    html = html.replace(mobileCommentRe, "<!-- MOBILE MENU -->\n    " + customMobileMenu);
    replacements++;
    mobileReplaced = true;
    console.log("  [OK] Mobile menu replaced (with comment)");
  }
  if (!mobileReplaced) {
    if (mobileRe.test(html)) {
      html = html.replace(mobileRe, customMobileMenu);
      replacements++;
      console.log("  [OK] Mobile menu replaced (without comment)");
    } else {
      console.log("  [SKIP] Mobile menu not found");
    }
  }

  // Replace mega menu
  const megaIdx = html.indexOf("<div class=\"mega-menu-overlay\"");
  if (megaIdx !== -1) {
    const afterMega = html.substring(megaIdx);
    const endIdx = afterMega.search(sectionSearchRe);
    if (endIdx !== -1) {
      const before = html.substring(0, megaIdx);
      const after = html.substring(megaIdx + endIdx);
      html = before + canonicalMegaMenu + "\n\n\n    " + after;
      replacements++;
      console.log("  [OK] Mega menu replaced");
    } else {
      console.log("  [SKIP] Could not find section boundary after mega menu");
    }
  } else {
    console.log("  [SKIP] Mega menu overlay not found");
  }

  // Replace footer
  if (footerRe.test(html)) {
    html = html.replace(footerRe, canonicalFooter);
    replacements++;
    console.log("  [OK] Footer replaced");
  } else {
    console.log("  [SKIP] Footer not found");
  }

  fs.writeFileSync(filePath, html, "utf8");
  totalReplacements += replacements;
  console.log("  Total replacements for " + filename + ": " + replacements);
}

console.log("\n=== Done! Total replacements: " + totalReplacements + " ===");

// Verification
console.log("\n=== Verification ===");
let issueCount = 0;

for (const [filename, config] of Object.entries(PAGE_CONFIG)) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) continue;
  const html = fs.readFileSync(filePath, "utf8");

  const oldActive = html.match(/active-(?:blue|orange)/g);
  if (oldActive) {
    console.log("  WARNING: " + filename + " still has " + oldActive.length + " active-blue/active-orange");
    issueCount++;
  }

  const fc = html.match(footerRe);
  if (fc && fc[0].includes("Geschichte")) {
    console.log("  WARNING: " + filename + " footer still contains Geschichte");
    issueCount++;
  }

  const hc = html.match(headerRe);
  if (hc && !hc[0].includes(config.logo)) {
    console.log("  WARNING: " + filename + " header wrong logo, expected " + config.logo);
    issueCount++;
  }

  if (config.activeNav) {
    if (hc && !hc[0].includes("nav-btn active")) {
      console.log("  WARNING: " + filename + " header missing active nav button");
      issueCount++;
    }
  }
}

if (issueCount === 0) {
  console.log("  All checks passed!");
} else {
  console.log("  " + issueCount + " issue(s) found.");
}
