import { MOVEMENT_DURATION } from '../types';
import type { PlayerEntity } from '../types';

interface GameLoopArgs {
  current: number;
  delta: number;
}

interface SystemArgs {
  time: GameLoopArgs;
  events: any[];
  screen: any;
  input: any;
  [key: string]: any; // Allow other properties
}

const interpolationSystem = (entities: { player?: PlayerEntity }, args: Record<string, unknown>) => {
  const { time } = args as SystemArgs;
  const player = entities.player;

  if (player) {
    // Initialize properties if they don't exist
    if (!player.interpolatedPosition) {
      player.interpolatedPosition = { ...player.position };
    }
    if (!player.animation) {
      player.animation = {
        startTime: time.current,
        startPos: { ...player.position },
        targetPos: { ...player.position },
      };
    }

    // If the main position prop changes, it means we have a new target.
    // We start a new animation.
    if (
      player.position.x !== player.animation.targetPos.x ||
      player.position.y !== player.animation.targetPos.y
    ) {
      player.animation.startTime = time.current;
      player.animation.startPos = { ...player.interpolatedPosition };
      player.animation.targetPos = { ...player.position };
    }

    const { startTime, startPos, targetPos } = player.animation;
    const elapsed = time.current - startTime;
    const progress = Math.min(elapsed / MOVEMENT_DURATION, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const newX = startPos.x + (targetPos.x - startPos.x) * easedProgress;
    const newY = startPos.y + (targetPos.y - startPos.y) * easedProgress;

    player.interpolatedPosition = { x: newX, y: newY };

    // When animation is complete, snap to the target position
    if (progress >= 1) {
      player.interpolatedPosition = { ...targetPos };
    }
  }

  return entities;
};

export default interpolationSystem;
