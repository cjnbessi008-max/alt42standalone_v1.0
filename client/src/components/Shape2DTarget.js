import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemType } from './Shape3DItem';
import './ShapeItem.css';

const Shape2DTarget = ({ shape, onDrop, matches, correctMatches }) => {
  // Find if any 3D shape is matched to this 2D shape
  const matchedShape3DId = Object.entries(matches).find(
    ([_, shape2DId]) => shape2DId === shape.id
  )?.[0];

  const isCorrectlyMatched = matchedShape3DId && correctMatches.has(parseInt(matchedShape3DId));

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => {
      onDrop(item.id, shape.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [shape.id, onDrop]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`shape-2d-target ${isActive ? 'active' : ''} ${isCorrectlyMatched ? 'correct' : ''} ${matchedShape3DId && !isCorrectlyMatched ? 'incorrect' : ''}`}
    >
      <div className="shape-icon">
        {shape.image_url ? (
          <img src={shape.image_url} alt={shape.name_ko || shape.name} />
        ) : shape.svg_path ? (
          <svg viewBox="0 0 100 100" className="shape-svg">
            <path d={shape.svg_path} fill="#667eea" />
          </svg>
        ) : (
          <div className="shape-placeholder">
            <span className="shape-emoji">
              {get2DShapeEmoji(shape.name)}
            </span>
          </div>
        )}
      </div>
      <div className="shape-name">{shape.name_ko || shape.name}</div>
      {isActive && (
        <div className="drop-indicator">
          <span>여기에 놓으세요</span>
        </div>
      )}
      {isCorrectlyMatched && (
        <div className="correct-indicator">
          <span className="checkmark">✓</span>
        </div>
      )}
      {matchedShape3DId && !isCorrectlyMatched && (
        <div className="incorrect-indicator">
          <span className="crossmark">✕</span>
        </div>
      )}
    </div>
  );
};

// Helper function to get emoji representation for 2D shapes
const get2DShapeEmoji = (shapeName) => {
  const emojiMap = {
    'Square': '⬜',
    'Circle': '⭕',
    'Rectangle': '▭',
    'Triangle': '🔺',
    'Pentagon': '⬠',
    'Hexagon': '⬡',
  };
  return emojiMap[shapeName] || '⬜';
};

export default Shape2DTarget;
