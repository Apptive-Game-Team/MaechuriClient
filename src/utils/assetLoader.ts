import type { DirectionalAsset } from '../types/map';

export interface LoadedAsset {
  id: number;
  asset: DirectionalAsset;
}

/**
 * Fetches an object asset from a URL
 * @param objectUrl The URL to fetch the object asset from
 * @returns A promise that resolves to a DirectionalAsset
 */
export const fetchObjectAsset = async (objectUrl: string): Promise<DirectionalAsset> => {
  try {
    const response = await fetch(objectUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset from ${objectUrl}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as DirectionalAsset;
  } catch (error) {
    console.error(`Error fetching asset from ${objectUrl}:`, error);
    // Return an empty asset on error
    return {};
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
