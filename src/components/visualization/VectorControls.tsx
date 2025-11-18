import React from 'react';
import { VectorLayer } from '../../types/vector';

interface VectorControlsProps {
  layers: VectorLayer[];
  onLayersChange: (layers: VectorLayer[]) => void;
}

export const VectorControls: React.FC<VectorControlsProps> = ({
  layers,
  onLayersChange,
}) => {
  const updateLayer = (id: string, updates: Partial<VectorLayer>) => {
    const newLayers = layers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    );
    onLayersChange(newLayers);
  };

  const removeLayer = (id: string) => {
    onLayersChange(layers.filter(layer => layer.id !== id));
  };

  const addLayer = () => {
    const newLayer: VectorLayer = {
      id: `layer-${Date.now()}`,
      vector: { x: 3, y: 2 },
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      opacity: 0.7,
      label: `v${layers.length + 1}`,
    };
    onLayersChange([...layers, newLayer]);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Vector Controls</h3>

      {layers.map((layer, index) => (
        <div key={layer.id} style={styles.layerControl}>
          <div style={styles.layerHeader}>
            <span style={styles.layerTitle}>
              Vector {index + 1}: {layer.label}
            </span>
            <button
              onClick={() => removeLayer(layer.id)}
              style={styles.removeButton}
            >
              ✕
            </button>
          </div>

          <div style={styles.controlRow}>
            <label style={styles.label}>Label:</label>
            <input
              type="text"
              value={layer.label}
              onChange={(e) => updateLayer(layer.id, { label: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.controlRow}>
            <label style={styles.label}>X:</label>
            <input
              type="number"
              value={layer.vector.x}
              onChange={(e) =>
                updateLayer(layer.id, {
                  vector: { ...layer.vector, x: parseFloat(e.target.value) || 0 },
                })
              }
              step="0.5"
              style={styles.input}
            />
          </div>

          <div style={styles.controlRow}>
            <label style={styles.label}>Y:</label>
            <input
              type="number"
              value={layer.vector.y}
              onChange={(e) =>
                updateLayer(layer.id, {
                  vector: { ...layer.vector, y: parseFloat(e.target.value) || 0 },
                })
              }
              step="0.5"
              style={styles.input}
            />
          </div>

          <div style={styles.controlRow}>
            <label style={styles.label}>Color:</label>
            <input
              type="color"
              value={layer.color}
              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
              style={styles.colorInput}
            />
          </div>

          <div style={styles.controlRow}>
            <label style={styles.label}>Opacity:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layer.opacity}
              onChange={(e) =>
                updateLayer(layer.id, { opacity: parseFloat(e.target.value) })
              }
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{layer.opacity.toFixed(1)}</span>
          </div>
        </div>
      ))}

      <button onClick={addLayer} style={styles.addButton}>
        + Add Vector Layer
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '8px',
    minWidth: '300px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  layerControl: {
    background: '#fff',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
  },
  layerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  },
  layerTitle: {
    fontWeight: 'bold',
    color: '#555',
  },
  removeButton: {
    background: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  label: {
    width: '80px',
    fontSize: '14px',
    color: '#666',
  },
  input: {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  colorInput: {
    flex: 1,
    height: '32px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  slider: {
    flex: 1,
    marginRight: '10px',
  },
  sliderValue: {
    width: '30px',
    fontSize: '14px',
    color: '#666',
  },
  addButton: {
    width: '100%',
    padding: '12px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default VectorControls;
