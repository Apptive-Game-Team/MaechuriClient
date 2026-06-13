import React from 'react';
import type { SolveResponse } from '../../types/solve';
import './ResultScreen.css';

interface ResultScreenProps {
  result: SolveResponse;
  onGoHome: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onGoHome }) => {
  const formatScore = (score: number) => new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(score);

  return (
    <div className="result-screen">
      <div className="result-container">
        <div className="result-header">
          <span className="screen-kicker">CASE REPORT / COMPLETE</span>
          <h1>사건 수사 결과</h1>
          <div className="result-status">{result.status}</div>
        </div>

        <div className="result-scores">
          <div className="score-item">
            <div className="score-label">범인 지목</div>
            <div className="score-value">{formatScore(result?.culpritScore ?? 0)}%</div>
          </div>
          <div className="score-item">
            <div className="score-label">추리 완성도</div>
            <div className="score-value">{formatScore(result?.reasoningScore ?? 0)}%</div>
          </div>
          <div className="score-item total">
            <div className="score-label">종합 점수</div>
            <div className="score-value">{formatScore(result?.totalScore ?? 0)}%</div>
          </div>
        </div>

        <div className="result-message">
          <h2>수사관 평가</h2>
          <p>{result.message}</p>
        </div>

        <button className="home-button" onClick={onGoHome}>
          사건 보관소로
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
