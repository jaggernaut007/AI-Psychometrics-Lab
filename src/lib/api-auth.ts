/**
 * API Authentication module for v1 endpoints.
 * Validates Bearer tokens against the APL_API_KEY environment variable
 * using constant-time comparison to prevent timing attacks.
 *
 * @author Shreyas Jagannath
 */

export interface AuthResult {
  valid: boolean;
  error?: string;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Both strings are compared byte-by-byte regardless of where they differ.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a full comparison to avoid length-based timing leaks
    let result = 1;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate the Authorization header against the configured API key.
 *
 * @param authHeader - The raw Authorization header value
 * @returns AuthResult indicating validity and any error message
 */
export function validateApiKey(authHeader: string | null): AuthResult {
  const apiKey = process.env.APL_API_KEY;

  if (!apiKey) {
    return { valid: false, error: 'API key not configured on server' };
  }

  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Authorization header must use Bearer scheme' };
  }

  const token = authHeader.slice(7);

  if (!token) {
    return { valid: false, error: 'Bearer token is empty' };
  }

  if (!timingSafeEqual(token, apiKey)) {
    return { valid: false, error: 'Invalid API key' };
  }

  return { valid: true };
}
