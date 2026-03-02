import type { System, Entity } from 'react-game-engine';
import type { PlayerEntity, FogOfWarEntity } from '../types';
import { calculateVisibleTiles } from '../utils/raycastUtils';

const fogOfWarSystem: System = (entities: Record<string, Entity>, { events }) => {
  const player = entities.player as PlayerEntity;
  const fogOfWar = entities.fogOfWar as FogOfWarEntity;

  const movedTileEvents = (events as any[])
    .flat()
    .filter((e) => e && e.type && e.type === 'player-moved-tile');

  const shouldUpdate = movedTileEvents.length > 0 || !fogOfWar.isInitialized;

  if (shouldUpdate && player?.position && fogOfWar) {
    const playerPos = !fogOfWar.isInitialized ? player.position : movedTileEvents[movedTileEvents.length - 1].position;

    const raycastOrigin = {
      x: playerPos.x + 0.5,
      y: playerPos.y + 0.5,
    };

    fogOfWar.visibleTiles = calculateVisibleTiles(raycastOrigin, fogOfWar.map);
    fogOfWar.playerPosition = raycastOrigin;
    
    if (!fogOfWar.isInitialized) {
      fogOfWar.isInitialized = true;
    }
  }

  return entities;
};

export default fogOfWarSystem;
