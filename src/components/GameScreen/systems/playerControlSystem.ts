import type { System } from 'react-game-engine';
import { checkCollision } from '../utils/gameUtils';
import { computePath } from '../utils/pathfinding';
import type { PlayerEntity, Direction, Position } from '../types';

interface PlayerMovedEvent {
  type: 'player-moved';
  position: Position;
}

interface PlayerMovedTileEvent {
  type: 'player-moved-tile';
  position: Position;
}

// Adjacent offsets relative to an interactable tile: position to stand + direction to face it
const INTERACT_ADJACENTS: { dx: number; dy: number; direction: Direction }[] = [
  { dx: -1, dy: 0, direction: 'right' }, // stand to the left,  face right
  { dx: 1,  dy: 0, direction: 'left'  }, // stand to the right, face left
  { dx: 0, dy: -1, direction: 'down'  }, // stand above,        face down
  { dx: 0, dy:  1, direction: 'up'    }, // stand below,        face up
];

interface GameEvent {
  type: string;
  [key: string]: unknown;
}

interface NavigateEvent extends GameEvent {
  type: 'navigate-to';
  target: Position;
}

interface ClickInteractEvent extends GameEvent {
  type: 'click-interact';
  target: Position;
}

type DispatchFn = (e: unknown) => void;

const dispatchMoved = (
  dispatch: DispatchFn,
  player: PlayerEntity,
) => {
  (dispatch as (event: PlayerMovedEvent) => void)({
    type: 'player-moved',
    position: player.position,
  });

  const newTileX = Math.round(player.position.x);
  const newTileY = Math.round(player.position.y);

  if (
    player.lastTilePosition &&
    (newTileX !== player.lastTilePosition.x || newTileY !== player.lastTilePosition.y)
  ) {
    player.lastTilePosition = { x: newTileX, y: newTileY };
    (dispatch as (event: PlayerMovedTileEvent) => void)({
      type: 'player-moved-tile',
      position: player.lastTilePosition,
    });
  }
};

const playerControlSystem: System = (entities, { events, dispatch: rawDispatch }) => {
  const dispatch = rawDispatch as DispatchFn;
  const player = entities.player as PlayerEntity;

  if (player) {
    if (!player.lastTilePosition) {
      player.lastTilePosition = { x: Math.round(player.position.x), y: Math.round(player.position.y) };
    }

    const allEvents = (events as GameEvent[][]).flat();
    const moveEvents = allEvents.filter((e) => e?.type?.startsWith('move-'));
    const navigateEvent = allEvents.find((e) => e?.type === 'navigate-to') as NavigateEvent | undefined;
    const clickInteractEvent = allEvents.find((e) => e?.type === 'click-interact') as ClickInteractEvent | undefined;

    if (moveEvents.length > 0) {
      // Keyboard input cancels any active path
      player.pathQueue = undefined;
      player.pendingInteraction = false;
      player.pendingInteractDirection = undefined;

      const moveVector = { x: 0, y: 0 };
      let primaryDirection: Direction = player.direction;

      const moveTypes = new Set(moveEvents.map((e) => e.type));

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
        dispatchMoved(dispatch, player);
      }
    } else if (navigateEvent) {
      // Navigate to a clicked walkable tile via A*
      const path = computePath(player.position, navigateEvent.target);
      player.pathQueue = path.length > 0 ? path : undefined;
      player.pendingInteraction = false;
      player.pendingInteractDirection = undefined;
    } else if (clickInteractEvent) {
      // Navigate to an adjacent tile, then interact with the object
      const target = clickInteractEvent.target;
      const passable = INTERACT_ADJACENTS
        .map(({ dx, dy, direction }) => ({ x: target.x + dx, y: target.y + dy, direction }))
        .filter(({ x, y }) => !checkCollision(x, y));

      if (passable.length > 0) {
        const px = Math.round(player.position.x);
        const py = Math.round(player.position.y);
        const nearest = passable.sort(
          (a, b) =>
            Math.abs(a.x - px) + Math.abs(a.y - py) -
            (Math.abs(b.x - px) + Math.abs(b.y - py)),
        )[0];

        const path = computePath(player.position, { x: nearest.x, y: nearest.y });

        if (path.length === 0) {
          // Already at the adjacent tile – interact immediately
          player.direction = nearest.direction;
          dispatch({ type: 'interact' });
        } else {
          player.pathQueue = path;
          player.pendingInteraction = true;
          player.pendingInteractDirection = nearest.direction;
        }
      }
    } else if (player.pathQueue && player.pathQueue.length > 0) {
      // Follow the A* path
      const next = player.pathQueue[0];
      const dx = next.x - player.position.x;
      const dy = next.y - player.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Update facing direction based on movement
      if (Math.abs(dx) >= Math.abs(dy)) {
        player.direction = dx >= 0 ? 'right' : 'left';
      } else {
        player.direction = dy >= 0 ? 'down' : 'up';
      }

      if (dist <= player.speed) {
        // Arrived at this waypoint – snap position
        player.position = { x: next.x, y: next.y };
        player.pathQueue.shift();

        if (player.pathQueue.length === 0) {
          // Path complete
          if (player.pendingInteraction && player.pendingInteractDirection) {
            player.direction = player.pendingInteractDirection;
            player.pendingInteraction = false;
            player.pendingInteractDirection = undefined;
            dispatch({ type: 'interact' });
          }
          player.pathQueue = undefined;
        }
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const newX = player.position.x + nx * player.speed;
        const newY = player.position.y + ny * player.speed;

        if (!checkCollision(newX, newY)) {
          player.position = { x: newX, y: newY };
        } else {
          // Unexpected collision – abort path
          player.pathQueue = undefined;
          player.pendingInteraction = false;
          player.pendingInteractDirection = undefined;
        }
      }

      dispatchMoved(dispatch, player);
    }
  }

  return entities;
};

export default playerControlSystem;
