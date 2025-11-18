import { useDrop } from 'react-dnd';
import { useStore } from '../store/useStore';
import { ComposedBlock } from './ComposedBlock';
import { ChevronRight } from 'lucide-react';

export const CompositionArea = () => {
  const {
    composedFunctions,
    availableFunctions,
    addFunction,
    removeFunction,
    reorderFunctions,
  } = useStore();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'function',
    drop: (item: { functionId: string }) => {
      addFunction(item.functionId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    const dragBlock = composedFunctions[dragIndex];
    const newBlocks = [...composedFunctions];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, dragBlock);
    reorderFunctions(newBlocks);
  };

  // 합성함수 표현식 생성
  const getCompositionExpression = () => {
    if (composedFunctions.length === 0) return 'x';

    const funcNames = composedFunctions.map((block) => {
      const func = availableFunctions.find((f) => f.id === block.functionId);
      return func?.name || '?';
    });

    // f(g(h(x))) 형태로 표시
    let expression = 'x';
    for (let i = funcNames.length - 1; i >= 0; i--) {
      expression = `${funcNames[i]}(${expression})`;
    }

    return expression;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">함수 조립 영역</h3>
        <div
          ref={drop}
          className={`composition-zone ${isOver ? 'drag-over' : ''}`}
        >
          {composedFunctions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              함수를 여기로 드래그하거나 클릭하여 추가하세요
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {composedFunctions.map((block, index) => {
                const func = availableFunctions.find(
                  (f) => f.id === block.functionId
                );
                if (!func) return null;

                return (
                  <div key={block.id} className="flex items-center gap-2">
                    <ComposedBlock
                      block={block}
                      func={func}
                      index={index}
                      onRemove={() => removeFunction(block.id)}
                      onMove={handleMove}
                    />
                    {index < composedFunctions.length - 1 && (
                      <ChevronRight className="text-gray-400" size={24} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 합성함수 표현식 */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-1">현재 합성함수:</div>
        <div className="text-2xl font-mono font-bold text-blue-700">
          {getCompositionExpression()}
        </div>
      </div>
    </div>
  );
};
