import { useMemo } from 'react';
import { mockScenarioData } from '../../../data/mockData';
import type { Position, Direction, TileEntity } from '../types';
import type { AssetsState } from './useAssetLoader';
import { Tile, Player } from '../components/renderers';

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
          const asset = assetsState.objects.get(tileId);
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
  }, [assetsState.objects]);

  const playerEntity = {
    position: playerPosition,
    direction: playerDirection,
    asset: assetsState.player,
    renderer: Player,
  };

  return {
    ...tileEntities,
    player: playerEntity,
  };
};
