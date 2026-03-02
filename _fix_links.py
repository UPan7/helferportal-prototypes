"""Fix all links across all pages."""
import re, os

BASE = r"G:\01_OPUS\Projects\helferportal-prototypes"
DOMAIN = "https://www.helferportal.kamanin.at"

files = ["index.html", "engagieren.html", "hilfe-finden.html",
         "fuer-kommunen.html", "ueber-uns.html", "kontakt.html", "muenchen.html"]

total_changes = 0

for fname in files:
    path = os.path.join(BASE, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    changes = 0

    # === FIX 1: München city card in mega menu ===
    # Pattern: href="#" or href="/muenchen.html" or href=".../stadt/muenchen"
    # on city-card featured with München

    # Fix /muenchen.html → absolute URL (index.html mega menu + städte section)
    content = content.replace('href="/muenchen.html"', f'href="{DOMAIN}/muenchen"')

    # Fix stadt/muenchen → absolute URL (muenchen.html mega menu)
    content = content.replace(f'href="{DOMAIN}/stadt/muenchen"', f'href="{DOMAIN}/muenchen"')

    # Fix href="#" on München featured city card in mega menu
    # The pattern is: href="#" class="city-card featured" followed by München
    content = re.sub(
        r'href="#"(\s+class="city-card featured"><img[^>]*alt="München")',
        f'href="{DOMAIN}/muenchen"\\1',
        content
    )

    # === FIX 2: Hero slider buttons on index.html ===
    if fname == "index.html":
        # Slide 1 (blue/Hilfe): "Hilfe finden →"
        content = re.sub(
            r'(<a\s+href=")#(".*?class="slide-btn".*?>Hilfe finden)',
            f'\\1{DOMAIN}/hilfe-finden\\2',
            content
        )
        # Slide 2 (orange/Engagieren): "Jetzt engagieren →"
        content = re.sub(
            r'(<a\s+href=")#(".*?class="slide-btn".*?>Jetzt engagieren)',
            f'\\1{DOMAIN}/engagieren\\2',
            content
        )
        # Slide 3 (purple/Kommunen): "Mehr erfahren →"
        content = re.sub(
            r'(<a\s+href=")#(".*?class="slide-btn".*?>Mehr erfahren)',
            f'\\1{DOMAIN}/fuer-kommunen\\2',
            content
        )

        # === FIX 3: Quick action cards on index.html ===
        # "Unterstützung finden" → hilfe-finden
        content = re.sub(
            r'(<a\s+href=")#("\s+class="quick-action-card[^"]*"[^>]*>[\s\S]*?Unterstützung finden)',
            f'\\1{DOMAIN}/hilfe-finden\\2',
            content
        )
        # "Jetzt engagieren" quick action → engagieren
        content = re.sub(
            r'(<a\s+href=")#("\s+class="quick-action-card[^"]*"[^>]*>[\s\S]*?Jetzt engagieren)',
            f'\\1{DOMAIN}/engagieren\\2',
            content
        )
        # "Für Kommunen" quick action → fuer-kommunen
        content = re.sub(
            r'(<a\s+href=")#("\s+class="quick-action-card[^"]*"[^>]*>[\s\S]*?Für Kommunen)',
            f'\\1{DOMAIN}/fuer-kommunen\\2',
            content
        )
        # "So funktioniert's" quick action → ueber-uns
        content = re.sub(
            r'(<a\s+href=")#("\s+class="quick-action-card[^"]*"[^>]*>[\s\S]*?So funktioniert)',
            f'\\1{DOMAIN}/ueber-uns\\2',
            content
        )

        # === FIX 4: index.html footer logo ===
        content = re.sub(
            r'(<a\s+href=")#("\s+class="footer-logo")',
            f'\\1{DOMAIN}/\\2',
            content
        )

    # === FIX 5: Footer links - fix on ALL pages ===

    # Footer "Hilfe finden" → replace # with real URL
    content = re.sub(
        r'(<a\s+href=")#(">Hilfe finden</a>\s*</li>)',
        f'\\1{DOMAIN}/hilfe-finden\\2',
        content
    )
    # Footer "Engagieren"
    content = re.sub(
        r'(<a\s+href=")#(">Engagieren</a>\s*</li>)',
        f'\\1{DOMAIN}/engagieren\\2',
        content
    )
    # Footer "Für Kommunen"
    content = re.sub(
        r'(<a\s+href=")#(">Für Kommunen</a>\s*</li>)',
        f'\\1{DOMAIN}/fuer-kommunen\\2',
        content
    )
    # Footer "Für Organisationen"
    content = re.sub(
        r'(<a\s+href=")#(">Für Organisationen</a>\s*</li>)',
        f'\\1{DOMAIN}/fuer-kommunen#organisationen\\2',
        content
    )
    # Footer "Das Konzept"
    content = re.sub(
        r'(<a\s+href=")#(">Das Konzept</a>\s*</li>)',
        f'\\1{DOMAIN}/ueber-uns\\2',
        content
    )
    # Footer "So funktioniert's" → ueber-uns#geschichte
    content = re.sub(
        r'(<a\s+href=")#(">So funktioniert.s</a>\s*</li>)',
        f'\\1{DOMAIN}/ueber-uns#geschichte\\2',
        content
    )
    # Footer "Geschichte" (some pages use this text)
    content = re.sub(
        r'(<a\s+href=")#(">Geschichte</a>\s*</li>)',
        f'\\1{DOMAIN}/ueber-uns#geschichte\\2',
        content
    )
    # Footer "Unsere Partner" → ueber-uns#partner
    content = re.sub(
        r'(<a\s+href=")#(">Unsere Partner</a>\s*</li>)',
        f'\\1{DOMAIN}/ueber-uns#partner\\2',
        content
    )
    # Footer "Partner"
    content = re.sub(
        r'(<a\s+href=")#(">Partner</a>\s*</li>)',
        f'\\1{DOMAIN}/ueber-uns#partner\\2',
        content
    )
    # Footer "Kontakt aufnehmen"
    content = re.sub(
        r'(<a\s+href=")#(">Kontakt aufnehmen</a>\s*</li>)',
        f'\\1{DOMAIN}/kontakt\\2',
        content
    )
    # Footer "Demo vereinbaren"
    content = re.sub(
        r'(<a\s+href=")#(">Demo vereinbaren</a>\s*</li>)',
        f'\\1{DOMAIN}/kontakt\\2',
        content
    )
    # Footer "FAQ" → kontakt#faq
    content = re.sub(
        r'(<a\s+href=")#(">FAQ</a>\s*</li>)',
        f'\\1{DOMAIN}/kontakt#faq\\2',
        content
    )

    # === FIX 6: Mega menu quick links ===
    # "FAQ" quick link
    content = re.sub(
        r'(<a\s+href=")#("\s+class="quick-link"[^>]*><svg[^<]*</svg>FAQ)',
        f'\\1{DOMAIN}/kontakt#faq\\2',
        content
    )
    # "So funktioniert's" quick link
    content = re.sub(
        r'(<a\s+href=")#("\s+class="quick-link"[^>]*><svg[^<]*</svg>So funktioniert)',
        f'\\1{DOMAIN}/ueber-uns\\2',
        content
    )

    if content != original:
        changes = sum(1 for a, b in zip(content, original) if a != b)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        # Count actual href changes
        old_hrefs = re.findall(r'href="[^"]*"', original)
        new_hrefs = re.findall(r'href="[^"]*"', content)
        diff_count = sum(1 for a, b in zip(old_hrefs, new_hrefs) if a != b)
        print(f"  {fname}: {diff_count} href changes")
        total_changes += diff_count
    else:
        print(f"  {fname}: no changes")

print(f"\nTotal href changes: {total_changes}")
