import type { System } from 'react-game-engine';
import { checkCollision } from '../utils/gameUtils';
import type { PlayerEntity, Direction, Position } from '../types'; // Import Position type

// Define the type for the player-moved event
interface PlayerMovedEvent {
  type: 'player-moved';
  position: Position;
}

const playerControlSystem: System = (entities, { events, dispatch }) => {
  const player = entities.player as PlayerEntity;

  if (player) {
    // Filter for movement events
    const moveEvents = (events as { type: string }[]).filter((e) => e.type.startsWith('move-'));

    if (moveEvents.length > 0) {
      // Get the last movement event
      const moveEvent = moveEvents[moveEvents.length - 1];
      const newDirection = moveEvent.type.split('-')[1] as Direction;

      // Update player direction
      player.direction = newDirection;

      // Calculate new position based on direction
      let newX = player.position.x;
      let newY = player.position.y;

      switch (newDirection) {
        case 'up':
          newY -= 1;
          break;
        case 'down':
          newY += 1;
          break;
        case 'left':
          newX -= 1;
          break;
        case 'right':
          newX += 1;
          break;
      }

      // Check for collisions before updating the position
      if (!checkCollision(newX, newY)) {
        player.position = { x: newX, y: newY };
        (dispatch as (event: PlayerMovedEvent) => void)({
          type: 'player-moved',
          position: player.position,
        });
      }
    }
  }

  return entities;
};

export default playerControlSystem;
