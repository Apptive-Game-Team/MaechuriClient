import { getFingerprintId } from './fingerprint';

/**
 * Fetch wrapper that adds fingerprint ID header and credentials to all requests
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fingerprintId = await getFingerprintId();

  const headers = new Headers(options.headers);
  headers.set('fingerPrintId', fingerprintId);

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}
