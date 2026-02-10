import React, { useState, useRef, useEffect } from 'react';
import type { MapObject } from '../../types/map';
import type { SolveAttempt } from '../../types/solve';
import './SolveModal.css';

interface SolveModalProps {
  isOpen: boolean;
  suspects: MapObject[];
  attempts: SolveAttempt[];
  onClose: () => void;
  onSubmit: (message: string, suspectIds: string[]) => void;
}

const SolveModal: React.FC<SolveModalProps> = ({
  isOpen,
  suspects,
  attempts,
  onClose,
  onSubmit,
}) => {
  const [selectedSuspects, setSelectedSuspects] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [attempts]);

  if (!isOpen) return null;

  const handleSuspectToggle = (suspectId: string) => {
    setSelectedSuspects(prev => 
      prev.includes(suspectId) 
        ? prev.filter(id => id !== suspectId)
        : [...prev, suspectId]
    );
  };

  const handleSubmit = () => {
    if (reasoning.trim() && selectedSuspects.length > 0) {
      onSubmit(reasoning, selectedSuspects);
      setReasoning('');
      // Keep selected suspects for next attempt if needed
    }
  };

  return (
    <div className="solve-modal-overlay" onClick={onClose}>
      <div className="solve-modal" onClick={(e) => e.stopPropagation()}>
        <div className="solve-modal-header">
          <h3>Solve the Case</h3>
          <button className="solve-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="solve-modal-content">
          {/* Conversation History */}
          <div className="solve-conversation">
            {attempts.map((attempt, index) => (
              <div key={index} className="solve-attempt">
                {/* User's reasoning (right side) */}
                <div className="solve-message user">
                  <div className="solve-message-bubble">
                    <div className="solve-suspects">
                      <strong>Suspects:</strong> {
                        attempt.suspectIds.map(id => {
                          const suspect = suspects.find(s => s.id === id);
                          return suspect?.name || id;
                        }).join(', ')
                      }
                    </div>
                    <div className="solve-reasoning">{attempt.message}</div>
                  </div>
                </div>

                {/* Feedback (left side) */}
                <div className="solve-message npc">
                  <div className="solve-message-bubble">
                    <div className="solve-status" data-status={attempt.response.status}>
                      {attempt.response.status.toUpperCase()}
                    </div>
                    <div className="solve-feedback-message">{attempt.response.message}</div>
                    {attempt.response.feedback && (
                      <div className="solve-detailed-feedback">
                        <strong>Feedback:</strong> {attempt.response.feedback}
                      </div>
                    )}
                    {attempt.response.hints && attempt.response.hints.length > 0 && (
                      <div className="solve-hints">
                        <strong>Hints:</strong>
                        <ul>
                          {attempt.response.hints.map((hint, hintIndex) => (
                            <li key={hintIndex}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="solve-input-section">
            {/* Suspect Selection */}
            <div className="solve-suspects-section">
              <label className="solve-label">Select Suspects:</label>
              <div className="solve-suspects-list">
                {suspects.map(suspect => (
                  <label key={suspect.id} className="solve-suspect-item">
                    <input
                      type="checkbox"
                      checked={selectedSuspects.includes(suspect.id)}
                      onChange={() => handleSuspectToggle(suspect.id)}
                    />
                    <span>{suspect.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reasoning Input */}
            <div className="solve-reasoning-section">
              <label className="solve-label">Your Reasoning:</label>
              <textarea
                className="solve-reasoning-input"
                placeholder="Enter your reasoning here..."
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <button
              className="solve-submit-button"
              onClick={handleSubmit}
              disabled={!reasoning.trim() || selectedSuspects.length === 0}
            >
              Submit Solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveModal;
