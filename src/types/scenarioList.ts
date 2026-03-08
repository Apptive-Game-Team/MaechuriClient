export type ScenarioState = 'Inactive' | 'Active' | 'Finished';

export interface ScenarioEntry {
  date: string;      // e.g. "2026-03-01"
  scenarioId: number;
  state: ScenarioState;
}

export interface ScenarioListResponse {
  month: number;
  scenarios: ScenarioEntry[];
}
