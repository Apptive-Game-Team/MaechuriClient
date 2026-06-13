import React from 'react';
import './ErrorScreen.css';

interface ErrorScreenProps {
  statusCode?: number;
  message?: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ statusCode, message }) => {
  let displayMessage = '예상하지 못한 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

  if (statusCode) {
    switch (statusCode) {
      case 401:
      case 403:
        displayMessage = '접근 권한이 없습니다. 로그인 상태와 권한을 확인해 주세요.';
        break;
      case 404:
        displayMessage = '요청한 사건 기록을 찾을 수 없습니다. 주소를 확인해 주세요.';
        break;
      case 500:
        displayMessage = '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        break;
      case 503:
        displayMessage = '현재 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
        break;
      default:
        displayMessage = `오류 코드 ${statusCode}. 잠시 후 다시 시도해 주세요.`;
    }
  }

  // If a custom message is provided, prioritize it
  if (message) {
    displayMessage = message;
  }

  const handleGoHome = () => {
    window.location.href = '/'; // Redirect to the home page
  };

  return (
    <div className="error-screen">
      <div className="error-content">
        <span className="screen-kicker">CASE FILE / ERROR</span>
        <h1>기록을 열 수 없습니다</h1>
        <p className="error-message">{displayMessage}</p>
        <button className="home-button" onClick={handleGoHome}>
          메인 화면으로
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
