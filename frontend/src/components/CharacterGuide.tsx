import React, { useState } from 'react';
import { Character } from '../types';
import { getCharacterMessages } from '../data/characters';
import './CharacterGuide.css';

interface CharacterGuideProps {
  character: Character;
  message?: string;
  showHint?: boolean;
  onHintRequest?: () => void;
}

/**
 * Character Guide Component
 * Displays a character with speech bubble and animations
 */
export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  character,
  message,
  showHint = false,
  onHintRequest,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const messages = getCharacterMessages(character.id);

  const displayMessage = message || messages.greeting;

  const handleCharacterClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="character-guide">
      {/* Speech bubble */}
      <div className="speech-bubble" style={{ borderColor: character.color }}>
        <div className="speech-content">
          <p>{displayMessage}</p>
        </div>
        <div className="speech-arrow" style={{ borderTopColor: character.color }}></div>
      </div>

      {/* Character avatar */}
      <div
        className={`character-avatar ${isAnimating ? 'bounce' : ''}`}
        onClick={handleCharacterClick}
        style={{ background: `linear-gradient(135deg, ${character.color}dd, ${character.color}ff)` }}
      >
        <div className="avatar-emoji">{character.avatar}</div>
        <div className="character-name">{character.name}</div>
      </div>

      {/* Hint button */}
      {showHint && onHintRequest && (
        <button className="hint-button" onClick={onHintRequest}>
          💡 힌트 보기
        </button>
      )}

      {/* Character type badge */}
      <div className="quantifier-badge" style={{ backgroundColor: character.color }}>
        {character.quantifierType === 'universal' ? '모든 (∀)' : '어떤 (∃)'}
      </div>
    </div>
  );
};

export default CharacterGuide;
