import { useEffect, useCallback, useRef } from 'react';
import type { GameEngine } from 'react-game-engine';

export const usePlayerControls = (gameEngineRef: React.RefObject<GameEngine | null>) => {
  const activeKeys = useRef(new Set<string>());
  const interactionKeyPressed = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    activeKeys.current.add(key);

    if ((key === ' ' || key === 'e') && !interactionKeyPressed.current) {
      interactionKeyPressed.current = true;
      gameEngineRef.current?.dispatch({ type: 'interact' });
    }
  }, [gameEngineRef]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    activeKeys.current.delete(key);
    if (key === ' ' || key === 'e') {
      interactionKeyPressed.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      if (!gameEngineRef.current) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const events = [];
      if (activeKeys.current.has('arrowup') || activeKeys.current.has('w')) {
        events.push({ type: 'move-up' });
      }
      if (activeKeys.current.has('arrowdown') || activeKeys.current.has('s')) {
        events.push({ type: 'move-down' });
      }
      if (activeKeys.current.has('arrowleft') || activeKeys.current.has('a')) {
        events.push({ type: 'move-left' });
      }
      if (activeKeys.current.has('arrowright') || activeKeys.current.has('d')) {
        events.push({ type: 'move-right' });
      }

      if (events.length > 0) {
        gameEngineRef.current.dispatch(events);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameEngineRef, handleKeyDown, handleKeyUp]);
};
