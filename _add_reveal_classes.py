"""
Add scroll-reveal classes to all HTML page sections.
- .reveal on every <section> EXCEPT hero sections
- .reveal-children on grid containers for staggered card animations
"""
import os
import re

ROOT = r"G:\01_OPUS\Projects\helferportal-prototypes"

HTML_FILES = [
    "index.html",
    "engagieren.html",
    "hilfe-finden.html",
    "fuer-kommunen.html",
    "ueber-uns.html",
    "kontakt.html",
    "muenchen.html",
]

# Sections that should NOT get .reveal (heroes load instantly)
SKIP_SECTIONS = ["hero", "hero-mini", "hero-city"]

# Grid containers that should get .reveal-children for staggered cards
STAGGER_GRIDS = [
    "quick-actions-grid",
    "staedte-grid",
    "steps-grid",
    "vorteile-grid",
    "support-grid",
    "partners-grid",
    "how-steps",
    "cta-grid",
]


def add_reveal_to_sections(html):
    """Add .reveal to <section class="..."> tags, skipping hero sections."""
    changes = 0

    def replace_section(match):
        nonlocal changes
        full = match.group(0)
        classes = match.group(1)

        # Skip if already has reveal
        if "reveal" in classes:
            return full

        # Skip hero sections
        for skip in SKIP_SECTIONS:
            if skip in classes.split():
                return full

        # Add reveal class
        changes += 1
        return full.replace(f'class="{classes}"', f'class="{classes} reveal"')

    html = re.sub(r'<section\s+class="([^"]*)"', replace_section, html)
    return html, changes


def add_reveal_children_to_grids(html):
    """Add .reveal-children to grid containers."""
    changes = 0

    for grid_class in STAGGER_GRIDS:
        # Match <div class="grid-class"> or <div class="grid-class other-classes">
        pattern = re.compile(rf'(<div\s+class="[^"]*\b{re.escape(grid_class)}\b[^"]*)"')
        for match in pattern.finditer(html):
            full = match.group(0)
            if "reveal-children" not in full:
                new = full.replace(f'{grid_class}', f'{grid_class} reveal-children')
                html = html.replace(full, new, 1)
                changes += 1

    return html, changes


def main():
    total_section_changes = 0
    total_grid_changes = 0

    for filename in HTML_FILES:
        filepath = os.path.join(ROOT, filename)

        if not os.path.exists(filepath):
            print(f"  [SKIP] {filename} not found")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        original = html

        html, sec_changes = add_reveal_to_sections(html)
        html, grid_changes = add_reveal_children_to_grids(html)

        if html != original:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  [OK] {filename}: {sec_changes} sections + {grid_changes} grids")
        else:
            print(f"  [--] {filename}: no changes needed")

        total_section_changes += sec_changes
        total_grid_changes += grid_changes

    print(f"\nTotal: {total_section_changes} sections + {total_grid_changes} grids = {total_section_changes + total_grid_changes} changes")


if __name__ == "__main__":
    main()
