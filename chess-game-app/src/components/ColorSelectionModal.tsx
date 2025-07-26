import React from 'react';
import './ColorSelectionModal.css';

interface ColorSelectionModalProps {
  isOpen: boolean;
  onSelectColor: (color: 'white' | 'black') => void;
  onClose: () => void;
}

const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
  isOpen,
  onSelectColor,
  onClose
}) => {
  if (!isOpen) return null;

  const handleColorSelect = (color: 'white' | 'black') => {
    onSelectColor(color);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="color-modal-backdrop" onClick={handleBackdropClick}>
      <div className="color-modal">
        <div className="color-modal-header">
          <h2>Choose Your Color</h2>
          <p>Select which pieces you'd like to play as</p>
        </div>

        <div className="color-options">
          <button
            className="color-option white-option"
            onClick={() => handleColorSelect('white')}
          >
            <div className="color-piece">♔</div>
            <div className="color-info">
              <h3>Play as White</h3>
              <p>You move first</p>
            </div>
            <div className="selection-arrow">→</div>
          </button>

          <button
            className="color-option black-option"
            onClick={() => handleColorSelect('black')}
          >
            <div className="color-piece">♚</div>
            <div className="color-info">
              <h3>Play as Black</h3>
              <p>Computer moves first</p>
            </div>
            <div className="selection-arrow">→</div>
          </button>
        </div>

        <div className="color-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorSelectionModal;
