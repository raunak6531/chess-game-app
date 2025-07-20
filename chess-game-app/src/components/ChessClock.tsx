import React, { useState, useEffect, useRef } from 'react';
import './ChessClock.css';

interface ChessClockProps {
  currentPlayer: 'white' | 'black';
  gameStatus: string;
  onTimeUp: (player: 'white' | 'black') => void;
  initialTime?: number; // in seconds
}

const ChessClock: React.FC<ChessClockProps> = ({ 
  currentPlayer, 
  gameStatus, 
  onTimeUp, 
  initialTime = 600 // 10 minutes default
}) => {
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameStatus === 'playing' && !isRunning) {
      setIsRunning(true);
    } else if (gameStatus !== 'playing' && isRunning) {
      setIsRunning(false);
    }
  }, [gameStatus, isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (currentPlayer === 'white') {
          setWhiteTime(prev => {
            if (prev <= 1) {
              onTimeUp('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 1) {
              onTimeUp('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, currentPlayer, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeClass = (time: number, isActive: boolean): string => {
    const classes = ['clock-display'];
    if (isActive) classes.push('active');
    if (time <= 30) classes.push('critical');
    else if (time <= 60) classes.push('warning');
    return classes.join(' ');
  };

  const resetClocks = () => {
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setIsRunning(false);
  };

  return (
    <div className="chess-clock">
      <div className="clock-header">
        <h3>Game Clock</h3>
        <button className="reset-clock-btn" onClick={resetClocks}>
          Reset
        </button>
      </div>
      
      <div className="clocks-container">
        <div className={`clock ${currentPlayer === 'black' ? 'active' : ''}`}>
          <div className="player-label">Black</div>
          <div className={getTimeClass(blackTime, currentPlayer === 'black')}>
            {formatTime(blackTime)}
          </div>
        </div>
        
        <div className="clock-divider">
          <div className="clock-icon">⏱️</div>
        </div>
        
        <div className={`clock ${currentPlayer === 'white' ? 'active' : ''}`}>
          <div className="player-label">White</div>
          <div className={getTimeClass(whiteTime, currentPlayer === 'white')}>
            {formatTime(whiteTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessClock;
