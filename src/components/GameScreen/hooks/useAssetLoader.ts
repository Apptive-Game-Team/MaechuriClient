import { useState, useEffect } from 'react';
import type { DirectionalAsset, MapObject } from '../../../types/map';
import { fetchObjectAsset } from '../../../utils/assetLoader';

export interface AssetsState {
  objects: Map<number, DirectionalAsset>;
  player: DirectionalAsset | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to load and manage game assets
 * @param objects Array of map objects to load
 * @param playerObjectUrl URL for player object asset
 * @returns Assets state including loaded objects and player assets
 */
export const useAssetLoader = (objects: MapObject[], playerObjectUrl?: string): AssetsState => {
  const [assetsState, setAssetsState] = useState<AssetsState>({
    objects: new Map(),
    player: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadAssets = async () => {
      setAssetsState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Load object assets
        const objectAssets = new Map<number, DirectionalAsset>();
        await Promise.all(
          objects.map(async (obj) => {
            try {
              const asset = await fetchObjectAsset(obj.objectUrl);
              objectAssets.set(obj.id, asset);
            } catch {
              // Set empty asset for failed loads to allow graceful fallback
              console.warn(`Failed to load asset for object ${obj.id}, using fallback`);
              objectAssets.set(obj.id, {});
            }
          })
        );

        // Load player asset if URL is provided
        let playerAsset: DirectionalAsset | null = null;
        if (playerObjectUrl) {
          try {
            playerAsset = await fetchObjectAsset(playerObjectUrl);
          } catch {
            console.warn('Failed to load player asset, using fallback');
            playerAsset = {};
          }
        }

        setAssetsState({
          objects: objectAssets,
          player: playerAsset,
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
  }, [objects, playerObjectUrl]);

  return assetsState;
};
