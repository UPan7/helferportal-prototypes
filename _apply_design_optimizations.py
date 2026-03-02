"""
Apply design optimizations to shared-styles.css:
1. Shadow depth increase (all 7 :root blocks)
2. Secondary button hover redesign (4 expanded scopes)
"""

CSS_PATH = r"G:\01_OPUS\Projects\helferportal-prototypes\assets\shared-styles.css"

def main():
    with open(CSS_PATH, "r", encoding="utf-8") as f:
        css = f.read()

    original = css

    # ============================================================
    # PHASE 1: SHADOW DEPTH INCREASE
    # ============================================================
    print("=" * 60)
    print("PHASE 1: Shadow depth increase")
    print("=" * 60)

    shadow_replacements = [
        ("--shadow-sm: 0 1px 3px rgba(31,35,40,0.06);",
         "--shadow-sm: 0 1px 3px rgba(31,35,40,0.08);"),
        ("--shadow-md: 0 4px 12px rgba(31,35,40,0.08);",
         "--shadow-md: 0 4px 12px rgba(31,35,40,0.12);"),
        ("--shadow-lg: 0 8px 24px rgba(31,35,40,0.10);",
         "--shadow-lg: 0 8px 24px rgba(31,35,40,0.15);"),
        ("--shadow-xl: 0 16px 40px rgba(31,35,40,0.12);",
         "--shadow-xl: 0 16px 40px rgba(31,35,40,0.18);"),
    ]

    shadow_changes = 0
    for old, new in shadow_replacements:
        count = css.count(old)
        if count > 0:
            css = css.replace(old, new)
            shadow_changes += count
            print(f"  [OK] {old[:40]}... -> ...{new[-15:]} ({count} occurrences)")
        else:
            print(f"  [MISS] {old[:50]}...")

    print(f"\n  Total shadow changes: {shadow_changes}")

    # ============================================================
    # PHASE 2: SECONDARY BUTTON HOVER REDESIGN
    # ============================================================
    print("\n" + "=" * 60)
    print("PHASE 2: Secondary button hover redesign")
    print("=" * 60)

    pages = ["engagieren", "startseite", "hilfe-finden", "fuer-kommunen"]
    btn_changes = 0

    for page in pages:
        prefix = f".page-{page}"

        # Change default text color: gray-700 -> gray-800
        old_default = f"{prefix} .btn-secondary {{\n            display: inline-flex;\n            align-items: center;\n            gap: var(--space-sm);\n            padding: 14px 28px;\n            border-radius: var(--radius-full);\n            font-weight: 600;\n            font-size: 15px;\n            letter-spacing: 0.3px;\n            text-decoration: none;\n            transition: all var(--transition-fast);\n            border: 2px solid var(--gray-300);\n            background: var(--white);\n            color: var(--gray-700);\n            cursor: pointer;\n        }}"

        new_default = f"{prefix} .btn-secondary {{\n            display: inline-flex;\n            align-items: center;\n            gap: var(--space-sm);\n            padding: 14px 28px;\n            border-radius: var(--radius-full);\n            font-weight: 600;\n            font-size: 15px;\n            letter-spacing: 0.3px;\n            text-decoration: none;\n            transition: all var(--transition-fast);\n            border: 2px solid var(--gray-300);\n            background: var(--white);\n            color: var(--gray-800);\n            cursor: pointer;\n        }}"

        if old_default in css:
            css = css.replace(old_default, new_default, 1)
            btn_changes += 1
            print(f"  [OK] {prefix} .btn-secondary default color")
        else:
            print(f"  [MISS] {prefix} .btn-secondary default")

        # Change hover: gray -> orange accent
        old_hover = f"{prefix} .btn-secondary:hover {{\n            border-color: var(--gray-400);\n            background: var(--gray-50);\n        }}"

        new_hover = f"{prefix} .btn-secondary:hover {{\n            border-color: var(--orange-primary);\n            color: var(--orange-primary);\n            background: var(--orange-lighter);\n        }}"

        if old_hover in css:
            css = css.replace(old_hover, new_hover, 1)
            btn_changes += 1
            print(f"  [OK] {prefix} .btn-secondary:hover")
        else:
            print(f"  [MISS] {prefix} .btn-secondary:hover")

    print(f"\n  Total button changes: {btn_changes}")

    # ============================================================
    # WRITE OUTPUT
    # ============================================================
    if css != original:
        with open(CSS_PATH, "w", encoding="utf-8") as f:
            f.write(css)

        total = shadow_changes + btn_changes
        print(f"\n{'=' * 60}")
        print(f"DONE: {total} total changes written to shared-styles.css")
        print(f"{'=' * 60}")
    else:
        print("\nNo changes made.")


if __name__ == "__main__":
    main()
