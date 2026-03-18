import { checkCollision } from './gameUtils';
import type { Position } from '../types';

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

const heuristic = (ax: number, ay: number, bx: number, by: number): number =>
  Math.abs(ax - bx) + Math.abs(ay - by);

/**
 * Computes an A* path from start to goal using tile coordinates.
 * Returns waypoints from (exclusive) start to (inclusive) goal.
 * Returns empty array if already at goal or no path found.
 */
export const computePath = (start: Position, goal: Position): Position[] => {
  const sx = Math.round(start.x);
  const sy = Math.round(start.y);
  const gx = Math.round(goal.x);
  const gy = Math.round(goal.y);

  if (sx === gx && sy === gy) return [];

  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();
  const openMap = new Map<string, AStarNode>();

  const startH = heuristic(sx, sy, gx, gy);
  const startNode: AStarNode = { x: sx, y: sy, g: 0, h: startH, f: startH, parent: null };
  openList.push(startNode);
  openMap.set(`${sx},${sy}`, startNode);

  const DIRS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (openList.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[minIdx].f) minIdx = i;
    }
    const current = openList[minIdx];
    openList.splice(minIdx, 1);
    openMap.delete(`${current.x},${current.y}`);

    const ck = `${current.x},${current.y}`;
    if (closedSet.has(ck)) continue;
    closedSet.add(ck);

    if (current.x === gx && current.y === gy) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path.slice(1); // Exclude start position
    }

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nk = `${nx},${ny}`;
      if (closedSet.has(nk)) continue;
      if (checkCollision(nx, ny)) continue;

      const g = current.g + 1;
      const h = heuristic(nx, ny, gx, gy);
      const f = g + h;
      const existing = openMap.get(nk);
      if (existing && existing.g <= g) continue;

      const newNode: AStarNode = { x: nx, y: ny, g, h, f, parent: current };
      openList.push(newNode);
      openMap.set(nk, newNode);
    }
  }

  return []; // No path found
};
