/**
 * Enterprise-grade service code generation and validation utilities
 * 
 * Ensures all service codes follow a strict, standardized format:
 * - Character set: A-Z, 0-9, and - only
 * - Pattern: CAT-ABBR or CAT-SUB-ABBR
 * - Max length: 24 characters
 * - No consecutive hyphens, no leading/trailing hyphens
 */

/**
 * Category prefix mapping for service codes
 */
const CATEGORY_PREFIXES: Record<string, string> = {
  consultation: "CONS",
  laboratory: "LAB",
  radiology: "RAD",
  ultrasound: "US",
  pharmacy: "PHARM",
  procedure: "PROC",
};

/**
 * Stopwords to filter out when generating abbreviations
 */
const STOPWORDS = new Set([
  'for', 'and', 'or', 'the', 'a', 'an', 'of', 'with', 'in', 'on', 'at',
  'to', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been',
]);

/**
 * Maximum allowed length for service codes (including prefix and hyphens)
 */
const MAX_CODE_LENGTH = 24;

/**
 * Sanitizes a string to only contain allowed characters (A-Z, 0-9, -)
 * - Removes all special characters, whitespace, and punctuation
 * - Converts to uppercase
 * - Removes consecutive hyphens
 * - Removes leading/trailing hyphens
 */
export function sanitizeCode(code: string): string {
  if (!code) return '';
  
  return code
    .toUpperCase()
    // Replace any non-alphanumeric character (except hyphens) with hyphen
    .replace(/[^A-Z0-9-]/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates a service code against enterprise standards
 * Returns an error message if invalid, null if valid
 */
export function validateServiceCode(code: string | null | undefined): string | null {
  if (!code || !code.trim()) {
    return null; // Code is optional for some categories
  }
  
  const trimmed = code.trim();
  
  // Check allowed characters only (A-Z, 0-9, -)
  if (!/^[A-Z0-9-]+$/.test(trimmed)) {
    return 'Service code must only contain uppercase letters, numbers, and hyphens';
  }
  
  // Check for consecutive hyphens
  if (/--/.test(trimmed)) {
    return 'Service code must not contain consecutive hyphens';
  }
  
  // Check for leading/trailing hyphens
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return 'Service code must not start or end with a hyphen';
  }
  
  // Check max length
  if (trimmed.length > MAX_CODE_LENGTH) {
    return `Service code must not exceed ${MAX_CODE_LENGTH} characters`;
  }
  
  return null; // Valid
}

/**
 * Extracts abbreviation from service name
 * Priority:
 * 1. Extract from parentheses if present (e.g., "Blood Test (CBC)" -> "CBC")
 * 2. Generate from significant words (removing stopwords)
 */
function extractAbbreviation(serviceName: string): string {
  // 1. Check for abbreviation in parentheses
  const parenMatch = serviceName.match(/\(([A-Za-z0-9-]+)\)/);
  if (parenMatch) {
    return sanitizeCode(parenMatch[1]);
  }
  
  // 2. Generate from significant words
  const words = serviceName
    .split(/[\s\-\/]+/) // Split on spaces, hyphens, and slashes
    .map(w => w.trim())
    .filter(w => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
  
  if (words.length === 0) {
    return 'SERVICE';
  }
  
  if (words.length === 1) {
    // Single word: take first 8 characters
    return sanitizeCode(words[0].substring(0, 8));
  }
  
  if (words.length === 2) {
    // Two words: take first 4 chars of each
    return sanitizeCode(
      words[0].substring(0, 4) + words[1].substring(0, 4)
    );
  }
  
  // Three or more words: use first letters (up to 6 letters)
  const acronym = words
    .slice(0, Math.min(6, words.length))
    .map(w => w[0])
    .join('');
  
  return sanitizeCode(acronym);
}

/**
 * Generates a service code from service name and category
 * Format: CAT-ABBR
 * 
 * @param serviceName - The name of the service
 * @param category - The service category (consultation, laboratory, etc.)
 * @returns Generated service code following enterprise standards
 */
export function generateServiceCode(serviceName: string, category: string): string {
  const prefix = CATEGORY_PREFIXES[category] || 'SVC';
  const abbr = extractAbbreviation(serviceName);
  
  let code = `${prefix}-${abbr}`;
  
  // Ensure max length
  if (code.length > MAX_CODE_LENGTH) {
    // Trim abbreviation to fit
    const maxAbbrLength = MAX_CODE_LENGTH - prefix.length - 1; // -1 for hyphen
    const trimmedAbbr = abbr.substring(0, maxAbbrLength);
    code = `${prefix}-${trimmedAbbr}`;
  }
  
  return code;
}

/**
 * Ensures a code is unique by adding numeric suffix if needed
 * Format: CODE -> CODE-02, CODE-03, etc.
 * 
 * @param code - The base code to make unique
 * @param existingCodes - Array of existing codes to check against
 * @returns Unique code with suffix if needed
 */
export function ensureUniqueCode(code: string, existingCodes: string[]): string {
  const existingSet = new Set(existingCodes.map(c => c?.toUpperCase()).filter(Boolean));
  
  if (!existingSet.has(code.toUpperCase())) {
    return code;
  }
  
  // Add numeric suffix
  let counter = 2;
  let uniqueCode: string;
  
  // Calculate max suffix length that fits within MAX_CODE_LENGTH
  const maxSuffixLength = MAX_CODE_LENGTH - code.length - 1; // -1 for hyphen
  
  while (true) {
    const suffix = counter.toString().padStart(2, '0'); // 02, 03, etc.
    
    if (suffix.length > maxSuffixLength) {
      // If suffix won't fit, we need to shorten the base code
      const shortenedCode = code.substring(0, MAX_CODE_LENGTH - suffix.length - 1);
      uniqueCode = `${shortenedCode}-${suffix}`;
    } else {
      uniqueCode = `${code}-${suffix}`;
    }
    
    if (!existingSet.has(uniqueCode.toUpperCase())) {
      return uniqueCode;
    }
    
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 999) {
      throw new Error(`Unable to generate unique code for base: ${code}`);
    }
  }
}

/**
 * Generates and validates a complete service code
 * This is the main function to use for creating new service codes
 * 
 * @param serviceName - The name of the service
 * @param category - The service category
 * @param existingCodes - Array of existing codes to ensure uniqueness
 * @returns Valid, unique service code
 */
export function generateAndValidateServiceCode(
  serviceName: string,
  category: string,
  existingCodes: string[] = []
): string {
  const code = generateServiceCode(serviceName, category);
  const uniqueCode = ensureUniqueCode(code, existingCodes);
  const sanitized = sanitizeCode(uniqueCode);
  
  const validationError = validateServiceCode(sanitized);
  if (validationError) {
    throw new Error(`Generated code validation failed: ${validationError}`);
  }
  
  return sanitized;
}
