import { useState } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { GraphVisualization } from './components/GraphVisualization';
import { WaveDerivativeVisualization } from './components/WaveDerivativeVisualization';
import { MathFunctions } from './utils/derivative';

type FunctionName = keyof typeof MathFunctions;

function App() {
  const [selectedFunction, setSelectedFunction] = useState<FunctionName>('sine');
  const [shakeData, setShakeData] = useState({
    intensity: 0,
    position: { x: 0, y: 0 },
    isActive: false,
  });

  const handleShake = (intensity: number, position: { x: number; y: number }) => {
    setShakeData({
      intensity,
      position,
      isActive: true,
    });

    // Auto-hide after 3 seconds of no activity
    setTimeout(() => {
      setShakeData(prev => ({
        ...prev,
        isActive: false,
      }));
    }, 3000);
  };

  const functionOptions: { value: FunctionName; label: string; formula: string }[] = [
    { value: 'sine', label: 'Sine Wave', formula: 'sin(x)' },
    { value: 'cosine', label: 'Cosine Wave', formula: 'cos(x)' },
    { value: 'quadratic', label: 'Quadratic', formula: 'x²' },
    { value: 'cubic', label: 'Cubic', formula: 'x³' },
    { value: 'polynomial', label: 'Polynomial', formula: '0.1x³ - 0.5x² + x + 2' },
    { value: 'exponential', label: 'Exponential', formula: 'e^(x/2)' },
    { value: 'logarithmic', label: 'Logarithmic', formula: 'ln(x)' },
    { value: 'tangent', label: 'Tangent', formula: 'tan(x)' },
  ];

  return (
    <div className="min-h-screen w-full p-8">
      {/* Desktop view - main content */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Wave Derivative Explorer
          </h1>
          <p className="text-white/90 text-lg drop-shadow">
            Shake the graph to see the rate of change as a wave
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3 text-lg">
              Select a Mathematical Function:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {functionOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFunction(option.value)}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    selectedFunction === option.value
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white/80 text-gray-800 hover:bg-white hover:scale-102'
                  }`}
                >
                  <div className="font-bold text-sm">{option.label}</div>
                  <div className="text-xs mt-1 opacity-80">{option.formula}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-gray-800">
                Interactive Graph Visualization
              </h2>
            </div>
            <p className="text-gray-700 mb-4 text-sm">
              <strong>Instructions:</strong> Click and drag on the graph to "shake" it.
              The faster you move your mouse, the stronger the shake effect.
              Watch as the derivative visualization appears below!
            </p>
          </div>
        </div>
      </div>

      {/* Smartphone frame with app content */}
      <SmartphoneFrame>
        <div className="h-full flex flex-col p-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-purple-800 mb-1">
              Wave Derivative
            </h2>
            <p className="text-sm text-gray-600">
              Current function: <span className="font-mono font-bold text-purple-600">
                {functionOptions.find(f => f.value === selectedFunction)?.formula}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-3 mb-3">
            <GraphVisualization
              mathFunction={MathFunctions[selectedFunction]}
              onShake={handleShake}
            />
          </div>

          <WaveDerivativeVisualization
            mathFunction={MathFunctions[selectedFunction]}
            shakeIntensity={shakeData.intensity}
            position={shakeData.position}
            isActive={shakeData.isActive}
          />

          {!shakeData.isActive && (
            <div className="mt-auto text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                <svg
                  className="w-5 h-5 text-purple-600 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
                <span className="text-sm font-medium text-purple-800">
                  Drag the graph to activate!
                </span>
              </div>
            </div>
          )}
        </div>
      </SmartphoneFrame>
    </div>
  );
}

export default App;
