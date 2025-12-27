import { useMemo } from 'react';
import { mockScenarioData } from '../../../data/mockData';
import type { Position, Direction, TileEntity, PlayerEntity } from '../types';
import type { AssetsState } from './useAssetLoader';
import { renderTile, renderPlayer } from '../components/renderers';

export const useGameEntities = (
  playerPosition: Position,
  interpolatedPosition: Position,
  playerDirection: Direction,
  assetsState: AssetsState
) => {
  return useMemo(() => {
    const result: Record<string, TileEntity | PlayerEntity> = {};
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
            renderer: renderTile,
          };
        });
      });
    });

    // Add player entity with interpolated position for smooth rendering
    result.player = {
      position: playerPosition,
      direction: playerDirection,
      asset: assetsState.player,
      interpolatedPosition,
      renderer: renderPlayer,
    };

    return result;
  }, [playerPosition, interpolatedPosition, playerDirection, assetsState]);
};
