/**
 * HTML Sanitizer for product descriptions
 * Strips dangerous HTML/scripts while allowing basic formatting
 */

// Whitelist of allowed HTML tags for product descriptions
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'];

/**
 * Sanitize HTML by removing all tags except whitelisted ones
 * and removing all attributes (including event handlers)
 */
const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe tags and their content
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove all attributes from remaining tags (includes onclick, onerror, etc.)
  sanitized = sanitized.replace(/<(\w+)\s+[^>]*>/gi, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (ALLOWED_TAGS.includes(tag)) {
      return `<${tag}>`;
    }
    return ''; // Remove non-whitelisted tags
  });
  
  // Remove closing tags that aren't in whitelist
  sanitized = sanitized.replace(/<\/(\w+)>/gi, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (ALLOWED_TAGS.includes(tag)) {
      return `</${tag}>`;
    }
    return '';
  });
  
  // Remove any remaining HTML tags not caught above
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities to prevent double-encoding
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
  
  return sanitized.trim();
};

/**
 * Sanitize product data before saving
 */
const sanitizeProductData = (data) => {
  const sanitized = { ...data };
  
  if (sanitized.description) {
    sanitized.description = sanitizeHTML(sanitized.description);
  }
  
  if (sanitized.name) {
    // Product names should have no HTML at all
    sanitized.name = sanitizeHTML(sanitized.name).replace(/<[^>]+>/g, '');
  }
  
  return sanitized;
};

module.exports = {
  sanitizeHTML,
  sanitizeProductData,
};
