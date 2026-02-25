// Type definitions for sanitize.js
// Generated for JavaScript module with JSDoc annotations

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 * @param {string} dirty - HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string;

/**
 * Sanitize post content for display
 * @param {string} content - Raw post content
 * @returns {string} - Sanitized content
 */
export function sanitizePostContent(content: string): string;

/**
 * Sanitize user input before storing
 * This is applied on the frontend before sending to the backend
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
export function sanitizeUserInput(input: string): string;
