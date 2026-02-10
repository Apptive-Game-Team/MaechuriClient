import React from 'react';
import type { SolveResponse } from '../../types/solve';
import './ResultScreen.css';

interface ResultScreenProps {
  result: SolveResponse;
  onGoHome: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onGoHome }) => {
  return (
    <div className="result-screen">
      <div className="result-container">
        <div className="result-header">
          <h1>Case Solved!</h1>
          <div className="result-status">{result.status.toUpperCase()}</div>
        </div>

        <div className="result-scores">
          <div className="score-item">
            <div className="score-label">Culprit Score</div>
            <div className="score-value">{(result?.culprit_score ?? 0).toFixed(1)}%</div>
          </div>
          <div className="score-item">
            <div className="score-label">Reasoning Score</div>
            <div className="score-value">{(result?.reasoning_score ?? 0).toFixed(1)}%</div>
          </div>
          <div className="score-item total">
            <div className="score-label">Total Score</div>
            <div className="score-value">{(result?.total_score ?? 0).toFixed(1)}%</div>
          </div>
        </div>

        <div className="result-message">
          <h3>Result</h3>
          <p>{result.message}</p>
        </div>

        <button className="home-button" onClick={onGoHome}>
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
