import React, { useState } from 'react';
import { LinearComboLayer } from './components/visualization/LinearComboLayer';
import { VectorControls } from './components/visualization/VectorControls';
import { VectorLayer } from './types/vector';
import './styles/App.css';

const initialLayers: VectorLayer[] = [
  {
    id: 'layer-1',
    vector: { x: 3, y: 2 },
    color: '#FF6B6B',
    opacity: 0.7,
    label: 'v1',
  },
  {
    id: 'layer-2',
    vector: { x: 1, y: 4 },
    color: '#4ECDC4',
    opacity: 0.7,
    label: 'v2',
  },
  {
    id: 'layer-3',
    vector: { x: -2, y: 1 },
    color: '#95E1D3',
    opacity: 0.7,
    label: 'v3',
  },
];

function App() {
  const [layers, setLayers] = useState<VectorLayer[]>(initialLayers);
  const [showInfo, setShowInfo] = useState(true);

  const resetLayers = () => {
    setLayers(initialLayers);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Linear Combo Layer Visualization</h1>
        <p className="subtitle">
          Interactive visualization of linear combinations with color-coded vector layers
        </p>
      </header>

      {showInfo && (
        <div className="info-banner">
          <div className="info-content">
            <h3>ℹ️ How to Use</h3>
            <ul>
              <li>Adjust vector components (X, Y) using the controls on the right</li>
              <li>Change colors and opacity for each vector layer</li>
              <li>The <strong>dashed line</strong> shows the linear combination result (sum of all vectors)</li>
              <li>Hover over layer info to highlight specific vectors</li>
              <li>Add or remove vector layers to explore different combinations</li>
            </ul>
          </div>
          <button className="close-button" onClick={() => setShowInfo(false)}>
            ✕
          </button>
        </div>
      )}

      <div className="main-content">
        <div className="visualization-panel">
          <LinearComboLayer layers={layers} />

          <div className="action-buttons">
            <button className="reset-button" onClick={resetLayers}>
              🔄 Reset to Default
            </button>
            <button className="info-button" onClick={() => setShowInfo(!showInfo)}>
              {showInfo ? 'Hide' : 'Show'} Info
            </button>
          </div>

          <div className="formula-display">
            <h3>Linear Combination Formula:</h3>
            <div className="formula">
              <strong>Result = </strong>
              {layers.map((layer, index) => (
                <span key={layer.id}>
                  {index > 0 && ' + '}
                  <span style={{ color: layer.color, fontWeight: 'bold' }}>
                    {layer.label}
                  </span>
                </span>
              ))}
            </div>
            <div className="formula-expanded">
              <strong>= </strong>
              {layers.map((layer, index) => (
                <span key={layer.id}>
                  {index > 0 && ' + '}
                  <span style={{ color: layer.color }}>
                    ({layer.vector.x.toFixed(1)}, {layer.vector.y.toFixed(1)})
                  </span>
                </span>
              ))}
            </div>
            <div className="result">
              <strong>= </strong>
              (
              {layers.reduce((sum, l) => sum + l.vector.x, 0).toFixed(1)},
              {' '}
              {layers.reduce((sum, l) => sum + l.vector.y, 0).toFixed(1)}
              )
            </div>
          </div>
        </div>

        <div className="controls-panel">
          <VectorControls layers={layers} onLayersChange={setLayers} />
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Built for KAIST Touch Math Academy | AI Education System Pipeline
        </p>
        <p className="tech-stack">
          React 18 + TypeScript + Canvas API
        </p>
      </footer>
    </div>
  );
}

export default App;
