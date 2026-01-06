// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  getTodayMap: () => `${API_BASE_URL}/api/scenarios/today/data/map`,
  getScenarioMap: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/data/map`,
  interact: (scenarioId: number, objectId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/interact/${objectId}`,
} as const;
