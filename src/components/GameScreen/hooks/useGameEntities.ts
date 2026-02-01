import { useMemo } from 'react';
import type { Position, Direction, TileEntity, FogOfWarEntity } from '../types';
import { PLAYER_ASSET_ID } from '../types';
import type { AssetsState } from './useAssetLoader';
import type { ScenarioData } from '../../../types/map';
import { Tile, Player } from '../components/renderers';
import { FogOfWar } from '../components/FogOfWar';

export const useGameEntities = (
  scenarioData: ScenarioData,
  playerPosition: Position,
  playerDirection: Direction,
  assetsState: AssetsState
) => {
  const tileEntities = useMemo(() => {
    const result: Record<string, TileEntity> = {};
    const { layers, objects } = scenarioData.map;

    // Sort layers by orderInLayer
    const sortedLayers = [...layers].sort((a, b) => a.orderInLayer - b.orderInLayer);

    // Create tile entities for each layer
    sortedLayers.forEach((layer) => {
      layer.tileMap.forEach((row, y) => {
        row.forEach((tileId, x) => {
          if (tileId === 0) return;
          const key = `${layer.name}-${x}-${y}`;
          const asset = assetsState.assets.get(tileId);
          result[key] = {
            position: { x, y },
            tileId,
            layer,
            asset,
            renderer: Tile,
          };
        });
      });
    });

    objects.forEach((object) => {
      const key = `${object.name}-${object.position.x}-${object.position.y}`;
      // Parse object ID to number for asset lookup if it's a numeric string
      // Object ID formats: "s:1" (suspect), "p:1" (player), "100" (legacy numeric)
      // All extract numeric part for asset lookup: "s:1" -> 1, "p:1" -> 1, "100" -> 100
      let assetId: number;
      if (/^\d+$/.test(object.id)) {
        // Pure numeric string like "100"
        assetId = parseInt(object.id, 10);
      } else {
        // Extract numeric part from IDs like "s:1" or "p:1"
        const match = object.id.match(/\d+/);
        if (match) {
          assetId = parseInt(match[0], 10);
        } else {
          console.warn(`Unable to extract asset ID from object ID: ${object.id}`);
          assetId = 0;
        }
      }
      const asset = assetsState.assets.get(assetId);
      result[key] = {
        position: object.position,
        tileId: object.id,
        layer: {
          orderInLayer: object.orderInLayer,
          name: object.name,
          type: object.type,
          tileMap: [],
        },
        asset,
        renderer: Tile,
      };
    });

    return result;
  }, [scenarioData.map, assetsState.assets]);

  const playerEntity = {
    position: playerPosition,
    direction: playerDirection,
    asset: assetsState.assets.get(PLAYER_ASSET_ID),
    renderer: Player,
  };

  const fogOfWarEntity: FogOfWarEntity = {
    visibleTiles: new Map<string, number>(),
    playerPosition: playerPosition,
    renderer: FogOfWar,
  };

  return {
    ...tileEntities,
    player: playerEntity,
    fogOfWar: fogOfWarEntity,
  };
};
