import { useReflectionPair } from '../hooks/useReflectionPair';
import { getFunctionLabel } from '../utils/math';

export const Legend: React.FC = () => {
  const { config } = useReflectionPair();

  const expLabel = getFunctionLabel('exp', config.baseNumber);
  const logLabel = getFunctionLabel('log', config.baseNumber);

  return (
    <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 text-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-exponential rounded" />
          <span className="font-mono text-gray-800">{expLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-logarithmic rounded" />
          <span className="font-mono text-gray-800">{logLabel}</span>
        </div>
        {config.showReflectionLine && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-reflection rounded border-dashed border border-reflection" />
            <span className="font-mono text-gray-800">y = x</span>
          </div>
        )}
      </div>
    </div>
  );
};
