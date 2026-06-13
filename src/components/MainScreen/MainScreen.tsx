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
      <section className="case-intro" aria-labelledby="main-title">
        <div className="case-kicker">
          <span>CASE FILE</span>
          <span translate="no">MAECHURI</span>
        </div>
        <div className="case-title-block">
          <h1 id="main-title">매추리</h1>
          <span className="case-title-mark" aria-hidden="true" />
          <p>매일, 하나의 사건.</p>
        </div>
        <dl className="case-meta">
          <div><dt>사건 번호</dt><dd>#DAILY</dd></div>
          <div><dt>기록 보관소</dt><dd>매추리 수사국</dd></div>
          <div><dt>사건 유형</dt><dd>2D 미스터리</dd></div>
          <div><dt>수사 상태</dt><dd>대기 중</dd></div>
        </dl>
        <p className="case-notice">모든 사건과 인물은 픽션입니다.</p>
      </section>

      <section className="main-actions" aria-label="사건 메뉴">
        {errorMessage && (
          <p className="main-error-message" role="alert" aria-live="polite">
            게임 시작 중 문제가 발생했습니다: {errorMessage}
          </p>
        )}
        <button className="case-action case-action-primary" onClick={handleStartGame}>
          <span className="case-action-index">01</span>
          <span className="case-action-copy">
            <strong>오늘의 사건 시작</strong>
            <small>새로운 사건을 조사합니다.</small>
          </span>
          <span className="case-action-arrow" aria-hidden="true">→</span>
        </button>
        <button className="case-action" onClick={handleOpenScenarioSelect}>
          <span className="case-action-index">02</span>
          <span className="case-action-copy">
            <strong>지난 사건 기록</strong>
            <small>이전에 공개된 사건을 확인합니다.</small>
          </span>
          <span className="case-action-arrow" aria-hidden="true">→</span>
        </button>
      </section>
      <Footer />
    </div>
  );
};

export default MainScreen;
