/**
 * field-ops.js — Shared field-type operations for the Helferportal CMS pipeline.
 *
 * Used by: build.js, deploy.js
 * NOT used by: admin.html (browser context, different DOM API)
 *
 * This is the single source of truth for how JSON field values
 * map to Cheerio DOM operations.
 */

/**
 * Resolve an image field to { src, alt } regardless of storage format.
 *
 * Handles:
 *   - Nested: field.value = { src: "url", alt: "text" }
 *   - Legacy flat: field.value = "url", field.alt = "text"
 *   - Null/undefined: returns { src: '', alt: '' }
 *
 * @param {object} field — the field object from JSON
 * @returns {{ src: string, alt: string }}
 */
function resolveImage(field) {
  if (field.value && typeof field.value === 'object') {
    return { src: field.value.src || '', alt: field.value.alt || '' };
  }
  return { src: field.value || '', alt: field.alt || '' };
}

/**
 * Apply a field's value to a Cheerio DOM element.
 *
 * @param {object} $ — Cheerio instance
 * @param {object} $el — Cheerio-wrapped element
 * @param {string} fieldType — the data-field-type attribute value
 * @param {object} field — the field object from JSON
 * @returns {boolean} true if the field was applied
 */
function applyField($, $el, fieldType, field) {
  switch (fieldType) {
    case 'image': {
      const img = resolveImage(field);
      if (img.src) $el.attr('src', img.src);
      if (img.alt) $el.attr('alt', img.alt);
      return true;
    }

    case 'link':
    case 'button':
      if (field.href !== undefined) $el.attr('href', field.href);
      if (field.value !== undefined) setTextOnly($, $el, field.value);
      return true;

    case 'video': {
      const $thumb = $el.find('.video-thumbnail');
      const $label = $el.find('.video-card-label');
      if (field.value) $label.text(field.value);
      if (field.thumbnail) {
        const thumbImg = typeof field.thumbnail === 'object'
          ? field.thumbnail.src || '' : field.thumbnail;
        $thumb.attr('src', thumbImg);
      }
      if (field.alt) $thumb.attr('alt', field.alt);
      return true;
    }

    case 'textarea':
      $el.text(field.value);
      return true;

    case 'html':
      $el.html(field.value);
      return true;

    default: // 'text'
      $el.text(field.value);
      return true;
  }
}

/**
 * Replace only the direct text content of an element,
 * preserving child elements (SVGs, icons).
 */
function setTextOnly($, $el, newText) {
  $el.contents().each((_, node) => {
    if (node.type === 'text') {
      const currentText = $(node).text().trim();
      if (currentText.length > 0) {
        $(node).replaceWith(newText + '\n                        ');
        return false; // break after first replacement
      }
    }
  });
}

module.exports = { resolveImage, applyField, setTextOnly };
