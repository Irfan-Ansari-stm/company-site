// backend/src/utils/sanitizer.js
/**
 * Production-grade HTML & Attribute Sanitizer for CMS Custom Blocks
 * Protects against Stored XSS, script injection, and malicious event handlers
 * while allowing full expressiveness of semantic HTML and Tailwind CSS classes.
 */

// Allowlist of safe HTML tags
const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'svg', 'path', 'circle', 'rect', 'line',
  'button', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
  'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'strong', 'b', 'em', 'i', 'u', 's', 'small', 'code', 'pre', 'blockquote',
  'hr', 'br', 'mark', 'kbd', 'sub', 'sup'
]);

// Allowlist of safe attributes
const ALLOWED_ATTRIBUTES = new Set([
  'class', 'className', 'id', 'style', 'title', 'alt', 'href', 'src',
  'target', 'rel', 'viewbox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height',
  'aria-label', 'aria-hidden', 'role', 'tabindex'
]);

/**
 * Sanitizes an HTML string by removing disallowed tags, dangerous protocols, and all event handlers.
 * @param {string} rawHtml 
 * @returns {string} Sanitized safe HTML
 */
function sanitizeHtmlMarkup(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  let html = rawHtml;

  // 1. Remove dangerous executable tags and contents entirely
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  html = html.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Strip disallowed self-closing or paired tags
  html = html.replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ''; // Strip tag
    }

    // Clean attributes
    if (!attrs || !attrs.trim()) {
      return match.startsWith('</') ? `</${lowerTag}>` : `<${lowerTag}>`;
    }

    // Process attributes
    const cleanAttrs = [];
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Reject all inline JS event handlers (e.g. onclick, onerror, onload)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check if attribute is in allowlist
      if (ALLOWED_ATTRIBUTES.has(attrName)) {
        // Prevent javascript: pseudo-protocol or data: URLs in href/src
        if ((attrName === 'href' || attrName === 'src') &&
            /^\s*(javascript|data):/i.test(attrVal)) {
          continue;
        }

        cleanAttrs.push(`${attrName}="${attrVal.replace(/"/g, '&quot;')}"`);
      }
    }

    const attrsString = cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
    return match.startsWith('</') ? `</${lowerTag}>` : `<${lowerTag}${attrsString}>`;
  });

  return html;
}

module.exports = {
  sanitizeHtmlMarkup,
  ALLOWED_TAGS,
  ALLOWED_ATTRIBUTES,
};

