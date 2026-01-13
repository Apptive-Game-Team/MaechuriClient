import { checkCollision } from '../utils/gameUtils';
import type { PlayerEntity } from '../types';

const playerControlSystem = (entities: { player?: PlayerEntity }, { events }: { type: string }[]) => {
  const player = entities.player;

  if (player) {
    // Filter for movement events
    const moveEvents = events.filter((e) => e.type.startsWith('move-'));

    if (moveEvents.length > 0) {
      // Get the last movement event
      const moveEvent = moveEvents[moveEvents.length - 1];
      const newDirection = moveEvent.type.split('-')[1];

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
      }
    }
  }

  return entities;
};

export default playerControlSystem;
