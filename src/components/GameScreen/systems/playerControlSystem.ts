import type { System } from 'react-game-engine';
import { checkCollision } from '../utils/gameUtils';
import type { PlayerEntity, Direction, Position } from '../types';

interface PlayerMovedEvent {
  type: 'player-moved';
  position: Position;
}

interface PlayerMovedTileEvent {
  type: 'player-moved-tile';
  position: Position;
}

const playerControlSystem: System = (entities, { events, dispatch }) => {
  const player = entities.player as PlayerEntity;

  if (player) {
    if (!player.lastTilePosition) {
      player.lastTilePosition = { x: Math.round(player.position.x), y: Math.round(player.position.y) };
    }

    const moveEvents = (events as any[])
      .flat()
      .filter((e) => e && e.type && e.type.startsWith('move-'));

    if (moveEvents.length > 0) {
      let moveVector = { x: 0, y: 0 };
      let primaryDirection: Direction = player.direction;

      const moveTypes = new Set(moveEvents.map(e => e.type));

      if (moveTypes.has('move-up')) moveVector.y -= 1;
      if (moveTypes.has('move-down')) moveVector.y += 1;
      if (moveTypes.has('move-left')) moveVector.x -= 1;
      if (moveTypes.has('move-right')) moveVector.x += 1;

      if (moveVector.x !== 0 && moveVector.y !== 0) {
        const length = Math.sqrt(moveVector.x ** 2 + moveVector.y ** 2);
        moveVector.x /= length;
        moveVector.y /= length;
      }

      if (moveVector.y < 0) primaryDirection = 'up';
      else if (moveVector.y > 0) primaryDirection = 'down';
      else if (moveVector.x < 0) primaryDirection = 'left';
      else if (moveVector.x > 0) primaryDirection = 'right';
      
      player.direction = primaryDirection;

      const newX = player.position.x + moveVector.x * player.speed;
      const newY = player.position.y + moveVector.y * player.speed;

      if (!checkCollision(newX, newY)) {
        player.position = { x: newX, y: newY };
        (dispatch as (event: PlayerMovedEvent) => void)({
          type: 'player-moved',
          position: player.position,
        });

        const newTileX = Math.round(newX);
        const newTileY = Math.round(newY);

        if (newTileX !== player.lastTilePosition.x || newTileY !== player.lastTilePosition.y) {
          player.lastTilePosition = { x: newTileX, y: newTileY };
          (dispatch as (event: PlayerMovedTileEvent) => void)({
            type: 'player-moved-tile',
            position: player.lastTilePosition,
          });
        }
      }
    }
  }

  return entities;
};

export default playerControlSystem;
