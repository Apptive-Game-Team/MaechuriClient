import { checkInteraction, getFacingPosition, getObjectInfo } from '../utils/gameUtils';
import type { PlayerEntity } from '../types';

const interactionSystem = (entities: { player?: PlayerEntity }, { events }: any) => {
  const player = entities.player;

  if (player) {
    const interactionEvents = events.filter((e: any) => e.type === 'interact');

    if (interactionEvents.length > 0) {
      const facingPosition = getFacingPosition(player.position, player.direction);
      const interactableId = checkInteraction(facingPosition.x, facingPosition.y);
      if (interactableId !== null) {
        const objectInfo = getObjectInfo(facingPosition.x, facingPosition.y);
        if (objectInfo) {
          // Dispatch custom event that will be handled by GameScreen
          window.dispatchEvent(
            new CustomEvent('gameInteraction', {
              detail: {
                objectId: objectInfo.id,
                objectName: objectInfo.name,
              },
            })
          );
        }
      }
    }
  }

  return entities;
};

export default interactionSystem;
