import type { System } from 'react-game-engine';
import type { PlayerEntity, Position } from '../types';

interface InterpolatedPositionChangedEvent {
  type: 'interpolated-position-changed';
  position: Position;
}

const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

// Frame-rate independent lerp
const damp = (current: number, target: number, lambda: number, dt: number) => {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
};

const interpolationSystem: System = (entities, { time, dispatch }) => {
  const player = entities.player as PlayerEntity;

  if (player) {
    if (!player.interpolatedPosition) {
      player.interpolatedPosition = { ...player.position };
    }

    const dt = time.delta / 1000;
    // Lower lambda (18 -> 10) for a "softer", more fluid follow feel.
    const lambda = 10; 

    const prevX = player.interpolatedPosition.x;
    const prevY = player.interpolatedPosition.y;

    player.interpolatedPosition.x = damp(player.interpolatedPosition.x, player.position.x, lambda, dt);
    player.interpolatedPosition.y = damp(player.interpolatedPosition.y, player.position.y, lambda, dt);

    // Snap to target when extremely close to prevent sub-pixel jitter
    const distSq = 
      Math.pow(player.interpolatedPosition.x - player.position.x, 2) + 
      Math.pow(player.interpolatedPosition.y - player.position.y, 2);

    if (distSq < 0.000001) {
      player.interpolatedPosition.x = player.position.x;
      player.interpolatedPosition.y = player.position.y;
    }

    // Always dispatch when there is any movement to ensure the camera (transform) 
    // updates in perfect sync with the renderer at 60fps.
    if (player.interpolatedPosition.x !== prevX || player.interpolatedPosition.y !== prevY) {
      (dispatch as (event: InterpolatedPositionChangedEvent) => void)({
        type: 'interpolated-position-changed',
        position: player.interpolatedPosition,
      });
    }
  }

  return entities;
};

export default interpolationSystem;
