/**
 * Draggable element component for permutation pattern
 */
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';

interface DraggableElementProps {
  value: string;
  index: number;
  onSwap: (dragIndex: number, hoverIndex: number) => void;
  isCorrect?: boolean;
}

const ItemType = 'ELEMENT';

export const DraggableElement: React.FC<DraggableElementProps> = ({
  value,
  index,
  onSwap,
  isCorrect,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onSwap(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const ref = (node: HTMLDivElement) => {
    drag(drop(node));
  };

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-16 h-16 flex items-center justify-center
        text-2xl font-bold rounded-xl cursor-move
        transition-all duration-200 shadow-lg
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isOver ? 'ring-4 ring-accent' : ''}
        ${
          isCorrect === true
            ? 'bg-green-400 text-white'
            : isCorrect === false
            ? 'bg-red-400 text-white'
            : 'bg-white text-gray-800 hover:bg-blue-50'
        }
      `}
      style={{
        userSelect: 'none',
      }}
    >
      {value}
    </motion.div>
  );
};
