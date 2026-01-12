// Email parsing utilities
/**
 * Parse email address to extract name and email
 * @param {string} emailString - Email string (e.g., "John Doe <john@example.com>")
 * @returns {Object} Parsed email with name and email
 */
export function parseEmail(emailString) {
  if (!emailString || typeof emailString !== 'string') {
    return { name: '', email: '' };
  }
  
  // Pattern: "Name <email@domain.com>" or "email@domain.com"
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/);
  
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }
  
  // Just email
  return {
    name: emailString.split('@')[0].replace(/[._]/g, ' '), // Extract name from email
    email: emailString.trim()
  };
}

/**
 * Extract company from email domain
 * @param {string} email - Email address
 * @returns {string} Company name (from domain)
 */
export function extractCompanyFromEmail(email) {
  if (!email || !email.includes('@')) {
    return '';
  }
  
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  // Remove common TLDs and extract company name
  const company = domain.split('.')[0];
  return company.charAt(0).toUpperCase() + company.slice(1);
}

/**
 * Extract first name from full name
 * @param {string} fullName - Full name
 * @returns {string} First name
 */
export function extractFirstName(fullName) {
  if (!fullName) return '';
  
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
}

/**
 * Extract last name from full name
 * @param {string} fullName - Full name
 * @returns {string} Last name
 */
export function extractLastName(fullName) {
  if (!fullName) return '';
  
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

