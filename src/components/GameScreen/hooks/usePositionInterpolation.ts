import { useState, useEffect, useRef } from 'react';
import type { Position } from '../types';
import { MOVEMENT_DURATION } from '../types';

/**
 * Hook to smoothly interpolate player position changes
 * @param targetPosition The target position to move to
 * @returns The interpolated position for rendering
 */
export const usePositionInterpolation = (targetPosition: Position): Position => {
  const [interpolatedPosition, setInterpolatedPosition] = useState<Position>(targetPosition);
  const animationFrameRef = useRef<number | null>(null);
  const startPositionRef = useRef<Position>(targetPosition);
  const startTimeRef = useRef<number | null>(null);
  const previousTargetRef = useRef<Position>(targetPosition);

  useEffect(() => {
    const prevTarget = previousTargetRef.current;
    
    // If position hasn't changed, do nothing
    if (
      targetPosition.x === prevTarget.x &&
      targetPosition.y === prevTarget.y
    ) {
      return;
    }

    // Update previous target
    previousTargetRef.current = targetPosition;

    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Get current interpolated position as starting point
    startPositionRef.current = interpolatedPosition;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / MOVEMENT_DURATION, 1);

      // Ease-out cubic function for smooth deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const startPos = startPositionRef.current;
      const newX = startPos.x + (targetPosition.x - startPos.x) * easedProgress;
      const newY = startPos.y + (targetPosition.y - startPos.y) * easedProgress;

      setInterpolatedPosition({ x: newX, y: newY });

      // Continue animation if not complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at target position
        setInterpolatedPosition(targetPosition);
      }
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // We intentionally use previousTargetRef to track changes rather than interpolatedPosition
    // to avoid infinite re-renders. The current interpolated position is captured in the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPosition.x, targetPosition.y]);

  return interpolatedPosition;
};
