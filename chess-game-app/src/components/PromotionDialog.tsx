import React from 'react';
import type { PieceType, PieceColor } from '../types/chess';
import './PromotionDialog.css';

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
  onCancel: () => void;
}

const PromotionDialog: React.FC<PromotionDialogProps> = ({ color, onSelect, onCancel }) => {
  const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
  
  const getPieceSymbol = (type: PieceType, color: PieceColor): string => {
    const pieces = {
      white: {
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘'
      },
      black: {
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞'
      }
    };
    return pieces[color][type as keyof typeof pieces[typeof color]];
  };

  const getPieceName = (type: PieceType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="promotion-overlay">
      <div className="promotion-dialog">
        <h3 className="promotion-title">
          Choose promotion piece
        </h3>
        <div className="promotion-pieces">
          {promotionPieces.map((pieceType) => (
            <button
              key={pieceType}
              className="promotion-piece-btn"
              onClick={() => onSelect(pieceType)}
              title={getPieceName(pieceType)}
            >
              <span className="promotion-piece-symbol">
                {getPieceSymbol(pieceType, color)}
              </span>
              <span className="promotion-piece-name">
                {getPieceName(pieceType)}
              </span>
            </button>
          ))}
        </div>
        <button className="promotion-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PromotionDialog;
