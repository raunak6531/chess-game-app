import React from 'react';
import { Move } from '../types/chess';
import './MoveHistory.css';

interface MoveHistoryProps {
  moves: Move[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const formatMove = (move: Move, index: number): string => {
    const files = 'abcdefgh';
    const fromNotation = `${files[move.from.col]}${move.from.row + 1}`;
    const toNotation = `${files[move.to.col]}${move.to.row + 1}`;
    
    let notation = '';
    
    // Add piece symbol (except for pawns)
    if (move.piece.type !== 'pawn') {
      notation += move.piece.type.charAt(0).toUpperCase();
    }
    
    // Add capture symbol
    if (move.capturedPiece) {
      if (move.piece.type === 'pawn') {
        notation += files[move.from.col]; // For pawn captures, show the file
      }
      notation += 'x';
    }
    
    // Add destination square
    notation += toNotation;
    
    // Add special move indicators
    if (move.isCastling) {
      notation = move.to.col > move.from.col ? 'O-O' : 'O-O-O';
    }
    
    if (move.promotionPiece) {
      notation += '=' + move.promotionPiece.charAt(0).toUpperCase();
    }
    
    return notation;
  };

  const groupMovesByTurn = (moves: Move[]) => {
    const turns = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      turns.push({
        turnNumber: Math.floor(i / 2) + 1,
        white: whiteMove,
        black: blackMove
      });
    }
    return turns;
  };

  const turns = groupMovesByTurn(moves);

  if (moves.length === 0) {
    return (
      <div className="move-history">
        <h3>Move History</h3>
        <div className="no-moves">No moves yet</div>
      </div>
    );
  }

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="moves-container">
        {turns.map((turn) => (
          <div key={turn.turnNumber} className="move-turn">
            <div className="turn-number">{turn.turnNumber}.</div>
            <div className="white-move">
              {formatMove(turn.white, (turn.turnNumber - 1) * 2)}
            </div>
            <div className="black-move">
              {turn.black ? formatMove(turn.black, (turn.turnNumber - 1) * 2 + 1) : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;
