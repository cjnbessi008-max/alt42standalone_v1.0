import { useReflectionPair } from '../hooks/useReflectionPair';

export const ControlPanel: React.FC = () => {
  const { config, zoomIn, zoomOut, resetViewport, toggleReflectionLine } = useReflectionPair();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-3 flex justify-around items-center gap-2">
      <button
        onClick={zoomIn}
        className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded transition-all duration-200 font-bold text-lg"
        aria-label="Zoom In"
      >
        +
      </button>

      <button
        onClick={zoomOut}
        className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded transition-all duration-200 font-bold text-lg"
        aria-label="Zoom Out"
      >
        −
      </button>

      <button
        onClick={resetViewport}
        className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded transition-all duration-200 font-bold text-lg"
        aria-label="Reset View"
        title="Reset View"
      >
        ⟲
      </button>

      <button
        onClick={toggleReflectionLine}
        className={`px-3 py-2 rounded transition-all duration-200 text-sm font-medium ${
          config.showReflectionLine
            ? 'bg-reflection text-gray-900'
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        aria-label="Toggle Reflection Line"
      >
        y = x
      </button>
    </div>
  );
};
