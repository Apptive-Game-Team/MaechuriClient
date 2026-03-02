import type { System, Entity } from 'react-game-engine';
import type { PlayerEntity, FogOfWarEntity } from '../types';
import { calculateVisibleTiles } from '../utils/raycastUtils';

const fogOfWarSystem: System = (entities: Record<string, Entity>) => {
  const player = entities.player as PlayerEntity;
  const fogOfWar = entities.fogOfWar as FogOfWarEntity;

  if (player?.position && fogOfWar) {
    // Always use discrete position for fog-of-war logic so that tile visibility
    // is determined by the player's actual tile, not the visual animation.
    const playerPos = player.position;

    // Adjust player position to be the center of the tile for raycasting
    const raycastOrigin = {
      x: playerPos.x + 0.5,
      y: playerPos.y + 0.5,
    };

    fogOfWar.visibleTiles = calculateVisibleTiles(raycastOrigin, fogOfWar.map);
    fogOfWar.playerPosition = raycastOrigin; // Pass centered position for opacity calculation
  }

  return entities;
};

export default fogOfWarSystem;
