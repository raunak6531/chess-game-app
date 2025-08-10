import React, { useEffect, useRef } from 'react';
import './HomePage.css';

interface HomePageProps {
  onStartGame: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);


  const pieces = ["pawn", "bishop", "rook", "queen", "king", "knight"];
  const selectedIndexRef = useRef(0);



  useEffect(() => {
    const pieceElement = pieceRef.current;
    if (!pieceElement) return;

    const handleActivate = (e: PointerEvent) => {
      // Prevent ghost clicks and unify pointer/touch/mouse
      e.preventDefault();

      if (pieceRef.current && subtitleRef.current) {
        // Advance to next piece
        selectedIndexRef.current =
          selectedIndexRef.current + 1 === pieces.length ? 0 : selectedIndexRef.current + 1;
        pieceRef.current.setAttribute("data-type", pieces[selectedIndexRef.current]);

        // Hide subtitle after first interaction
        subtitleRef.current.classList.add("hide");

        // Reveal start button with correct placement for current viewport
        setTimeout(() => {
          const startBtn = document.querySelector('.start-game-btn') as HTMLElement | null;
          if (startBtn) {
            startBtn.style.opacity = '1';
            const mobile = window.innerWidth <= 768; // use current viewport instead of state
            if (mobile) {
              startBtn.style.transform = 'translateX(-50%) translateY(0)';
            } else {
              startBtn.style.transform = 'translateY(-50%) translateX(0)';
            }
          }
        }, 1000);
      }
    };

    pieceElement.addEventListener('pointerup', handleActivate);

    return () => {
      pieceElement.removeEventListener('pointerup', handleActivate);
    };
  }, []);

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
