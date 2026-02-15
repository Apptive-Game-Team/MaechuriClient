import { API_ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import type { ScenarioData } from '../types/map';
import type { InteractionRequest, InteractionResponse } from '../types/interaction';
import type { SolveRequest, SolveResponse } from '../types/solve';
import type { RecordsData, RecordDetail } from '../types/record';

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
  objectId: string,
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

/**
 * Submit a solve attempt
 */
export async function submitSolve(
  scenarioId: number,
  request: SolveRequest
): Promise<SolveResponse> {
  const response = await apiFetch(API_ENDPOINTS.solve(scenarioId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit solve: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all records for a scenario
 */
export async function getRecords(scenarioId: number): Promise<RecordsData> {
  const response = await apiFetch(API_ENDPOINTS.getRecords(scenarioId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single record detail
 */
export async function getRecord(
  scenarioId: number,
  recordId: string
): Promise<RecordDetail> {
  const response = await apiFetch(API_ENDPOINTS.getRecord(scenarioId, recordId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch record: ${response.statusText}`);
  }

  return response.json();
}
