import type { System } from 'react-game-engine';
import type { PlayerEntity, Position } from '../types';

interface InterpolatedPositionChangedEvent {
  type: 'interpolated-position-changed';
  position: Position;
}

const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

const interpolationSystem: System = (entities, { dispatch }) => {
  const player = entities.player as PlayerEntity;

  if (player) {
    if (!player.interpolatedPosition) {
      player.interpolatedPosition = { ...player.position };
    }

    player.interpolatedPosition.x = lerp(player.interpolatedPosition.x, player.position.x, 0.5);
    player.interpolatedPosition.y = lerp(player.interpolatedPosition.y, player.position.y, 0.5);

    // To avoid floating point inaccuracies, snap to target when very close
    if (Math.abs(player.interpolatedPosition.x - player.position.x) < 0.01 &&
        Math.abs(player.interpolatedPosition.y - player.position.y) < 0.01) {
      player.interpolatedPosition = { ...player.position };
    }

    (dispatch as (event: InterpolatedPositionChangedEvent) => void)({
      type: 'interpolated-position-changed',
      position: player.interpolatedPosition,
    });
  }

  return entities;
};

export default interpolationSystem;
