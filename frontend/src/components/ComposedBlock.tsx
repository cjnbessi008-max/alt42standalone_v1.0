import { useDrag, useDrop } from 'react-dnd';
import { CompositionBlock, MathFunction } from '../types';
import { X, GripVertical } from 'lucide-react';

interface ComposedBlockProps {
  block: CompositionBlock;
  func: MathFunction;
  index: number;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

export const ComposedBlock = ({ block, func, index, onRemove, onMove }: ComposedBlockProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'composed-block',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'composed-block',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  }));

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className="function-block"
        style={{ backgroundColor: func.color }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical size={20} className="cursor-move" />
            <div>
              <div className="font-bold text-lg">{func.name}(x)</div>
              <div className="text-sm opacity-90">{func.displayName}</div>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
            title="제거"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
