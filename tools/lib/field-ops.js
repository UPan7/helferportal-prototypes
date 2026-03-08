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
      if ($el.children().length > 0) {
        applyStructuredText($, $el, field.value);
      } else {
        $el.text(field.value);
      }
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

/**
 * Apply pipe-delimited text to a structured HTML container,
 * updating child elements in-place without destroying HTML structure.
 *
 * Reverses extractStructuredText() from extract.js.
 * Handles patterns:
 *   - Card: div > h3/h4 + p  →  "Title | Description"
 *   - List: li > svg + text  →  "Item text"
 *   - Nested cards with wrappers (feature-card-header, etc.)
 *
 * If more lines than children: clones last child as template.
 * If fewer lines than children: removes excess children.
 */
function applyStructuredText($, $el, text) {
  const lines = text.split('\n').filter(l => l.trim());
  const $children = $el.children();

  if ($children.length === 0 || lines.length === 0) {
    return;
  }

  // Detect pattern from first child
  const $first = $($children[0]);
  const hasTitle = $first.find('h3, h4').length > 0;
  const isListItem = $first.is('li');
  const pCount = $first.find('p').length;

  // Multi-<p> pattern (e.g. stat-cards: p.stat-number + p description)
  // Each child consumes pCount lines instead of 1
  if (!hasTitle && !isListItem && pCount > 1
      && lines.length === $children.length * pCount) {
    $children.each((i, child) => {
      const $ps = $(child).find('p');
      $ps.each((j, p) => {
        $(p).text(lines[i * pCount + j].trim());
      });
    });
    return;
  }

  // Standard patterns: 1 line per child ("Title | Desc" or plain text)
  const $templateChild = $($children[$children.length - 1]);

  lines.forEach((line, i) => {
    let $child;
    if (i < $children.length) {
      $child = $($children[i]);
    } else {
      // Clone last child as template and append
      $child = $templateChild.clone();
      $el.append($child);
    }

    const parts = line.split(' | ');
    const title = parts[0].trim();
    const desc = parts.length > 1 ? parts.slice(1).join(' | ').trim() : '';

    if (hasTitle) {
      $child.find('h3, h4').first().text(title);
      if (pCount > 0) $child.find('p').first().text(desc || title);
    } else if (isListItem) {
      // List items: preserve SVG, update only text nodes
      setTextOnly($, $child, title);
    } else {
      // Generic: update text only, preserve child elements
      setTextOnly($, $child, title);
    }
  });

  // Remove excess children (if fewer lines than original children)
  const currentChildren = $el.children();
  for (let i = currentChildren.length - 1; i >= lines.length; i--) {
    $(currentChildren[i]).remove();
  }
}

module.exports = { resolveImage, applyField, setTextOnly, applyStructuredText };
