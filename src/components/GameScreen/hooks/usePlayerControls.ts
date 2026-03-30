import { useEffect, useCallback, useRef } from 'react';
import type { GameEngine } from 'react-game-engine';

export const usePlayerControls = (
  gameEngineRef: React.RefObject<GameEngine | null>,
  isModalOpen: boolean
) => {
  const interactionKeyPressed = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isModalOpen) return;
    const key = e.key.toLowerCase();

    // Dispatch keydown event to the engine
    gameEngineRef.current?.dispatch({ type: 'key-down', key });

    if ((key === ' ' || key === 'e') && !interactionKeyPressed.current) {
      interactionKeyPressed.current = true;
      gameEngineRef.current?.dispatch({ type: 'interact' });
    }
  }, [gameEngineRef, isModalOpen]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    
    // Dispatch keyup event to the engine
    gameEngineRef.current?.dispatch({ type: 'key-up', key });

    if (key === ' ' || key === 'e') {
      interactionKeyPressed.current = false;
    }
  }, [gameEngineRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
};
