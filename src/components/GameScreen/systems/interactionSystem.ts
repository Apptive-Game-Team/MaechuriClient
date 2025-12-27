import { checkInteraction, getFacingPosition } from '../utils/gameUtils';
import type { PlayerEntity } from '../types';

const interactionSystem = (entities: { player?: PlayerEntity }, { events }: any) => {
  const player = entities.player;

  if (player) {
    const interactionEvents = events.filter((e: any) => e.type === 'interact');

    if (interactionEvents.length > 0) {
      const facingPosition = getFacingPosition(player.position, player.direction);
      const interactableId = checkInteraction(facingPosition.x, facingPosition.y);
      if (interactableId !== null) {
        alert(`Interacting with object ID: ${interactableId}`);
      }
    }
  }

  return entities;
};

export default interactionSystem;
