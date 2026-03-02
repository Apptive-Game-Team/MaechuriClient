import React from 'react';
import './MainScreen.css';

interface MainScreenProps {
  onStartGame: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onStartGame }) => {
  return (
    <div className="main-screen">
      <h1>매추리</h1>
      <h2>매일 매일 추리</h2>
      <div className="main-content">
        
        <button className="start-game-button" onClick={onStartGame}>
          오늘의 게임 시작
        </button>
      </div>
    </div>
  );
};

export default MainScreen;
