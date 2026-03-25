import { useMemo } from 'react';
import type { Position, Direction, TileEntity } from '../types';
import { PLAYER_ASSET_ID } from '../types';
import type { AssetsState } from './useAssetLoader';
import type { ScenarioData } from '../../../types/map';
import { Tile, Player } from '../components/renderers';
import { deriveRecordType, RecordType } from '../../../types/record'; // Import deriveRecordType

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
            isObject: false, // Explicitly mark as not an object
          };
        });
      });
    });

    objects.forEach((object) => {
      if (object.id === PLAYER_ASSET_ID) {
        return; // Skip the player entity
      }
      
      let objectType: TileEntity['objectType'] = undefined;
      const recordType = deriveRecordType(object.id);
      if (recordType === RecordType.CLUE) {
        objectType = RecordType.CLUE;
      } else if (recordType === RecordType.NPC) {
        objectType = RecordType.NPC; // This covers 'suspect'
      }
      // Add other specific types if needed, e.g., 'DETECTIVE' if they have a distinct ID prefix

      const key = `${object.name}-${object.position.x}-${object.position.y}`;
      const assetId = object.id;
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
        isObject: true, // Mark this entity as an object
        objectType: objectType,
      };
    });

    return result;
  }, [scenarioData.map, assetsState.assets]);

  const playerAssetId = PLAYER_ASSET_ID;
  const playerEntity = {
    position: playerPosition,
    direction: playerDirection,
    speed: 0.2,
    asset: assetsState.assets.get(playerAssetId),
    renderer: Player,
    objectType: 'PLAYER', // Add objectType for player
  };

  return {
    ...tileEntities,
    player: playerEntity,
  };
};
