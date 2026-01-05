import { useMemo } from 'react';
import { mockScenarioData } from '../../../data/mockData';
import type { Position, Direction, TileEntity, FogOfWarEntity } from '../types';
import type { AssetsState } from './useAssetLoader';
import { Tile, Player } from '../components/renderers';
import { FogOfWar } from '../components/FogOfWar';

export const useGameEntities = (
  playerPosition: Position,
  playerDirection: Direction,
  assetsState: AssetsState
) => {
  const tileEntities = useMemo(() => {
    const result: Record<string, TileEntity> = {};
    const { layers } = mockScenarioData.map;

    // Sort layers by orderInLayer
    const sortedLayers = [...layers].sort((a, b) => a.orderInLayer - b.orderInLayer);

    // Create tile entities for each layer
    sortedLayers.forEach((layer) => {
      layer.tileMap.forEach((row, y) => {
        row.forEach((tileId, x) => {
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
    return result;
  }, [assetsState.assets]);

  const playerEntity = {
    position: playerPosition,
    direction: playerDirection,
    asset: assetsState.assets.get(999), // Player asset ID is 999
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
