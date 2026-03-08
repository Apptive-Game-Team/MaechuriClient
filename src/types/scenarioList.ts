export interface ScenarioEntry {
  date: string;      // e.g. "2026-03-01"
  scenarioId: number;
}

export interface ScenarioListResponse {
  month: number;
  scenarios: ScenarioEntry[];
}
