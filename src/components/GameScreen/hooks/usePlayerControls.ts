import { useEffect, useCallback } from 'react';
import type { GameEngine } from 'react-game-engine';

export const usePlayerControls = (gameEngineRef: React.RefObject<GameEngine | null>) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameEngineRef.current) return;

    let eventType: string | null = null;

    // Determine event from key press
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        eventType = 'move-up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        eventType = 'move-down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        eventType = 'move-left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        eventType = 'move-right';
        break;
      case ' ':
      case 'e':
      case 'E':
        eventType = 'interact';
        break;
    }

    // Dispatch the event if one was determined
    if (eventType) {
      gameEngineRef.current.dispatch({ type: eventType });
    }
  }, [gameEngineRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
