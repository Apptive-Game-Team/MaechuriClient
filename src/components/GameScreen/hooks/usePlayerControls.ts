import React, { useEffect, useCallback } from 'react';
import type { Direction, Position } from '../types';
import { checkCollision, checkInteraction, getFacingPosition } from '../utils/gameUtils';

export const usePlayerControls = (
  playerDirection: Direction,
  setPlayerPosition: React.Dispatch<React.SetStateAction<Position>>,
  setPlayerDirection: React.Dispatch<React.SetStateAction<Direction>>
) => {
  const getFacingPositionCallback = useCallback((position: Position): Position => {
    return getFacingPosition(position, playerDirection);
  }, [playerDirection]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newDirection: Direction | null = null;

    // Determine direction from key press
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newDirection = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newDirection = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newDirection = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newDirection = 'right';
        break;
      case ' ':
      case 'e':
      case 'E':
        // Interact key - only check the direction the player is facing
        setPlayerPosition((currentPosition) => {
          const facingPosition = getFacingPositionCallback(currentPosition);
          const interactableId = checkInteraction(facingPosition.x, facingPosition.y);
          if (interactableId !== null) {
            alert(`Interacting with object ID: ${interactableId}`);
          }
          return currentPosition;
        });
        return;
    }

    // Update direction if a movement key was pressed
    if (newDirection) {
      setPlayerDirection(newDirection);
      
      // Try to move in the new direction
      setPlayerPosition((currentPosition) => {
        let newX = currentPosition.x;
        let newY = currentPosition.y;

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

        if (!checkCollision(newX, newY)) {
          return { x: newX, y: newY };
        }
        return currentPosition;
      });
    }
  }, [getFacingPositionCallback, setPlayerPosition, setPlayerDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
