import { useEffect, useCallback } from 'react';
import type { GameEngine } from 'react-game-engine';
import { checkCollision, getObjectInfo, checkInteraction, setHoveredInteractable } from '../utils/gameUtils';
import { TILE_SIZE } from '../types';

/**
 * Parses a CSS translate() string and returns the X/Y offsets in pixels.
 * Returns { x: 0, y: 0 } when no valid transform is found.
 */
const parseTranslate = (transform: string): { x: number; y: number } => {
  const match = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(transform);
  if (!match) return { x: 0, y: 0 };
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
};

/**
 * Converts a pointer event position (relative to the viewport element) into
 * tile grid coordinates by accounting for the camera transform applied to
 * the game container.
 */
const toTileCoords = (
  clientX: number,
  clientY: number,
  viewportEl: HTMLElement,
  containerEl: HTMLElement,
): { tileX: number; tileY: number } => {
  const rect = viewportEl.getBoundingClientRect();
  const { x: translateX, y: translateY } = parseTranslate(containerEl.style.transform);

  const worldX = (clientX - rect.left - translateX) / TILE_SIZE;
  const worldY = (clientY - rect.top - translateY) / TILE_SIZE;

  return { tileX: Math.floor(worldX), tileY: Math.floor(worldY) };
};

/**
 * Hook that handles mouse-based game controls:
 *  - Click on a walkable tile  → navigate there via A*
 *  - Click on an interactable  → navigate to adjacent tile then interact
 *  - Hover over an interactable → highlight it visually
 */
export const useMouseControls = (
  gameEngineRef: React.RefObject<GameEngine | null>,
  gameContainerRef: React.RefObject<HTMLDivElement | null>,
  viewportRef: React.RefObject<HTMLDivElement | null>,
) => {
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const viewport = viewportRef.current;
      const container = gameContainerRef.current;
      if (!viewport || !container || !gameEngineRef.current) return;

      const { tileX, tileY } = toTileCoords(e.clientX, e.clientY, viewport, container);

      const objectInfo = getObjectInfo(tileX, tileY);
      if (objectInfo) {
        // Clicked on an interactable MapObject → navigate-to-interact
        gameEngineRef.current.dispatch({ type: 'click-interact', target: { x: tileX, y: tileY } });
      } else if (checkInteraction(tileX, tileY) !== null) {
        // Layer-based interactable (tile) – treat as plain navigation for now
        if (!checkCollision(tileX, tileY)) {
          gameEngineRef.current.dispatch({ type: 'navigate-to', target: { x: tileX, y: tileY } });
        }
      } else if (!checkCollision(tileX, tileY)) {
        // Walkable non-interactable tile → navigate there
        gameEngineRef.current.dispatch({ type: 'navigate-to', target: { x: tileX, y: tileY } });
      }
    },
    [gameEngineRef, gameContainerRef, viewportRef],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const viewport = viewportRef.current;
      const container = gameContainerRef.current;
      if (!viewport || !container) return;

      const { tileX, tileY } = toTileCoords(e.clientX, e.clientY, viewport, container);

      const objectInfo = getObjectInfo(tileX, tileY);
      if (objectInfo) {
        setHoveredInteractable(objectInfo.id);
        viewport.style.cursor = 'pointer';
      } else {
        setHoveredInteractable(null);
        viewport.style.cursor = 'default';
      }
    },
    [gameContainerRef, viewportRef],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredInteractable(null);
    if (viewportRef.current) {
      viewportRef.current.style.cursor = 'default';
    }
  }, [viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('click', handleClick);
    viewport.addEventListener('mousemove', handleMouseMove);
    viewport.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      viewport.removeEventListener('click', handleClick);
      viewport.removeEventListener('mousemove', handleMouseMove);
      viewport.removeEventListener('mouseleave', handleMouseLeave);
      setHoveredInteractable(null);
    };
  }, [viewportRef, handleClick, handleMouseMove, handleMouseLeave]);
};
