// ================================================================
// HELFERPORTAL CMS — PREVIEW BRIDGE
// Loaded by shared-scripts.js on every prototype page.
// Self-activates ONLY when inside an iframe (CMS editor).
// In production (top-level window): does nothing, zero overhead.
// ================================================================

if (window !== window.top) {
    // -- Preview mode flag: prototype JS can check this --
    window.__CMS_PREVIEW__ = true;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('cms-preview');
        });
    } else {
        document.body.classList.add('cms-preview');
    }

    // -- Message listener (same-origin only) --
    window.addEventListener('message', (e) => {
        if (e.origin !== location.origin) return;
        const d = e.data;
        if (!d || !d.type) return;

        switch (d.type) {
            case 'hp-cms-init':
                applyAllFields(d.content);
                break;
            case 'hp-cms-update':
                applyOneField(d.fieldId, d.prop, d.value, d.blockId);
                break;
            case 'hp-cms-highlight':
                highlightField(d.fieldId, d.blockId);
                break;
            case 'hp-cms-unhighlight':
                unhighlightAll();
                break;
        }
    });

    // -- Notify parent that bridge is ready --
    window.parent.postMessage({ type: 'hp-cms-ready' }, location.origin);

    // ============================================================
    //  FIELD UPDATE LOGIC
    // ============================================================

    // Resolve a field element, scoped by block when blockId is available.
    // Falls back to global lookup for backward compatibility.
    function findFieldEl(fieldId, blockId) {
        if (blockId) {
            const scoped = document.querySelector(`[data-block-id="${blockId}"] [data-field="${fieldId}"]`);
            if (scoped) return scoped;
        }
        return document.querySelector(`[data-field="${fieldId}"]`);
    }

    function applyAllFields(content) {
        if (!content || !content.blocks) return;
        for (const block of content.blocks) {
            for (const field of block.fields) {
                const el = findFieldEl(field.id, block.id);
                if (!el) continue;
                const type = el.getAttribute('data-field-type') || 'text';
                // Apply all relevant props
                applyFieldValue(el, type, 'value', field.value);
                if (field.alt !== undefined) applyFieldValue(el, type, 'alt', field.alt);
                if (field.href !== undefined) applyFieldValue(el, type, 'href', field.href);
                if (field.thumbnail !== undefined) applyFieldValue(el, type, 'thumbnail', field.thumbnail);
            }
        }
    }

    function applyOneField(fieldId, prop, value, blockId) {
        const el = findFieldEl(fieldId, blockId);
        if (!el) return;
        const type = el.getAttribute('data-field-type') || 'text';
        applyFieldValue(el, type, prop, value);
    }

    function applyFieldValue(el, type, prop, value) {
        if (value === undefined || value === null) return;
        switch (type) {
            case 'text':
            case 'textarea':
                if (prop === 'value') {
                    if (el.tagName === 'A' && el.children.length > 0) {
                        el.href = value;
                    } else if (el.children.length === 0) {
                        el.textContent = value;
                    } else {
                        renderCards(el, value);
                    }
                }
                break;
            case 'image':
                if (prop === 'value') {
                    el.src = (value && typeof value === 'object') ? value.src || '' : value;
                    if (value && typeof value === 'object' && value.alt) el.alt = value.alt;
                }
                if (prop === 'alt') el.alt = value;
                break;
            case 'button':
            case 'link':
                if (prop === 'value') setTextOnly(el, value);
                if (prop === 'href') el.href = value;
                break;
            case 'video':
                if (prop === 'value') {
                    const label = el.querySelector('.video-card-label');
                    if (label) label.textContent = value;
                }
                if (prop === 'thumbnail') {
                    const thumb = el.querySelector('.video-thumbnail');
                    if (thumb) thumb.src = value;
                }
                if (prop === 'alt') {
                    const thumb = el.querySelector('.video-thumbnail');
                    if (thumb) thumb.alt = value;
                }
                break;
            case 'html':
                if (prop === 'value') el.innerHTML = value;
                break;
        }
    }

    // Replace only the first text node, preserving child elements (SVG icons, etc.)
    function setTextOnly(el, text) {
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = text;
                return;
            }
        }
        // Fallback: no text node found, prepend one
        el.insertBefore(document.createTextNode(text), el.firstChild);
    }

    // Parse pipe-delimited card text and render into card containers.
    //
    // Three strategies:
    //   1. STRUCTURED: Known card containers (trust-features, kosten-options, etc.)
    //      → update existing cards in-place to preserve icons and styling.
    //   2. CMS-RENDERED: Containers already rebuilt by CMS (all children are .tab-option)
    //      → safe to rebuild with generic .tab-option divs.
    //   3. COMPLEX DOM: Containers with page-specific styled elements (activities, grids, etc.)
    //      → preserve original DOM to avoid destroying SVGs, icons, and CSS styling.
    //      Text edits in these fields won't live-preview (save + reload to see changes).
    //
    function renderCards(el, value) {
        if (!value || typeof value !== 'string') return;
        const lines = value.split('\n').filter(l => l.trim());

        // Detect structured container type by CSS class
        const isStructured = el.classList.contains('trust-features')
            || el.classList.contains('kosten-options')
            || el.classList.contains('vernetzen-cards');

        if (isStructured) {
            // Update existing cards in-place (preserve icons, structure)
            const cards = Array.from(el.children);
            lines.forEach((line, i) => {
                const sep = line.indexOf('|');
                const title = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
                const desc  = sep >= 0 ? line.slice(sep + 1).trim() : '';
                if (i < cards.length) {
                    // Update existing card text
                    const h4 = cards[i].querySelector('h4');
                    const p  = cards[i].querySelector('p');
                    const amt = cards[i].querySelector('.kosten-pill-amount');
                    const lbl = cards[i].querySelector('.kosten-pill-label');
                    if (amt && lbl) { amt.textContent = title; lbl.textContent = desc; }
                    else { if (h4) h4.textContent = title; if (p) p.textContent = desc; }
                } else {
                    // Clone last card as template for new entries
                    const template = cards.length > 0 ? cards[cards.length - 1] : null;
                    if (template) {
                        const clone = template.cloneNode(true);
                        const h4 = clone.querySelector('h4');
                        const p  = clone.querySelector('p');
                        const amt = clone.querySelector('.kosten-pill-amount');
                        const lbl = clone.querySelector('.kosten-pill-label');
                        if (amt && lbl) { amt.textContent = title; lbl.textContent = desc; }
                        else { if (h4) h4.textContent = title; if (p) p.textContent = desc; }
                        el.appendChild(clone);
                    }
                }
            });
            // Remove excess cards
            while (el.children.length > lines.length) {
                el.removeChild(el.lastElementChild);
            }
            return;
        }

        // Check if container has complex page-specific DOM or generic .tab-option cards.
        const children = Array.from(el.children);
        const isCMSRendered = children.length > 0
            && children.every(c => c.classList.contains('tab-option'));
        if (children.length > 0 && !isCMSRendered) {
            // Generic in-place update: find editable text elements and update them.
            // Mirrors extractStructuredText() — find h3/h4+p pairs or text nodes,
            // recurse one level into wrapper divs. Preserves SVGs, icons, styling.
            const editables = collectEditables(el);
            lines.forEach((line, i) => {
                if (i >= editables.length) return;
                const sep = line.indexOf('|');
                const title = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
                const desc  = sep >= 0 ? line.slice(sep + 1).trim() : '';
                const t = editables[i];
                if (t.heading) t.heading.textContent = title;
                if (t.desc && desc) t.desc.textContent = desc;
                if (t.textNode) t.textNode.textContent = title;
            });
            return;
        }

        // Default: generic .tab-option cards (rebuild empty or CMS-rendered containers)
        const existing = el.querySelector('.tab-option');
        const color = existing
            ? [...existing.classList].find(c => ['blue', 'orange', 'purple'].includes(c)) || ''
            : '';
        el.innerHTML = '';
        for (const line of lines) {
            const sep = line.indexOf('|');
            const title = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
            const desc = sep >= 0 ? line.slice(sep + 1).trim() : '';
            const card = document.createElement('div');
            card.className = 'tab-option' + (color ? ' ' + color : '');
            const h4 = document.createElement('h4');
            h4.textContent = title;
            card.appendChild(h4);
            const p = document.createElement('p');
            p.textContent = desc;
            card.appendChild(p);
            el.appendChild(card);
        }
    }

    // Mirror of extract.js extractStructuredText():
    // Walk child elements, find h3/h4 headings + p descriptions,
    // or text nodes (for icon+text patterns like activity-tags, org-benefits).
    // Recurse one level into wrapper divs (tags-grid, benefits-list, etc.).
    function collectEditables(el) {
        const result = [];
        for (const child of el.children) {
            const h = child.querySelector('h3, h4');
            const p = child.querySelector('p');
            if (h) {
                result.push({ heading: h, desc: p || null });
            } else {
                const tn = firstTextNode(child);
                if (tn) {
                    result.push({ textNode: tn });
                } else if (child.children.length > 0) {
                    // Recurse into wrapper containers
                    for (const gc of child.children) {
                        const gh = gc.querySelector('h3, h4');
                        const gp = gc.querySelector('p');
                        if (gh) {
                            result.push({ heading: gh, desc: gp || null });
                        } else {
                            const gt = firstTextNode(gc);
                            if (gt) result.push({ textNode: gt });
                        }
                    }
                }
            }
        }
        return result;
    }

    // Find first meaningful text node in an element (skip empty/whitespace-only)
    function firstTextNode(el) {
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return node;
            }
        }
        return null;
    }

    // ============================================================
    //  HIGHLIGHT
    // ============================================================

    let highlightedEl = null;

    function highlightField(fieldId, blockId) {
        unhighlightAll();
        const el = findFieldEl(fieldId, blockId);
        if (!el) return;
        el.style.outline = '2px solid #E65100';
        el.style.outlineOffset = '2px';
        el.style.transition = 'outline 0.15s ease';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightedEl = el;
    }

    function unhighlightAll() {
        if (highlightedEl) {
            highlightedEl.style.outline = '';
            highlightedEl.style.outlineOffset = '';
            highlightedEl.style.transition = '';
            highlightedEl = null;
        }
    }
}
