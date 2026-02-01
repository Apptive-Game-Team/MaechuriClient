import React from 'react';
import './ErrorScreen.css';

interface ErrorScreenProps {
  statusCode?: number;
  message?: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ statusCode, message }) => {
  let displayMessage = "An unexpected error occurred.";

  if (statusCode) {
    switch (statusCode) {
      case 401:
      case 403:
        displayMessage = "You don't have permission to access this. Please ensure you are logged in or have the correct access rights.";
        break;
      case 404:
        displayMessage = "The page or resource you are looking for could not be found. It might have been removed or never existed.";
        break;
      case 500:
        displayMessage = "Something went wrong on our server. We're working to fix it!";
        break;
      case 503:
        displayMessage = "Our services are temporarily unavailable. Please try again in a moment.";
        break;
      default:
        displayMessage = `An error occurred (Status Code: ${statusCode}). Please try again later.`;
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
        <h1>Oops!</h1>
        <p className="error-message">{displayMessage}</p>
        <button className="home-button" onClick={handleGoHome}>
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
