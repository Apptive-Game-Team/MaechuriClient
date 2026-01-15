import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fingerprintId: string | null = null;

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
    fingerprintId = `fallback-${crypto.randomUUID()}`;
    return fingerprintId;
  }
}
