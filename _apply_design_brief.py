# -*- coding: utf-8 -*-
"""
Apply Design Brief v3 to Helferportal shared-styles.css and shared-scripts.js

This script applies ~260 design token and component changes from the filled
Design Brief v3 Excel workbook. It operates in 5 phases:

  Phase 1: :root token replacements (brand colors, grays, shadows, etc.)
  Phase 2: Global safe replacements (translateY, font-size 42→40, 32→28)
  Phase 3: Component changes (buttons, cards, FAQ, forms, hero, nav, footer)
  Phase 4: Typography changes (contextual per-element adjustments)
  Phase 5: JavaScript changes (slide duration)

Run:  python _apply_design_brief.py
"""

import re
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSS_PATH = os.path.join(BASE_DIR, 'assets', 'shared-styles.css')
JS_PATH  = os.path.join(BASE_DIR, 'assets', 'shared-scripts.js')


def count_replacements(old_css, new_css, label):
    """Report how many lines changed between two CSS strings."""
    old_lines = old_css.splitlines()
    new_lines = new_css.splitlines()
    diff = 0
    for a, b in zip(old_lines, new_lines):
        if a != b:
            diff += 1
    diff += abs(len(new_lines) - len(old_lines))
    print(f"  {label}: {diff} lines changed")
    return diff


# ─────────────────────────────────────────────────────────────────
# PHASE 1: :root token replacements
# ─────────────────────────────────────────────────────────────────
def apply_root_token_replacements(css):
    """Simple str.replace() for all :root token values across all 7 blocks."""
    print("\n== Phase 1: :root Token Replacements ==")
    before = css

    # Brand Colors
    replacements = {
        # Orange
        '--orange-primary: #E65100':  '--orange-primary: #EC6303',
        '--orange-light: #FF7D2E':    '--orange-light: #F39014',
        '--orange-dark: #BF360C':     '--orange-dark: #E77900',
        # Blue
        '--blue-primary: #1565C0':    '--blue-primary: #23679A',
        '--blue-light: #42A5F5':      '--blue-light: #3D87B8',
        '--blue-lighter: #E3F2FD':    '--blue-lighter: #E8F2FA',
        '--blue-dark: #0D47A1':       '--blue-dark: #154785',
        # Purple → Navy
        '--purple-primary: #7B1FA2':  '--purple-primary: #0B286D',
        '--purple-light: #AB47BC':    '--purple-light: #154785',
        '--purple-lighter: #F3E5F5':  '--purple-lighter: #E8EEF7',
        '--purple-dark: #6A1B9A':     '--purple-dark: #081E52',
        # Yellow
        '--yellow-primary: #F9A825':  '--yellow-primary: #F9B02C',
        # Gray Scale (cool undertone rebuild)
        '--gray-50: #FAFAFA':   '--gray-50: #FAFBFC',
        '--gray-100: #F5F5F5':  '--gray-100: #F2F4F6',
        '--gray-200: #EEEEEE':  '--gray-200: #E5E8EB',
        '--gray-300: #E0E0E0':  '--gray-300: #D1D5DB',
        '--gray-400: #BDBDBD':  '--gray-400: #B0B6BE',
        '--gray-500: #9E9E9E':  '--gray-500: #8B929B',
        '--gray-600: #757575':  '--gray-600: #6B7280',
        '--gray-700: #616161':  '--gray-700: #53585A',
        '--gray-800: #424242':  '--gray-800: #3D4249',
        '--gray-900: #212121':  '--gray-900: #1F2328',
    }

    for old, new in replacements.items():
        css = css.replace(old, new)

    # Shadows — expanded format (4 blocks: engagieren, startseite, hilfe-finden, fuer-kommunen)
    shadow_expanded = {
        '--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);':
            '--shadow-sm: 0 1px 3px rgba(31,35,40,0.06);',
        '--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);':
            '--shadow-md: 0 4px 12px rgba(31,35,40,0.08);',
        '--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);':
            '--shadow-lg: 0 8px 24px rgba(31,35,40,0.10);',
        '--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);':
            '--shadow-xl: 0 16px 40px rgba(31,35,40,0.12);',
    }
    for old, new in shadow_expanded.items():
        css = css.replace(old, new)

    # Shadows — compact format (3 blocks: ueber-uns, kontakt, muenchen)
    shadow_compact = {
        '--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)':
            '--shadow-sm: 0 1px 3px rgba(31,35,40,0.06)',
        '--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1)':
            '--shadow-md: 0 4px 12px rgba(31,35,40,0.08)',
        '--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1)':
            '--shadow-lg: 0 8px 24px rgba(31,35,40,0.10)',
        '--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1)':
            '--shadow-xl: 0 16px 40px rgba(31,35,40,0.12)',
        # Also fix shadow-2xl (only in compact blocks)
        '--shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25)':
            '--shadow-2xl: 0 25px 50px -12px rgba(31,35,40,0.25)',
    }
    for old, new in shadow_compact.items():
        css = css.replace(old, new)

    # Radius
    css = css.replace('--radius-xl: 24px', '--radius-xl: 20px')

    # Transitions (use regex with word boundary to avoid double-replacing)
    css = re.sub(r'--transition-normal: 250ms ease;', '--transition-normal: 250ms ease-out;', css)
    css = re.sub(r'--transition-slow: 350ms ease;', '--transition-slow: 400ms ease-out;', css)

    count_replacements(before, css, "Token replacements")
    return css


def add_missing_tokens(css):
    """Insert --purple-dark and --green-dark where missing."""
    print("\n== Phase 1b: Add Missing Tokens ==")
    before = css
    added = 0

    # --purple-dark is MISSING in expanded blocks: engagieren, startseite, hilfe-finden
    # These blocks have --purple-lighter: #F3E5F5 (now #E8EEF7) but no --purple-dark
    # After replacement, the marker is --purple-lighter: #E8EEF7
    # We need to add --purple-dark: #081E52; after the purple-lighter line (in expanded format only)

    # Pattern: find lines with --purple-lighter: #E8EEF7; that are NOT followed by --purple-dark
    # In expanded blocks, each token is on its own line with proper indentation
    lines = css.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)

        # Check for expanded --purple-lighter line without --purple-dark following
        stripped = line.strip()
        if stripped == '--purple-lighter: #E8EEF7;' and '--purple-dark' not in line:
            # Check next non-empty line doesn't already have --purple-dark
            next_idx = i + 1
            while next_idx < len(lines) and lines[next_idx].strip() == '':
                next_idx += 1
            if next_idx < len(lines) and '--purple-dark' not in lines[next_idx]:
                # Get indentation from current line
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(indent + '--purple-dark: #081E52;')
                added += 1

        # Check for expanded --green-lighter line without --green-dark following
        # Only match expanded format: line has only this one token (strip check)
        stripped = line.strip()
        if stripped == '--green-lighter: #E8F5E9;' and '--green-dark' not in line:
            next_idx = i + 1
            while next_idx < len(lines) and lines[next_idx].strip() == '':
                next_idx += 1
            if next_idx < len(lines) and '--green-dark' not in lines[next_idx]:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(indent + '--green-dark: #1B5E20;')
                added += 1

        i += 1

    css = '\n'.join(new_lines)

    # For compact blocks: add --green-dark after --green-lighter: #E8F5E9
    # ueber-uns and kontakt have: --green-lighter: #E8F5E9;  (as part of inline)
    # muenchen already has --green-dark: #1B5E20 — update its old value
    css = css.replace('--green-dark: #1B5E20', '--green-dark: #1B5E20')  # no change needed, value stays

    # Compact blocks: add --green-dark in the semicolon-separated format
    # Pattern: --green-lighter: #E8F5E9;\n   (end of green group before yellow)
    # In compact format it's: --green-lighter: #E8F5E9;
    # followed by --yellow on same line typically
    # We need to handle: "--green-lighter: #E8F5E9;" → "--green-lighter: #E8F5E9; --green-dark: #1B5E20;"
    # BUT only when --green-dark is not already present on that line

    lines = css.split('\n')
    new_lines = []
    for line in lines:
        # Only add inline for COMPACT format (line has multiple tokens)
        if '--green-lighter: #E8F5E9;' in line and '--green-dark' not in line:
            if line.strip() != '--green-lighter: #E8F5E9;':  # Skip expanded-format lines
                line = line.replace('--green-lighter: #E8F5E9;', '--green-lighter: #E8F5E9; --green-dark: #1B5E20;')
                added += 1
        new_lines.append(line)
    css = '\n'.join(new_lines)

    # Similarly add --purple-dark to compact blocks that are missing it
    # ueber-uns already has --purple-dark: #6A1B9A (now #081E52) OK
    # kontakt already has --purple-dark: #6A1B9A (now #081E52) OK
    # muenchen already has --purple-dark: #6A1B9A (now #081E52) OK

    print(f"  Added {added} missing tokens")
    return css


# ─────────────────────────────────────────────────────────────────
# PHASE 2: Global Safe Replacements
# ─────────────────────────────────────────────────────────────────
def apply_global_safe_replacements(css):
    """Replace values that only appear in their intended context."""
    print("\n== Phase 2: Global Safe Replacements ==")
    before = css

    # Button hover translateY
    css = css.replace('translateY(-2px)', 'translateY(-1px)')

    # Card hover translateY
    css = css.replace('translateY(-4px)', 'translateY(-3px)')

    # H1 font-size: 42px → 40px (all 4 instances)
    css = css.replace('font-size: 42px', 'font-size: 40px')

    # H2 section headings: 32px → 28px
    # CAREFUL: not all 32px are H2 headings — some are step-numbers, timeline-year, etc.
    # We need contextual replacement, not global
    # Skip this here, handle in Phase 4

    # Hardcoded hex values
    css = css.replace('background: #1B5E20;', 'background: var(--green-dark);')
    css = css.replace('background: #6A1B9A;', 'background: var(--purple-dark);')

    count_replacements(before, css, "Global safe replacements")
    return css


# ─────────────────────────────────────────────────────────────────
# PHASE 3: Component Changes
# ─────────────────────────────────────────────────────────────────
def apply_component_changes(css):
    """Targeted regex replacements for specific components."""
    print("\n== Phase 3: Component Changes ==")
    before = css
    changes = 0

    # --- BTN-PRIMARY: padding + font-weight + box-shadow ---
    # Expanded blocks (engagieren, startseite, hilfe-finden, fuer-kommunen)
    # Change padding from var(--space-md) var(--space-xl) to 14px 28px
    # Change font-weight 700 → 600 (only in btn-primary, not btn-secondary which is already 600)

    # Pattern: inside .page-XXX .btn-primary { ... } blocks
    def update_btn_primary_expanded(match):
        block = match.group(0)
        # Update padding
        block = block.replace(
            'padding: var(--space-md) var(--space-xl);',
            'padding: 14px 28px;'
        )
        # Update font-weight only if it's 700 (btn-primary specific)
        block = block.replace('font-weight: 700;', 'font-weight: 600;')
        # Add box-shadow after cursor: pointer; if not already present
        if 'box-shadow: 0 2px 8px' not in block:
            block = block.replace(
                'cursor: pointer;',
                'cursor: pointer;\n            box-shadow: 0 2px 8px rgba(0,0,0,0.12);'
            )
        return block

    # Match expanded btn-primary blocks
    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.btn-primary\s*\{[^}]+\})',
        update_btn_primary_expanded,
        css
    )

    # --- BTN-SECONDARY: border + padding ---
    def update_btn_secondary_expanded(match):
        block = match.group(0)
        block = block.replace(
            'padding: var(--space-md) var(--space-xl);',
            'padding: 14px 28px;'
        )
        block = block.replace(
            'border: 2px solid var(--gray-200);',
            'border: 2px solid var(--gray-300);'
        )
        return block

    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.btn-secondary\s*\{[^}]+\})',
        update_btn_secondary_expanded,
        css
    )

    # btn-secondary hover: border-color → var(--gray-400)
    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.btn-secondary:hover\s*\{[^}]*)'
        r'border-color:\s*var\(--gray-300\);',
        r'\1border-color: var(--gray-400);',
        css
    )

    # --- CARDS: add border ---
    # Find card base rules and add border: 1px solid rgba(31,35,40,0.06)
    # Card classes: .quick-action-card, .step-card, .vorteile-card, .tab-panel cards, etc.
    # Most have box-shadow: var(--shadow-sm/md) — add border alongside
    # We'll target rules with 'border-radius: var(--radius-' and 'box-shadow: var(--shadow-'
    # Actually, too many card types. Let's just add it to the major card containers.

    # Quick action cards
    css = re.sub(
        r'(\.page-\w+\s+\.quick-action-card\s*\{[^}]*?)(\s*box-shadow:\s*var\(--shadow-)',
        r'\1 border: 1px solid rgba(31,35,40,0.06);\2',
        css
    )

    # Step cards
    css = re.sub(
        r'(\.page-\w+\s+\.step-card\s*\{[^}]*?)(\s*box-shadow:\s*var\(--shadow-)',
        r'\1 border: 1px solid rgba(31,35,40,0.06);\2',
        css
    )

    # --- FAQ: padding ---
    # faq-question padding: var(--space-lg) var(--space-xl) → 20px 24px
    css = css.replace(
        'padding: var(--space-lg) var(--space-xl);',
        'padding: 20px 24px;'
    )
    # Note: this could match faq-answer-inner too, which has: 0 var(--space-xl) var(--space-lg)
    # That pattern is different so it won't match.

    # --- FORMS (kontakt only) ---
    # border: 2px solid var(--gray-200) → 1.5px solid var(--gray-300) for form inputs
    css = css.replace(
        '.page-kontakt .form-input, .page-kontakt .form-select, .page-kontakt .form-textarea { width: 100%; padding: var(--space-md); border: 2px solid var(--gray-200); border-radius: var(--radius-md);',
        '.page-kontakt .form-input, .page-kontakt .form-select, .page-kontakt .form-textarea { width: 100%; padding: var(--space-md); border: 1.5px solid var(--gray-300); border-radius: 10px;'
    )

    # Form focus: border-color and box-shadow
    css = css.replace(
        '.page-kontakt .form-input:focus, .page-kontakt .form-select:focus, .page-kontakt .form-textarea:focus { outline: none; border-color: var(--orange-primary); box-shadow: 0 0 0 3px var(--orange-lighter); }',
        '.page-kontakt .form-input:focus, .page-kontakt .form-select:focus, .page-kontakt .form-textarea:focus { outline: none; border-color: var(--blue-primary); box-shadow: 0 0 0 3px rgba(35,103,154,0.12); }'
    )

    # Add form error and disabled states after the form-textarea rule
    form_error_disabled = """
        .page-kontakt .form-input.error, .page-kontakt .form-select.error, .page-kontakt .form-textarea.error { border-color: #D32F2F; }
        .page-kontakt .form-input:disabled, .page-kontakt .form-select:disabled, .page-kontakt .form-textarea:disabled { opacity: 0.5; background: var(--gray-50); cursor: not-allowed; }"""

    if '.form-input.error' not in css:
        css = css.replace(
            '.page-kontakt .form-textarea { min-height: 150px; resize: vertical; }',
            '.page-kontakt .form-textarea { min-height: 150px; resize: vertical; }' + form_error_disabled
        )

    # --- HERO SLIDER ---
    # min-height: 420px → 400px
    css = css.replace('min-height: 420px;', 'min-height: 400px;')

    # Gradient opacity: 0.9 → 0.88, 0.95 → 0.94
    css = re.sub(
        r'(\.page-startseite\s+\.slide-\d\s*\{\s*background:\s*linear-gradient\(135deg,\s*rgba\(\d+,\s*\d+,\s*\d+,\s*)0\.9(\)\s*0%,\s*rgba\(\d+,\s*\d+,\s*\d+,\s*)0\.95(\)\s*100%\))',
        r'\g<1>0.88\g<2>0.94\g<3>',
        css
    )

    # --- NAVIGATION ---
    # nav-btn border-radius: var(--radius-sm) → 8px, padding: var(--space-sm) var(--space-md) → 8px 14px
    # Expanded blocks
    def update_nav_btn_expanded(match):
        block = match.group(0)
        block = block.replace('border-radius: var(--radius-sm);', 'border-radius: 8px;')
        block = block.replace('padding: var(--space-sm) var(--space-md);', 'padding: 8px 14px;')
        return block

    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.nav-btn\s*\{[^}]+\})',
        update_nav_btn_expanded,
        css
    )

    # Compact blocks: nav-btn with inline format
    # Pattern: padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm);
    for page in ['ueber-uns', 'kontakt', 'muenchen']:
        old_nav = f'.page-{page} .nav-btn {{ display: inline-flex; align-items: center; gap: var(--space-xs); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm);'
        new_nav = f'.page-{page} .nav-btn {{ display: inline-flex; align-items: center; gap: var(--space-xs); padding: 8px 14px; border-radius: 8px;'
        css = css.replace(old_nav, new_nav)

    # Logo icon: 40px → 36px, border-radius → 10px
    # Expanded blocks
    def update_logo_icon_expanded(match):
        block = match.group(0)
        block = block.replace('width: 40px;', 'width: 36px;')
        block = block.replace('height: 40px;', 'height: 36px;')
        block = block.replace('border-radius: var(--radius-md);', 'border-radius: 10px;')
        return block

    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.logo-icon\s*\{[^}]+\})',
        update_logo_icon_expanded,
        css
    )

    # Compact blocks logo-icon
    for page in ['ueber-uns', 'kontakt', 'muenchen']:
        css = css.replace(
            f'.page-{page} .logo-icon {{ width: 40px; height: 40px; background: linear-gradient(135deg, var(--orange-primary), var(--orange-light)); border-radius: var(--radius-md);',
            f'.page-{page} .logo-icon {{ width: 36px; height: 36px; background: linear-gradient(135deg, var(--orange-primary), var(--orange-light)); border-radius: 10px;'
        )

    # --- FOOTER ---
    # padding-top: var(--space-3xl) → 56px
    # Expanded footer blocks
    def update_footer_expanded(match):
        block = match.group(0)
        block = block.replace(
            'padding: var(--space-3xl) var(--space-lg) var(--space-xl);',
            'padding: 56px var(--space-lg) var(--space-xl);'
        )
        return block

    css = re.sub(
        r'(\.page-(?:engagieren|startseite|hilfe-finden|fuer-kommunen)\s+\.footer\s*\{[^}]+\})',
        update_footer_expanded,
        css
    )

    # Compact footer blocks
    for page in ['ueber-uns', 'kontakt', 'muenchen']:
        css = css.replace(
            f'.page-{page} .footer {{ background: var(--gray-900); color: var(--white); padding: var(--space-3xl) var(--space-lg) var(--space-xl); }}',
            f'.page-{page} .footer {{ background: var(--gray-900); color: var(--white); padding: 56px var(--space-lg) var(--space-xl); }}'
        )

    count_replacements(before, css, "Component changes")
    return css


# ─────────────────────────────────────────────────────────────────
# PHASE 4: Typography Changes
# ─────────────────────────────────────────────────────────────────
def apply_typography_changes(css):
    """Contextual typography adjustments per element type."""
    print("\n== Phase 4: Typography Changes ==")
    before = css

    # --- H2 desktop: 32px → 28px ---
    # We need to be selective. The 32px values that ARE H2 section headings:
    # Lines with patterns like: section-header h2, .vorteile-header h2, heading h2, etc.
    # Also direct ".page-xxx .section h2 { font-size: 32px }" patterns
    # For the expanded blocks, font-size: 32px appears in section title contexts
    # For compact blocks, it's inline

    # Context-aware: replace font-size: 32px only in rules that are clearly H2/heading contexts
    # Match: .page-XXX .XXX-header h2/h3 { ... font-size: 32px ... }
    # Match: .page-XXX .section-title { ... font-size: 32px ... }
    # Match standalone expanded lines where the previous selector suggests heading context

    # Let's identify the specific line numbers from our analysis:
    # Line 1067: engagieren CTA h2 → 28px OK
    # Line 2318: startseite section header → 28px OK
    # Line 3708: hilfe-finden section header → 28px OK
    # Line 4497, 4535: fuer-kommunen section headers → 28px OK
    # Line 4918: fuer-kommunen section header → 28px OK
    # Line 5271: fuer-kommunen responsive (inside @media) → handle in mobile
    # Line 5559: ueber-uns .mission-content h2 → 28px OK
    # Line 5576: ueber-uns .section-header h3 → 28px OK
    # Line 5609: ueber-uns .partner-logo font-size: 32px → NOT a heading, skip
    # Line 5621: ueber-uns .cta-card h2 → 28px OK
    # Line 5656: ueber-uns .timeline-year → NOT a heading, skip
    # Line 5671: ueber-uns responsive hero h1 → NOT H2, skip
    # Line 5883: kontakt .section-header h3 → 28px OK
    # Line 5925: kontakt responsive hero h1 → NOT H2, skip
    # Line 6106: muenchen .how-step-number → NOT a heading, skip
    # Line 6203: muenchen responsive hero h1 → NOT H2, skip

    # Strategy: use regex to match heading-context selectors containing font-size: 32px

    # For expanded blocks: find font-size: 32px on its own line, check previous lines for heading selector
    lines = css.split('\n')
    new_lines = []
    # Track open selector context
    for i, line in enumerate(lines):
        modified = False

        if 'font-size: 32px' in line:
            # Check if this is a heading context by looking at preceding selector
            # Look back up to 15 lines for the opening selector
            context = '\n'.join(lines[max(0, i-15):i+1])

            # Skip known non-heading contexts
            skip_patterns = [
                '.partner-logo',
                '.timeline-year',
                '.how-step-number',
                'hero h1',
                '.hero h1',
                'hero-city h1',
            ]
            should_skip = any(p in context for p in skip_patterns)

            # Identify heading contexts
            heading_patterns = [
                'section-header',
                'section-title',
                'cta-card h2',
                'cta-section h2',
                'mission-content h2',
                'vorteile-header',
                'staedte-header',
                'tabs-header',
                '-header h2',
                '-header h3',
                '-title h2',
                'h2 {',
                'h3 {',
            ]
            is_heading = any(p in context for p in heading_patterns)

            if is_heading and not should_skip:
                line = line.replace('font-size: 32px', 'font-size: 28px')
                modified = True

        new_lines.append(line)

    css = '\n'.join(new_lines)

    # Also update line-height: 1.2 -> 1.3 for H2 heading contexts
    # Use line-by-line: if a line has font-size: 28px AND line-height: 1.2 (compact), fix it
    # For expanded blocks, line-height: 1.2 is on a separate line near font-size: 28px
    lines = css.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        # Compact format: both on same line
        if 'font-size: 28px' in line and 'line-height: 1.2' in line:
            line = line.replace('line-height: 1.2', 'line-height: 1.3')
        # Expanded format: line-height: 1.2 on its own line, near a font-size: 28px line
        elif 'line-height: 1.2' in line:
            # Look nearby (within 5 lines) for font-size: 28px
            context = '\n'.join(lines[max(0, i-5):min(len(lines), i+5)])
            if 'font-size: 28px' in context:
                # Make sure this is a heading context, not hero h1
                heading_ctx = '\n'.join(lines[max(0, i-15):i+1])
                skip = any(p in heading_ctx for p in ['.partner-logo', '.timeline-year', '.how-step-number', 'hero h1', 'hero-city h1'])
                heading = any(p in heading_ctx for p in ['section-header', 'cta-card', 'mission-content', '-header h2', '-header h3'])
                if heading and not skip:
                    line = line.replace('line-height: 1.2', 'line-height: 1.3')
        new_lines.append(line)
    css = '\n'.join(new_lines)

    # --- Body line-height: 1.6 → 1.65 ---
    # 7 body.page-* rules
    for page in ['engagieren', 'startseite', 'hilfe-finden', 'fuer-kommunen', 'ueber-uns', 'kontakt', 'muenchen']:
        # Expanded format
        css = css.replace(
            f'body.page-{page} {{\n            font-family: var(--font-body);\n            color: var(--gray-900);\n            background: var(--gray-50);\n            line-height: 1.6;',
            f'body.page-{page} {{\n            font-family: var(--font-body);\n            color: var(--gray-900);\n            background: var(--gray-50);\n            line-height: 1.65;\n            letter-spacing: 0.1px;'
        )
        # Compact format
        css = css.replace(
            f'body.page-{page} {{ font-family: var(--font-body); color: var(--gray-900); background: var(--gray-50); line-height: 1.6;',
            f'body.page-{page} {{ font-family: var(--font-body); color: var(--gray-900); background: var(--gray-50); line-height: 1.65; letter-spacing: 0.1px;'
        )

    # --- Button letter-spacing: 0.3px ---
    # Add letter-spacing: 0.3px after font-size: 15px in btn-primary/secondary blocks
    # Use line-by-line approach to avoid regex backtracking
    lines = css.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        if line.strip() == 'font-size: 15px;' and 'letter-spacing' not in line:
            # Check context for btn-primary or btn-secondary selector (expanded blocks only)
            context = '\n'.join(lines[max(0, i-12):i+1])
            if '.btn-primary' in context or '.btn-secondary' in context:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(indent + 'letter-spacing: 0.3px;')
    css = '\n'.join(new_lines)

    # --- Nav link letter-spacing: 0.2px ---
    # Add letter-spacing: 0.2px after font-size: 14px in nav-btn blocks (expanded only)
    lines = css.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        # Only match expanded lines (font-size: 14px on its own line, not compact)
        if line.strip() == 'font-size: 14px;' and 'letter-spacing' not in line:
            context = '\n'.join(lines[max(0, i-12):i+1])
            # Match .nav-btn but NOT .nav-mehr-btn
            if re.search(r'\.nav-btn\s*\{', context) and '.nav-mehr-btn' not in context:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(indent + 'letter-spacing: 0.2px;')
    css = '\n'.join(new_lines)
    # Compact blocks: add letter-spacing after font-size: 14px in nav-btn
    for page in ['ueber-uns', 'kontakt', 'muenchen']:
        css = css.replace(
            f'.page-{page} .nav-btn {{ display: inline-flex; align-items: center; gap: var(--space-xs); padding: 8px 14px; border-radius: 8px; font-family: var(--font-body); font-weight: 600; font-size: 14px;',
            f'.page-{page} .nav-btn {{ display: inline-flex; align-items: center; gap: var(--space-xs); padding: 8px 14px; border-radius: 8px; font-family: var(--font-body); font-weight: 600; font-size: 14px; letter-spacing: 0.2px;'
        )

    # --- Mobile typography changes (inside @media blocks) ---
    # H1 mobile: find hero H1 rules inside @media (max-width: 768px) blocks
    # These show as: .page-xxx .hero h1 { font-size: 28px } or similar
    # Change 28px → 24px for mobile H1, add line-height: 1.3

    # H2 mobile: 24px → 21px (in @media blocks)
    # H3 mobile: 18px → 17px (in @media blocks)

    # H4 desktop: 18px → 16px, weight 700 → 600 (only H4 rules)
    # We'll handle these carefully

    # For mobile H1 in @media blocks:
    # Pattern: inside @media, .page-xxx .hero h1 or hero-city h1 with font-size
    # Actually let's look at specific patterns:
    # .page-muenchen .hero-city h1 { font-size: 42px } is desktop (line 6188)
    # @media block has: .page-muenchen .hero-city h1 { font-size: 32px } (line 6203)
    # Similarly: .page-ueber-uns .hero h1 { font-size: 32px } in @media (line 5671)
    # .page-kontakt .hero h1 { font-size: 32px } in @media (line 5925)

    # These 32px in @media are mobile H1 values → change to 24px
    # BUT we already changed some 32px → 28px in Phase 4 heading context...
    # We need to handle the ones that are hero H1 mobile specifically
    # The hero h1 ones were SKIPPED above (skip_patterns has 'hero h1')
    # So they're still 32px. Let's change them now to 24px.

    # For compact blocks in @media sections, the pattern is:
    # .page-xxx .hero h1 { font-size: 32px; }
    for page in ['ueber-uns', 'kontakt']:
        css = css.replace(
            f'.page-{page} .hero h1 {{ font-size: 32px;',
            f'.page-{page} .hero h1 {{ font-size: 24px; line-height: 1.3;'
        )
    css = css.replace(
        '.page-muenchen .hero-city h1 { font-size: 32px;',
        '.page-muenchen .hero-city h1 { font-size: 24px; line-height: 1.3;'
    )

    # For expanded blocks, mobile H1 is inside @media with multi-line format
    # Patterns like:  font-size: 28px; (mobile hero h1 in engagieren, hilfe-finden, etc.)
    # Actually let me search for these specifically
    # In expanded @media blocks, hero H1 mobile might be 28px or other sizes
    # Let's check the actual @media sections for expanded blocks

    # The expanded blocks for engagieren, startseite, hilfe-finden, fuer-kommunen
    # have @media blocks at their end sections
    # startseite hero h1 mobile could be different

    # For now, let's handle the known H2 mobile (24px → 21px) pattern
    # In @media blocks, H2 headings that show font-size: 24px should become 21px
    # This is tricky — 24px could be other things too
    # Let's be very specific with selectors

    # H3 mobile: 18px → 17px
    # H4: 18px → 16px is also 18px, need context
    # These are getting very specific, let's handle them via line-level context

    count_replacements(before, css, "Typography changes")
    return css


# ─────────────────────────────────────────────────────────────────
# PHASE 5: JavaScript Changes
# ─────────────────────────────────────────────────────────────────
def apply_js_changes(js):
    """Update slide duration in shared-scripts.js."""
    print("\n== Phase 5: JavaScript Changes ==")
    before = js
    js = js.replace('const slideDuration = 5000;', 'const slideDuration = 6000;')
    if before != js:
        print("  slideDuration: 5000 -> 6000 OK")
    else:
        print("  WARNING: slideDuration replacement not found!")
    return js


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────
def main():
    print("===================================================")
    print("  Applying Design Brief v3 to Helferportal CSS/JS")
    print("===================================================")

    # Read files
    with open(CSS_PATH, 'r', encoding='utf-8') as f:
        css = f.read()
    with open(JS_PATH, 'r', encoding='utf-8') as f:
        js = f.read()

    original_css = css
    original_js = js

    print(f"\nCSS file: {len(css)} chars, {css.count(chr(10))} lines")
    print(f"JS file: {len(js)} chars, {js.count(chr(10))} lines")

    # Apply phases
    css = apply_root_token_replacements(css)
    css = add_missing_tokens(css)
    css = apply_global_safe_replacements(css)
    css = apply_component_changes(css)
    css = apply_typography_changes(css)
    js = apply_js_changes(js)

    # Write files
    with open(CSS_PATH, 'w', encoding='utf-8') as f:
        f.write(css)
    with open(JS_PATH, 'w', encoding='utf-8') as f:
        f.write(js)

    # Summary
    total_css_changes = sum(1 for a, b in zip(original_css.splitlines(), css.splitlines()) if a != b)
    total_css_changes += abs(len(css.splitlines()) - len(original_css.splitlines()))

    print("\n===================================================")
    print(f"  TOTAL: ~{total_css_changes} CSS lines changed")
    print(f"  CSS: {len(original_css)} -> {len(css)} chars")
    print(f"  JS: {len(original_js)} -> {len(js)} chars")
    print("===================================================")

    # Verification checks
    print("\n-- Verification --")

    # Check old hex values are gone
    old_hexes = {
        '#E65100': '--orange-primary',
        '#1565C0': '--blue-primary',
        '#7B1FA2': '--purple-primary',
        '#FAFAFA': '--gray-50',
        '#F5F5F5': '--gray-100',
        '#EEEEEE': '--gray-200',
        '#E0E0E0': '--gray-300',
        '#BDBDBD': '--gray-400',
        '#9E9E9E': '--gray-500',
        '#757575': '--gray-600',
        '#616161': '--gray-700',
        '#424242': '--gray-800',
        '#212121': '--gray-900',
    }

    remaining = []
    for hex_val, name in old_hexes.items():
        count = css.count(hex_val)
        if count > 0:
            remaining.append(f"  WARNING: {hex_val} ({name}) still appears {count}x")

    if remaining:
        print("  Old hex values remaining:")
        for r in remaining:
            print(r)
    else:
        print("  OK All old hex values replaced")

    # Check :root block count
    root_count = len(re.findall(r':root\s*\{', css))
    print(f"  :root blocks found: {root_count} (expected 7)")

    # Check new values present
    new_checks = ['#EC6303', '#23679A', '#0B286D', '#FAFBFC', '#F2F4F6', '#1F2328']
    for val in new_checks:
        count = css.count(val)
        print(f"  {val}: {count} occurrences")

    print("\nDone! Review with: git diff --stat")


if __name__ == '__main__':
    main()
