import React from 'react';
import FlowingMenu from './FlowingMenu';
import './GameMenu.css';

interface GameMenuProps {
  onPlayVsComputer: () => void;
  onBoardTheme: () => void;
  onDifficulty: () => void;
  onBackToHome: () => void;
  difficulty: string;
  boardTheme: string;
}

const GameMenu: React.FC<GameMenuProps> = ({
  onPlayVsComputer,
  onBoardTheme,
  onDifficulty,
  onBackToHome,
  difficulty,
  boardTheme
}) => {
  const menuItems = [
    {
      link: "#",
      text: "Play vs Computer",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🤖%3C/text%3E%3C/svg%3E",
      onClick: onPlayVsComputer
    },
    {
      link: "#",
      text: `Board Theme: ${boardTheme}`,
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🎨%3C/text%3E%3C/svg%3E",
      onClick: onBoardTheme
    },
    {
      link: "#",
      text: `Difficulty: ${difficulty}`,
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⚡%3C/text%3E%3C/svg%3E",
      onClick: onDifficulty
    }
  ];

  return (
    <div className="game-menu">
      {/* Background effects */}
      <div className="game-menu-bg-effects">
        <div className="bg-effect-1"></div>
        <div className="bg-effect-2"></div>
        <div className="bg-effect-3"></div>
      </div>

      {/* Back button */}
      <button
        onClick={onBackToHome}
        className="back-button"
      >
        ← Back to Home
      </button>

      {/* Menu */}
      <div className="game-menu-content">
        <FlowingMenu items={menuItems} />
      </div>
    </div>
  );
};

export default GameMenu;
