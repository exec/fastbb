/**
 * Content Sanitization Utility
 * Prevents XSS attacks by sanitizing HTML content
 */

/**
 * Create a DOMPurify-like sanitizer using browser's built-in capabilities
 * This provides basic HTML sanitization without external dependencies
 * @param {string} dirty - HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(dirty) {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Create a temporary div to parse HTML
  const div = document.createElement('div');
  div.innerHTML = dirty;

  // Remove script and style tags
  const scripts = div.querySelectorAll('script, style, iframe, object, embed, meta, link[rel="stylesheet"]');
  scripts.forEach(tag => tag.remove());

  // Remove event handler attributes
  const elements = div.querySelectorAll('*');
  elements.forEach(el => {
    // List of dangerous attributes to remove
    const dangerousAttrs = [
      'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout',
      'onmouseenter', 'onmouseleave', 'onkeydown', 'onkeyup',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
      'ondblclick', 'onmousemove', 'onmousedown', 'onmouseup',
      'onabort', 'oncanplay', 'oncanplaythrough', 'oncuechange',
      'ondurationchange', 'onemptied', 'onended', 'onerror',
      'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onpause',
      'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked',
      'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate',
      'onvolumechange', 'onwaiting', 'onshow', 'ontoggle',
      'oncontextmenu', 'ondrag', 'ondragend', 'ondragenter',
      'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
      'onmousewheel', 'onwheel', 'oncopy', 'oncut', 'onpaste',
      'onactivate', 'onafterprint', 'onbeforeactivate',
      'onbeforecopy', 'onbeforecut', 'onbeforedeactivate', 'onbeforeeditfocus',
      'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onbeforeupdate',
      'onbounce', 'oncellchange', 'onclose', 'oncontrolselect',
      'ondataavailable', 'ondatasetchanged', 'ondatasetcomplete', 'ondeactivate',
      'onerrorupdate', 'onfilterchange', 'onfinish', 'onfocusin', 'onfocusout',
      'onhelp', 'onkeydown', 'onkeypress', 'onkeyup', 'onlayoutcomplete',
      'onlosecapture', 'onmove', 'onmoveend', 'onmovestart', 'onoffline',
      'ononline', 'onoutofprint', 'onoutofsync', 'onpause', 'onplay',
      'onplaying', 'onpointerdown', 'onpointerenter', 'onpointerleave',
      'onpointermove', 'onpointerover', 'onpointerout', 'onpointerup',
      'onpopstate', 'onprogress', 'onpropertychange', 'onrandomize', 'onresize',
      'onresizeend', 'onresizestart', 'onrowenter', 'onrowexit', 'onrowsdelete',
      'onrowsinserted', 'onscroll', 'onsearch', 'onseek', 'onselect',
      'onselectionchange', 'onselectstart', 'onstart', 'onstop', 'onsubmit',
      'onunload', 'ontoggle'
    ];

    dangerousAttrs.forEach(attr => {
      el.removeAttribute(attr);
    });
  });

  // Remove javascript: and data: URLs from href/src attributes
  const links = div.querySelectorAll('a[href], link[href], area[href], script[src], img[src], iframe[src], embed[src], object[data]');
  links.forEach(el => {
    const href = el.getAttribute('href');
    const src = el.getAttribute('src');
    const data = el.getAttribute('data');

    if (href && (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:'))) {
      el.removeAttribute('href');
    }
    if (src && (src.toLowerCase().startsWith('javascript:') || src.toLowerCase().startsWith('data:'))) {
      el.removeAttribute('src');
    }
    if (data && (data.toLowerCase().startsWith('javascript:') || data.toLowerCase().startsWith('data:'))) {
      el.removeAttribute('data');
    }
  });

  return div.innerHTML;
}

/**
 * Sanitize post content for display
 * @param {string} content - Raw post content
 * @returns {string} - Sanitized content
 */
export function sanitizePostContent(content) {
  if (!content) return '';
  return sanitizeHtml(content);
}

/**
 * Sanitize user input before storing
 * This is applied on the frontend before sending to the backend
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
export function sanitizeUserInput(input) {
  if (!input) return '';
  return sanitizeHtml(input);
}
