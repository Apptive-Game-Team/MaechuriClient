import type { System } from 'react-game-engine';
import { checkCollision } from '../utils/gameUtils';
import { computePath } from '../utils/pathfinding';
import type { Direction } from '../types';

const INTERACT_ADJACENTS: { dx: number; dy: number; direction: Direction }[] = [
  { dx: -1, dy: 0, direction: 'right' },
  { dx: 1,  dy: 0, direction: 'left'  },
  { dx: 0, dy: -1, direction: 'down'  },
  { dx: 0, dy:  1, direction: 'up'    },
];

// Initialize player state if not present
const ensurePlayerState = (player: any) => {
  if (!player.activeKeys) player.activeKeys = new Set<string>();
};

const playerControlSystem: System = (entities, { events, time, dispatch }) => {
  const player = entities.player as any; // Cast as any to handle dynamic state
  const delta = (time as any).delta || 16.66;
  const dt = delta / 16.66; // Normalize to 60fps

  if (!player) return entities;
  ensurePlayerState(player);

  const allEvents = (events as any[][]).flat();
  
  // 1. Handle Input Events (Key Down / Up)
  allEvents.forEach(e => {
    if (e.type === 'key-down') player.activeKeys.add(e.key);
    if (e.type === 'key-up') player.activeKeys.delete(e.key);
    if (e.type === 'navigate-to' || e.type === 'click-interact') {
      player.activeKeys.clear(); // Clear keyboard input on mouse nav
    }
  });

  const navigateEvent = allEvents.find((e) => e?.type === 'navigate-to');
  const clickInteractEvent = allEvents.find((e) => e?.type === 'click-interact');

  // 2. Keyboard Movement Logic (State-driven)
  const isMovingViaKeyboard = player.activeKeys.size > 0 && !player.pathQueue;
  if (isMovingViaKeyboard) {
    player.pendingInteraction = false;

    const moveVector = { x: 0, y: 0 };
    if (player.activeKeys.has('arrowup') || player.activeKeys.has('w')) moveVector.y -= 1;
    if (player.activeKeys.has('arrowdown') || player.activeKeys.has('s')) moveVector.y += 1;
    if (player.activeKeys.has('arrowleft') || player.activeKeys.has('a')) moveVector.x -= 1;
    if (player.activeKeys.has('arrowright') || player.activeKeys.has('d')) moveVector.x += 1;

    if (moveVector.x !== 0 || moveVector.y !== 0) {
      // Normalize for consistent diagonal speed
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

      // Sliding collision response
      if (!checkCollision(nextX, player.position.y)) player.position.x = nextX;
      if (!checkCollision(player.position.x, nextY)) player.position.y = nextY;
    }
  } 
  
  // 3. Mouse Navigation Entry
  else if (navigateEvent) {
    const path = computePath(player.position, navigateEvent.target);
    player.pathQueue = path.length > 0 ? path : undefined;
    player.pendingInteraction = false;
  } 
  
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

  // 4. Follow Path (Improved with step-consumption loop)
  if (player.pathQueue && player.pathQueue.length > 0) {
    // Limit max energy consumption per frame to avoid "teleporting" if dt spikes
    let remainingStep = Math.min(player.speed * dt, player.speed * 2); 

    while (remainingStep > 0 && player.pathQueue && player.pathQueue.length > 0) {
      const next = player.pathQueue[0];
      const dx = next.x - player.position.x;
      const dy = next.y - player.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.01) {
        if (Math.abs(dx) >= Math.abs(dy)) player.direction = dx >= 0 ? 'right' : 'left';
        else player.direction = dy >= 0 ? 'down' : 'up';
      }

      if (dist <= remainingStep) {
        player.position = { ...next };
        remainingStep -= dist;
        player.pathQueue.shift();
        
        if (player.pathQueue.length === 0) {
          if (player.pendingInteraction && player.pendingInteractDirection) {
            player.direction = player.pendingInteractDirection;
            player.pendingInteraction = false;
            dispatch({ type: 'interact' });
          }
          player.pathQueue = undefined;
          break;
        }
      } else {
        player.position.x += (dx / dist) * remainingStep;
        player.position.y += (dy / dist) * remainingStep;
        remainingStep = 0;
      }
    }
  }

  return entities;
};

export default playerControlSystem;
