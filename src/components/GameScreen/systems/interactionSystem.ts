import type { System } from 'react-game-engine';
import { checkInteraction, getFacingPosition, getObjectInfo, setFacingInteractable } from '../utils/gameUtils';
import type { PlayerEntity } from '../types';

const interactionSystem: System = (entities, { events }) => {
  const player = entities.player as PlayerEntity;

  if (player && events) {
    const facingPosition = getFacingPosition(player.position, player.direction);
    const facingId = checkInteraction(facingPosition.x, facingPosition.y);
    const facingObjectInfo = facingId !== null ? getObjectInfo(facingPosition.x, facingPosition.y) : null;

    // Update the facing-interactable highlight so renderers can visualize clickability
    setFacingInteractable(facingObjectInfo ? facingObjectInfo.id : null);

    const interactionEvents = (events as { type: string }[]).filter((e) => e.type === 'interact');

    if (interactionEvents.length > 0) {
      if (facingId !== null && facingObjectInfo) {
        // Dispatch custom event that will be handled by GameScreen
        window.dispatchEvent(
          new CustomEvent('gameInteraction', {
            detail: {
              objectId: facingObjectInfo.id,
              objectName: facingObjectInfo.name,
            },
          }),
        );
      }
    }
  }

  return entities;
};

export default interactionSystem;
