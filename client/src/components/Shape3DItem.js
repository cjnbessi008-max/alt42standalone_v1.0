import React from 'react';
import { useDrag } from 'react-dnd';
import './ShapeItem.css';

const ItemType = 'SHAPE_3D';

const Shape3DItem = ({ shape, isMatched, currentMatch, onRemoveMatch }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: shape.id, name: shape.name_ko || shape.name },
    canDrag: !isMatched,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [shape.id, isMatched]);

  return (
    <div
      ref={drag}
      className={`shape-3d-item ${isMatched ? 'matched' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="shape-icon">
        {shape.thumbnail_url ? (
          <img src={shape.thumbnail_url} alt={shape.name_ko || shape.name} />
        ) : (
          <div className="shape-placeholder">
            <span className="shape-emoji">
              {getShapeEmoji(shape.name)}
            </span>
          </div>
        )}
      </div>
      <div className="shape-name">{shape.name_ko || shape.name}</div>
      {isMatched && (
        <div className="matched-indicator">
          <span className="checkmark">✓</span>
        </div>
      )}
      {currentMatch && !isMatched && (
        <button className="remove-match" onClick={onRemoveMatch}>
          ✕
        </button>
      )}
    </div>
  );
};

// Helper function to get emoji representation for shapes
const getShapeEmoji = (shapeName) => {
  const emojiMap = {
    'Cube': '📦',
    'Sphere': '🔵',
    'Cylinder': '🥫',
    'Cone': '🍦',
    'Pyramid': '🔺',
    'Rectangular Prism': '📦',
  };
  return emojiMap[shapeName] || '⬜';
};

export default Shape3DItem;
export { ItemType };
