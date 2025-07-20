import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Preparing your chess experience..." 
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="chess-pieces-loader">
          <div className="piece-loader king">♔</div>
          <div className="piece-loader queen">♕</div>
          <div className="piece-loader rook">♖</div>
          <div className="piece-loader bishop">♗</div>
          <div className="piece-loader knight">♘</div>
          <div className="piece-loader pawn">♙</div>
        </div>
        
        <div className="loading-text">
          <h2>Chess Master</h2>
          <p>{message}</p>
        </div>
        
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
        
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="background-pattern">
        <div className="chess-square light"></div>
        <div className="chess-square dark"></div>
        <div className="chess-square light"></div>
        <div className="chess-square dark"></div>
        <div className="chess-square light"></div>
        <div className="chess-square dark"></div>
        <div className="chess-square light"></div>
        <div className="chess-square dark"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
