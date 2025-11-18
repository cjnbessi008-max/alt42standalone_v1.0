import { useDrag } from 'react-dnd';
import { MathFunction } from '../types';
import { GripVertical } from 'lucide-react';

interface FunctionBlockProps {
  func: MathFunction;
  onAdd?: () => void;
}

export const FunctionBlock = ({ func, onAdd }: FunctionBlockProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'function',
    item: { functionId: func.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onAdd}
      className={`function-block ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundColor: func.color,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        <GripVertical size={20} />
        <div>
          <div className="font-bold text-lg">{func.name}(x)</div>
          <div className="text-sm opacity-90">{func.displayName}</div>
        </div>
      </div>
    </div>
  );
};
