import { useMemo } from 'react';
import type { Position, Direction, TileEntity } from '../types';
import { PLAYER_ASSET_ID } from '../types';
import type { AssetsState } from './useAssetLoader';
import type { ScenarioData, MapObject } from '../../../types/map';
import { Tile, Player, MapLayer } from '../components/renderers';
import { deriveRecordType, RecordType } from '../../../types/record';
import { getAssetImage } from '../../../utils/assetLoader';

export const useGameEntities = (
  scenarioData: ScenarioData,
  assetsState: AssetsState
) => {
  return useMemo(() => {
    const result: Record<string, any> = {};
    const { layers, objects } = scenarioData.map;

    // 1. Static Layers
    const sortedLayers = [...layers].sort((a, b) => a.orderInLayer - b.orderInLayer);
    sortedLayers.forEach((layer) => {
      const tilesInLayer: any[] = [];
      layer.tileMap.forEach((row, y) => {
        row.forEach((tileId, x) => {
          if (tileId === 0) return;
          const asset = assetsState.assets.get(String(tileId));
          tilesInLayer.push({ x, y, tileId, imageUrl: asset ? getAssetImage(asset) : undefined });
        });
      });
      if (tilesInLayer.length > 0) {
        result[`layer-${layer.name}`] = {
          renderer: MapLayer,
          layerName: layer.name,
          orderInLayer: layer.orderInLayer,
          tiles: tilesInLayer,
        };
      }
    });

    // 2. Objects
    objects.forEach((object) => {
      if (object.id === PLAYER_ASSET_ID) return;
      const recordType = deriveRecordType(object.id);
      const asset = assetsState.assets.get(object.id);
      result[`obj-${object.id}-${object.position.x}-${object.position.y}`] = {
        position: { ...object.position },
        tileId: object.id,
        layer: { orderInLayer: object.orderInLayer, name: object.name, type: object.type, tileMap: [] },
        asset,
        renderer: Tile,
        isObject: true,
        objectType: recordType === RecordType.CLUE ? RecordType.CLUE : (recordType === RecordType.NPC ? RecordType.NPC : undefined),
      };
    });

    // 3. Player (Initialize once)
    const playerObj = objects.find((obj: MapObject) => obj.id === PLAYER_ASSET_ID);
    result.player = {
      position: playerObj ? { ...playerObj.position } : { x: 5, y: 5 },
      direction: (playerObj?.direction as Direction) || 'down',
      speed: 0.15,
      asset: assetsState.assets.get(PLAYER_ASSET_ID),
      renderer: Player,
      objectType: 'PLAYER',
    };

    return result;
  }, [scenarioData.map, assetsState.assets]);
};
