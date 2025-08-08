import React, { useEffect, useRef, useState } from 'react';
import './HomePage.css';

interface HomePageProps {
  onStartGame: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const pieces = ["pawn", "bishop", "rook", "queen", "king", "knight"];
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePieceClick = () => {
      if (pieceRef.current && subtitleRef.current) {
        selectedIndexRef.current = selectedIndexRef.current + 1 === pieces.length ? 0 : selectedIndexRef.current + 1;
        pieceRef.current.setAttribute("data-type", pieces[selectedIndexRef.current]);
        subtitleRef.current.classList.add("hide");

        // Show start game button after first click
        setTimeout(() => {
          const startBtn = document.querySelector('.start-game-btn');
          if (startBtn) {
            (startBtn as HTMLElement).style.opacity = '1';
            // Apply different transform based on device type
            if (isMobile) {
              (startBtn as HTMLElement).style.transform = 'translateX(-50%) translateY(0)';
            } else {
              (startBtn as HTMLElement).style.transform = 'translateY(-50%) translateX(0)';
            }
          }
        }, 1000);
      }
    };

    const pieceElement = pieceRef.current;
    if (pieceElement) {
      pieceElement.addEventListener("click", handlePieceClick);
      // Add touch event for mobile devices
      pieceElement.addEventListener("touchend", (e) => {
        e.preventDefault(); // Prevent default touch behavior
        handlePieceClick();
      });
    }

    return () => {
      if (pieceElement) {
        pieceElement.removeEventListener("click", handlePieceClick);
        pieceElement.removeEventListener("touchend", handlePieceClick);
      }
    };
  }, [pieces, isMobile]);

  return (
    <div className="home-page">
      <div className="bg"></div>

      {/* Ambient floating elements */}
      <div className="ambient-elements">
        <div className="floating-crown">♔</div>
        <div className="floating-crown">♕</div>
        <div className="floating-crown">♖</div>
        <div className="floating-crown">♗</div>
        <div className="floating-crown">♘</div>
        <div className="floating-crown">♙</div>
        <div className="floating-crown">♚</div>
        <div className="floating-crown">♛</div>
        <div className="floating-crown">♜</div>
        <div className="floating-crown">♝</div>
        <div className="floating-crown">♞</div>
        <div className="floating-crown">♟</div>
        <div className="floating-crown">♔</div>
        <div className="floating-crown">♕</div>
        <div className="floating-crown">♖</div>
        <div className="floating-crown">♗</div>
        <div className="floating-crown">♘</div>
        <div className="floating-crown">♙</div>
        <div className="floating-crown">♚</div>
        <div className="floating-crown">♛</div>
        <div className="floating-crown">♜</div>
        <div className="floating-crown">♝</div>
        <div className="floating-crown">♞</div>
        <div className="floating-crown">♟</div>
      </div>

      <h1 ref={h1Ref}>LET'S MATE</h1>
      <p className="subtitle" ref={subtitleRef}>↓ click the piece ↓</p>

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
