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
                applyOneField(d.fieldId, d.prop, d.value);
                break;
            case 'hp-cms-highlight':
                highlightField(d.fieldId);
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

    function applyAllFields(content) {
        if (!content || !content.blocks) return;
        for (const block of content.blocks) {
            for (const field of block.fields) {
                const el = document.querySelector(`[data-field="${field.id}"]`);
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

    function applyOneField(fieldId, prop, value) {
        const el = document.querySelector(`[data-field="${fieldId}"]`);
        if (!el) return;
        const type = el.getAttribute('data-field-type') || 'text';
        applyFieldValue(el, type, prop, value);
    }

    function applyFieldValue(el, type, prop, value) {
        if (value === undefined || value === null) return;
        switch (type) {
            case 'text':
            case 'textarea':
                if (prop === 'value') el.textContent = value;
                break;
            case 'image':
                if (prop === 'value') el.src = value;
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

    // ============================================================
    //  HIGHLIGHT
    // ============================================================

    let highlightedEl = null;

    function highlightField(fieldId) {
        unhighlightAll();
        const el = document.querySelector(`[data-field="${fieldId}"]`);
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
