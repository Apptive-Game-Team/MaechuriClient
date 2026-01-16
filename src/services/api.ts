import { API_ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import type { ScenarioData } from '../types/map';
import type { InteractionRequest, InteractionResponse } from '../types/interaction';

/**
 * Fetch today's map data
 */
export async function getTodayMap(): Promise<ScenarioData> {
  const response = await apiFetch(API_ENDPOINTS.getTodayMap(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch today's map: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch specific scenario map data
 */
export async function getScenarioMap(scenarioId: number): Promise<ScenarioData> {
  const response = await apiFetch(API_ENDPOINTS.getScenarioMap(scenarioId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scenario map: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send interaction request to an object
 * For initial interaction, send an empty request body to get interaction type
 */
export async function sendInteraction(
  scenarioId: number,
  objectId: number,
  request: InteractionRequest = {}
): Promise<InteractionResponse> {
  const response = await apiFetch(API_ENDPOINTS.interact(scenarioId, objectId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to interact with object: ${response.statusText}`);
  }

  return response.json();
}
