"""
Apply client feedback changes to shared-styles.css:
1. Footer: gray-900 background -> blue-light (#3D87B8)
2. Muenchen: green -> navy (#0B286D)
"""
import re

CSS_PATH = r"G:\01_OPUS\Projects\helferportal-prototypes\assets\shared-styles.css"

def main():
    with open(CSS_PATH, "r", encoding="utf-8") as f:
        css = f.read()

    original = css

    # ============================================================
    # PHASE 1: FOOTER - change background and text colors
    # ============================================================
    print("=" * 60)
    print("PHASE 1: Footer background and text colors")
    print("=" * 60)

    footer_changes = 0

    # All 7 page scopes
    pages = [
        "engagieren", "startseite", "hilfe-finden",
        "fuer-kommunen", "ueber-uns", "kontakt", "muenchen"
    ]

    for page in pages:
        prefix = f".page-{page}"

        # 1. Footer background: var(--gray-900) -> var(--blue-light)
        old = f"{prefix} .footer {{ background: var(--gray-900);"
        new = f"{prefix} .footer {{ background: var(--blue-light);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer background")
        else:
            # Try expanded format
            old_exp = f"{prefix} .footer {{\n            background: var(--gray-900);"
            new_exp = f"{prefix} .footer {{\n            background: var(--blue-light);"
            if old_exp in css:
                css = css.replace(old_exp, new_exp, 1)
                footer_changes += 1
                print(f"  [OK] {prefix} .footer background (expanded)")
            else:
                print(f"  [MISS] {prefix} .footer background")

        # 2. Footer-top border: var(--gray-700) -> rgba(255,255,255,0.2)
        old = f"{prefix} .footer-top {{ display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: var(--space-2xl); padding-bottom: var(--space-2xl); border-bottom: 1px solid var(--gray-700);"
        new = f"{prefix} .footer-top {{ display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: var(--space-2xl); padding-bottom: var(--space-2xl); border-bottom: 1px solid rgba(255,255,255,0.2);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer-top border (compact)")
        else:
            # Try expanded: just replace the border-bottom line
            old_exp = f"1px solid var(--gray-700);"
            # This is too generic - need context. Use line-by-line approach for expanded
            pass

        # 3. Footer-brand p color: var(--gray-400) -> rgba(255,255,255,0.8)
        old = f"{prefix} .footer-brand p {{ color: var(--gray-400);"
        new = f"{prefix} .footer-brand p {{ color: rgba(255,255,255,0.8);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer-brand p color")
        else:
            old_exp = f"{prefix} .footer-brand p {{\n            color: var(--gray-400);"
            new_exp = f"{prefix} .footer-brand p {{\n            color: rgba(255,255,255,0.8);"
            if old_exp in css:
                css = css.replace(old_exp, new_exp, 1)
                footer_changes += 1
                print(f"  [OK] {prefix} .footer-brand p color (expanded)")
            else:
                print(f"  [MISS] {prefix} .footer-brand p color")

        # 4. Footer-col a color: var(--gray-400) -> rgba(255,255,255,0.8)
        old = f"{prefix} .footer-col a {{ color: var(--gray-400);"
        new = f"{prefix} .footer-col a {{ color: rgba(255,255,255,0.8);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer-col a color")
        else:
            old_exp = f"{prefix} .footer-col a {{\n            color: var(--gray-400);"
            new_exp = f"{prefix} .footer-col a {{\n            color: rgba(255,255,255,0.8);"
            if old_exp in css:
                css = css.replace(old_exp, new_exp, 1)
                footer_changes += 1
                print(f"  [OK] {prefix} .footer-col a color (expanded)")
            else:
                print(f"  [MISS] {prefix} .footer-col a color")

        # 5. Footer-bottom p color: var(--gray-500) -> rgba(255,255,255,0.65)
        old = f"{prefix} .footer-bottom p {{ color: var(--gray-500);"
        new = f"{prefix} .footer-bottom p {{ color: rgba(255,255,255,0.65);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer-bottom p color")
        else:
            old_exp = f"{prefix} .footer-bottom p {{\n            color: var(--gray-500);"
            new_exp = f"{prefix} .footer-bottom p {{\n            color: rgba(255,255,255,0.65);"
            if old_exp in css:
                css = css.replace(old_exp, new_exp, 1)
                footer_changes += 1
                print(f"  [OK] {prefix} .footer-bottom p color (expanded)")
            else:
                print(f"  [MISS] {prefix} .footer-bottom p color")

        # 6. Footer-legal a color: var(--gray-500) -> rgba(255,255,255,0.65)
        old = f"{prefix} .footer-legal a {{ color: var(--gray-500);"
        new = f"{prefix} .footer-legal a {{ color: rgba(255,255,255,0.65);"
        if old in css:
            css = css.replace(old, new, 1)
            footer_changes += 1
            print(f"  [OK] {prefix} .footer-legal a color")
        else:
            old_exp = f"{prefix} .footer-legal a {{\n            color: var(--gray-500);"
            new_exp = f"{prefix} .footer-legal a {{\n            color: rgba(255,255,255,0.65);"
            if old_exp in css:
                css = css.replace(old_exp, new_exp, 1)
                footer_changes += 1
                print(f"  [OK] {prefix} .footer-legal a color (expanded)")
            else:
                print(f"  [MISS] {prefix} .footer-legal a color")

    # Handle expanded footer-top border separately (line-by-line for expanded scopes)
    lines = css.split("\n")
    expanded_pages = ["engagieren", "startseite", "hilfe-finden", "fuer-kommunen"]
    border_fixes = 0
    for i, line in enumerate(lines):
        for page in expanded_pages:
            if f".page-{page} .footer-top" in line and "border-bottom" not in line:
                # Check next few lines for border-bottom
                for j in range(i+1, min(i+8, len(lines))):
                    if "border-bottom: 1px solid var(--gray-700)" in lines[j]:
                        lines[j] = lines[j].replace(
                            "border-bottom: 1px solid var(--gray-700)",
                            "border-bottom: 1px solid rgba(255,255,255,0.2)"
                        )
                        border_fixes += 1
                        print(f"  [OK] .page-{page} .footer-top border (expanded)")
                        break

    if border_fixes > 0:
        css = "\n".join(lines)
        footer_changes += border_fixes

    print(f"\n  Total footer changes: {footer_changes}")

    # ============================================================
    # PHASE 2: MUENCHEN - green -> navy
    # ============================================================
    print("\n" + "=" * 60)
    print("PHASE 2: Muenchen green -> navy")
    print("=" * 60)

    muenchen_changes = 0

    # Color replacements within .page-muenchen scope only
    # We'll work line-by-line to ensure we only change muenchen lines
    lines = css.split("\n")
    for i, line in enumerate(lines):
        if ".page-muenchen " not in line:
            continue

        original_line = line

        # Replace green tokens with navy hex values
        line = line.replace("var(--green-primary)", "#0B286D")
        line = line.replace("var(--green-light)", "#2563EB")
        line = line.replace("var(--green-lighter)", "#E8EEF8")
        line = line.replace("var(--green-dark)", "#071D4F")

        # Replace rgba green values (hero overlay)
        line = line.replace("rgba(46,125,50,0.9)", "rgba(11,40,109,0.9)")
        line = line.replace("rgba(27,94,32,0.85)", "rgba(7,29,79,0.85)")

        if line != original_line:
            lines[i] = line
            muenchen_changes += 1
            # Show which selector changed
            selector = line.strip()[:80]
            print(f"  [OK] Line {i+1}: {selector}...")

    css = "\n".join(lines)
    print(f"\n  Total Muenchen changes: {muenchen_changes}")

    # ============================================================
    # WRITE OUTPUT
    # ============================================================
    if css != original:
        with open(CSS_PATH, "w", encoding="utf-8") as f:
            f.write(css)

        total = footer_changes + muenchen_changes
        print(f"\n{'=' * 60}")
        print(f"DONE: {total} total changes written to shared-styles.css")
        print(f"{'=' * 60}")
    else:
        print("\nNo changes made.")


if __name__ == "__main__":
    main()
