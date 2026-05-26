import React from 'react';
import './MainScreen.css';
import Footer from '../common/Footer/Footer';

interface MainScreenProps {
  onStartGame: () => void;
  onOpenScenarioSelect: () => void;
  errorMessage?: string | null;
  onClearErrorMessage?: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onStartGame, onOpenScenarioSelect, errorMessage, onClearErrorMessage }) => {
  const handleStartGame = () => {
    onClearErrorMessage?.();
    onStartGame();
  };

  const handleOpenScenarioSelect = () => {
    onClearErrorMessage?.();
    onOpenScenarioSelect();
  };

  return (
    <div className="main-screen">
      <h1>매추리</h1>
      <h2>매일 매일 추리</h2>
      <div className="main-content">
        {errorMessage && (
          <p className="main-error-message" role="alert" aria-live="polite">
            게임 시작 중 문제가 발생했습니다: {errorMessage}
          </p>
        )}

        <button className="start-game-button" onClick={handleStartGame}>
          오늘의 게임 시작
        </button>
        <button className="scenario-select-button" onClick={handleOpenScenarioSelect}>
          시나리오 선택
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default MainScreen;
