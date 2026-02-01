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
          const asset = assetsState.assets.get(String(tileId));
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
      if (object.id === PLAYER_ASSET_ID) {
        return; // Skip the player entity
      }
      const key = `${object.name}-${object.position.x}-${object.position.y}`;
      const asset = assetsState.assets.get(object.id);
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

  const mapWidth = scenarioData.map.layers[0]?.tileMap[0]?.length || 0;
  const mapHeight = scenarioData.map.layers[0]?.tileMap?.length || 0;

  const fogOfWarEntity: FogOfWarEntity = {
    visibleTiles: new Map<string, number>(),
    playerPosition: playerPosition,
    mapWidth: mapWidth,
    mapHeight: mapHeight,
    renderer: FogOfWar,
  };

  return {
    ...tileEntities,
    player: playerEntity,
    fogOfWar: fogOfWarEntity,
    scenarioData: scenarioData, // Add scenarioData to entities for fogOfWarSystem
  };
};