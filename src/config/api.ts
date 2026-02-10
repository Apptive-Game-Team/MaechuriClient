// API Configuration
// Use localhost for dev mode, production URL for build mode
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev 
  ? 'http://localhost:8080' 
  : 'https://yh.yunseong.dev';

export const API_ENDPOINTS = {
  getTodayMap: () => `${API_BASE_URL}/api/scenarios/today/data/map`,
  getScenarioMap: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/data/map`,
  interact: (scenarioId: number, objectId: string) => `${API_BASE_URL}/api/scenarios/${scenarioId}/interact/${objectId}`,
  solve: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/solve`,
} as const;
