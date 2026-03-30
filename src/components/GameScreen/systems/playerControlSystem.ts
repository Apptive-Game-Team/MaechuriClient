import type { System } from 'react-game-engine';
import { checkCollision } from '../utils/gameUtils';
import { computePath } from '../utils/pathfinding';
import type { PlayerEntity, Direction } from '../types';

const INTERACT_ADJACENTS: { dx: number; dy: number; direction: Direction }[] = [
  { dx: -1, dy: 0, direction: 'right' },
  { dx: 1,  dy: 0, direction: 'left'  },
  { dx: 0, dy: -1, direction: 'down'  },
  { dx: 0, dy:  1, direction: 'up'    },
];

const playerControlSystem: System = (entities, { events, time, dispatch }) => {
  const player = entities.player as PlayerEntity;
  const dt = time.delta / 16.66; // Normalize to 60fps

  if (!player) return entities;

  const allEvents = (events as any[][]).flat();
  const moveEvents = allEvents.filter((e) => e?.type?.startsWith('move-'));
  const navigateEvent = allEvents.find((e) => e?.type === 'navigate-to');
  const clickInteractEvent = allEvents.find((e) => e?.type === 'click-interact');

  // 1. Keyboard Movement
  if (moveEvents.length > 0) {
    player.pathQueue = undefined;
    player.pendingInteraction = false;

    const moveVector = { x: 0, y: 0 };
    const moveTypes = new Set(moveEvents.map((e) => e.type));
    if (moveTypes.has('move-up')) moveVector.y -= 1;
    if (moveTypes.has('move-down')) moveVector.y += 1;
    if (moveTypes.has('move-left')) moveVector.x -= 1;
    if (moveTypes.has('move-right')) moveVector.x += 1;

    if (moveVector.x !== 0 && moveVector.y !== 0) {
      const len = Math.sqrt(moveVector.x ** 2 + moveVector.y ** 2);
      moveVector.x /= len;
      moveVector.y /= len;
    }

    if (moveVector.y < 0) player.direction = 'up';
    else if (moveVector.y > 0) player.direction = 'down';
    else if (moveVector.x < 0) player.direction = 'left';
    else if (moveVector.x > 0) player.direction = 'right';

    const step = player.speed * dt;
    const nextX = player.position.x + moveVector.x * step;
    const nextY = player.position.y + moveVector.y * step;

    if (!checkCollision(nextX, player.position.y)) player.position.x = nextX;
    if (!checkCollision(player.position.x, nextY)) player.position.y = nextY;
  } 
  
  // 2. Mouse Navigation (A*)
  else if (navigateEvent) {
    const path = computePath(player.position, navigateEvent.target);
    player.pathQueue = path.length > 0 ? path : undefined;
    player.pendingInteraction = false;
  } 
  
  // 3. Click Interact (Path + Action)
  else if (clickInteractEvent) {
    const target = clickInteractEvent.target;
    const passable = INTERACT_ADJACENTS
      .map(({ dx, dy, direction }) => ({ x: target.x + dx, y: target.y + dy, direction }))
      .filter(({ x, y }) => !checkCollision(x, y))
      .sort((a, b) => (Math.abs(a.x - player.position.x) + Math.abs(a.y - player.position.y)) - (Math.abs(b.x - player.position.x) + Math.abs(b.y - player.position.y)));

    if (passable.length > 0) {
      const nearest = passable[0];
      const path = computePath(player.position, { x: nearest.x, y: nearest.y });
      if (path.length === 0) {
        player.direction = nearest.direction;
        dispatch({ type: 'interact' });
      } else {
        player.pathQueue = path;
        player.pendingInteraction = true;
        player.pendingInteractDirection = nearest.direction;
      }
    }
  }

  // 4. Follow Path
  if (player.pathQueue && player.pathQueue.length > 0) {
    const next = player.pathQueue[0];
    const dx = next.x - player.position.x;
    const dy = next.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = player.speed * dt;

    if (Math.abs(dx) >= Math.abs(dy)) player.direction = dx >= 0 ? 'right' : 'left';
    else player.direction = dy >= 0 ? 'down' : 'up';

    if (dist <= step) {
      player.position = { ...next };
      player.pathQueue.shift();
      if (player.pathQueue.length === 0) {
        if (player.pendingInteraction && player.pendingInteractDirection) {
          player.direction = player.pendingInteractDirection;
          player.pendingInteraction = false;
          dispatch({ type: 'interact' });
        }
        player.pathQueue = undefined;
      }
    } else {
      player.position.x += (dx / dist) * step;
      player.position.y += (dy / dist) * step;
    }
  }

  return entities;
};

export default playerControlSystem;
