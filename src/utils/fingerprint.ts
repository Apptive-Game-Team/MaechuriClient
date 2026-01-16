import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fingerprintId: string | null = null;

/**
 * Generate a fallback ID if fingerprinting fails
 */
function generateFallbackId(): string {
  // Try crypto.randomUUID if available (requires HTTPS or localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `fallback-${crypto.randomUUID()}`;
  }
  // Fallback to Math.random for broader compatibility
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  return `fallback-${randomPart}`;
}

/**
 * Get the fingerprint ID for the current browser session
 * The ID is cached in memory for the session duration
 */
export async function getFingerprintId(): Promise<string> {
  if (fingerprintId) {
    return fingerprintId;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    fingerprintId = result.visitorId;
    return fingerprintId;
  } catch (error) {
    console.error('Failed to get fingerprint ID:', error);
    // Generate a random session-specific ID as fallback
    fingerprintId = generateFallbackId();
    return fingerprintId;
  }
}
