// Solve API Types
export interface SolveRequest {
  message: string;
  suspectIds: string[];
}

export type SolveStatus = 'correct' | 'partial' | 'incorrect';

export interface CulpritMatch {
  // Details about culprit matching
  [key: string]: unknown;
}

export interface SolveResponse {
  status: SolveStatus;
  success: boolean;
  culprit_score: number;
  reasoning_score: number;
  total_score: number;
  culprit_match: CulpritMatch;
  similarity_score: number;
  message: string;
  feedback?: string;
  hints?: string[];
}

export interface SolveAttempt {
  message: string;
  suspectIds: string[];
  response: SolveResponse;
  timestamp: number;
}
