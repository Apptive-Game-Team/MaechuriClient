import { useState, useEffect } from 'react';
import type { DirectionalAsset, Asset } from '../../../types/map';
import { fetchObjectAsset } from '../../../utils/assetLoader';

export interface AssetsState {
  assets: Map<string, DirectionalAsset>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to load and manage game assets
 * @param assets Array of assets to load
 * @returns Assets state including loaded assets
 */
export const useAssetLoader = (assets: Asset[]): AssetsState => {
  const [assetsState, setAssetsState] = useState<AssetsState>({
    assets: new Map(),
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadAssets = async () => {
      setAssetsState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!Array.isArray(assets)) {
          throw new Error('Asset data is not an array. Check API response.');
        }
        // Load assets
        const loadedAssets = new Map<string, DirectionalAsset>();
        await Promise.all(
          assets.map(async (asset) => {
            try {
              const loadedAsset = await fetchObjectAsset(asset.imageUrl);
              loadedAssets.set(String(asset.id), loadedAsset);
            } catch (e) {
              // Set empty asset for failed loads to allow graceful fallback
              console.error(`Failed to load asset ${asset.id}`, e);
              console.warn(`Failed to load asset ${asset.id}, using fallback`);
              loadedAssets.set(asset.id, {});
            }
          })
        );

        setAssetsState({
          assets: loadedAssets,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading assets:', error);
        setAssetsState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load assets',
        }));
      }
    };

    loadAssets();
  }, [assets]); // Changed dependency from JSON.stringify(assets) to assets

  return assetsState;
};
