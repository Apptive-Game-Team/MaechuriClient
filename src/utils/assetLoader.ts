import type { DirectionalAsset } from '../types/map';

export interface LoadedAsset {
  id: number;
  asset: DirectionalAsset;
}

/**
 * Type guard to validate DirectionalAsset
 */
const isDirectionalAsset = (data: unknown): data is DirectionalAsset => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const asset = data as Record<string, unknown>;
  const validKeys = ['left', 'right', 'front', 'back'];
  
  // Check if it has at least one of the valid keys
  const keys = Object.keys(asset);
  const hasAnyValidKey = keys.some(key => validKeys.includes(key));
  const hasValidValues = keys
    .filter(key => validKeys.includes(key))
    .every(key => typeof asset[key] === 'string');
    
  return hasAnyValidKey && hasValidValues;
};

/**
 * Fetches an object asset from a URL
 * @param objectUrl The URL to fetch the object asset from
 * @returns A promise that resolves to a DirectionalAsset
 */
export const fetchObjectAsset = async (objectUrl: string): Promise<DirectionalAsset> => {
  try {
    // If URL already looks like an image, treat it as the asset itself
    if (objectUrl.match(/\.(png|jpe?g|gif|webp|svg)$|blob:/i)) {
      return { front: objectUrl };
    }

    const response = await fetch(objectUrl);
    if (!response.ok) {
      // Fallback: If URL can't be fetched, treat the URL itself as the image
      return { front: objectUrl };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('image/')) {
      return { front: objectUrl };
    }

    try {
      const data = await response.json();
      
      // If it's a valid DirectionalAsset structure (even partial)
      if (isDirectionalAsset(data)) {
        return data;
      }
      
      // If JSON but not DirectionalAsset, use URL as fallback
      return { front: objectUrl };
    } catch (e) {
      // JSON parsing failed, treat it as a direct image URL
      return { front: objectUrl };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Error fetching asset from ${objectUrl}, using URL as fallback:`, errorMessage);
    return { front: objectUrl };
  }
};

/**
 * Gets the appropriate image URL from a directional asset based on direction
 * @param asset The directional asset
 * @param direction The direction to get the image for (optional)
 * @returns The image URL or undefined if not found
 */
export const getAssetImage = (asset: DirectionalAsset, direction?: 'left' | 'right' | 'front' | 'back'): string | undefined => {
  // If direction is specified and exists, use it
  if (direction && asset[direction]) {
    return asset[direction];
  }
  
  // Fall back to front if available
  if (asset.front) {
    return asset.front;
  }
  
  // Otherwise use any available image
  return asset.left || asset.right || asset.back;
};

/**
 * Preloads an image to ensure it's cached
 * @param url The image URL to preload
 * @returns A promise that resolves when the image is loaded
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};
