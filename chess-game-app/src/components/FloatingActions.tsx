import React, { useState } from 'react';
import './FloatingActions.css';

interface FloatingActionsProps {
  onRotateBoard: () => void;
  onToggleSound: () => void;
  onToggleAnalysis: () => void;
  onExportGame: () => void;
  soundEnabled: boolean;
  analysisEnabled: boolean;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({
  onRotateBoard,
  onToggleSound,
  onToggleAnalysis,
  onExportGame,
  soundEnabled,
  analysisEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`floating-actions ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="fab-main"
        onClick={toggleExpanded}
        aria-label="Toggle actions menu"
      >
        <span className="fab-icon">⚙️</span>
      </button>
      
      <div className="fab-menu">
        <button 
          className="fab-item"
          onClick={onRotateBoard}
          title="Rotate Board"
        >
          <span className="fab-icon">🔄</span>
        </button>
        
        <button 
          className={`fab-item ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
        >
          <span className="fab-icon">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
        
        <button 
          className={`fab-item ${analysisEnabled ? 'active' : ''}`}
          onClick={onToggleAnalysis}
          title={analysisEnabled ? 'Disable Analysis' : 'Enable Analysis'}
        >
          <span className="fab-icon">🧠</span>
        </button>
        
        <button 
          className="fab-item"
          onClick={onExportGame}
          title="Export Game"
        >
          <span className="fab-icon">📥</span>
        </button>
      </div>
    </div>
  );
};

export default FloatingActions;
