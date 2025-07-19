import React, { useEffect, useRef } from 'react';
import './HomePage.css';

interface HomePageProps {
  onStartGame: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  const pieces = ["pawn", "bishop", "rook", "queen", "king", "knight"];
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    const handlePieceClick = () => {
      if (pieceRef.current && h1Ref.current) {
        selectedIndexRef.current = selectedIndexRef.current + 1 === pieces.length ? 0 : selectedIndexRef.current + 1;
        pieceRef.current.setAttribute("data-type", pieces[selectedIndexRef.current]);
        h1Ref.current.classList.add("hide");

        // Show start game button after first click
        setTimeout(() => {
          const startBtn = document.querySelector('.start-game-btn');
          if (startBtn) {
            (startBtn as HTMLElement).style.opacity = '1';
            (startBtn as HTMLElement).style.transform = 'translateY(0)';
          }
        }, 1000);
      }
    };

    const pieceElement = pieceRef.current;
    if (pieceElement) {
      pieceElement.addEventListener("click", handlePieceClick);
    }

    return () => {
      if (pieceElement) {
        pieceElement.removeEventListener("click", handlePieceClick);
      }
    };
  }, [pieces]);

  return (
    <div className="home-page">
      <div className="bg"></div>

      <h1 ref={h1Ref}>↓ click me ↓</h1>

      <div className="piece" data-type="pawn" ref={pieceRef}>
        <div className="head">
          <div className="cross"></div>
        </div>
        <div className="neck"></div>
        <div className="body"></div>
        <div className="knight"></div>
        <div className="base"></div>
      </div>

      <button className="start-game-btn" onClick={onStartGame}>
        <span className="btn-text">Start Playing Chess</span>
        <div className="btn-chess-piece">♔</div>
      </button>
    </div>
  );
};

export default HomePage;
