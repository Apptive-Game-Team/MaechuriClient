import type { System } from 'react-game-engine';
import type { PlayerEntity, FogOfWarEntity } from '../types';
import { calculateVisibleTiles } from '../utils/raycastUtils';

const fogOfWarSystem: System = (entities) => {
  const player = entities.player as PlayerEntity;
  const fogOfWar = entities.fogOfWar as FogOfWarEntity;

  if (player?.position && fogOfWar) {
    // Use interpolated position for smoother updates if available
    const playerPos = player.interpolatedPosition || player.position;
    fogOfWar.visibleTiles = calculateVisibleTiles(playerPos);
    fogOfWar.playerPosition = playerPos; // Pass player position for opacity calculation
  }

  return entities;
};

export default fogOfWarSystem;
