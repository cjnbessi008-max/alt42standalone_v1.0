import React from 'react';
import { Shape, ShapeType, BlendMode } from '../types/Shape';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onAddShape: (type: ShapeType) => void;
  onUpdateShape: (shapeId: string, updates: Partial<Shape>) => void;
  onDeleteShape: (shapeId: string) => void;
  onClearAll: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  shapes,
  selectedShapeId,
  onAddShape,
  onUpdateShape,
  onDeleteShape,
  onClearAll,
}) => {
  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const shapeTypes: ShapeType[] = ['circle', 'square', 'triangle', 'rectangle', 'pentagon', 'hexagon'];
  const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];

  return (
    <div className={styles.controlPanel}>
      <div className={styles.section}>
        <h3>도형 추가</h3>
        <div className={styles.shapeButtons}>
          {shapeTypes.map((type) => (
            <button
              key={type}
              onClick={() => onAddShape(type)}
              className={styles.shapeButton}
              title={`${type} 추가`}
            >
              {getShapeIcon(type)}
            </button>
          ))}
        </div>
      </div>

      {selectedShape && (
        <>
          <div className={styles.section}>
            <h3>선택된 도형: {selectedShape.type}</h3>

            <label className={styles.label}>
              투명도: {Math.round(selectedShape.opacity * 100)}%
              <input
                type="range"
                min="0"
                max="100"
                value={selectedShape.opacity * 100}
                onChange={(e) =>
                  onUpdateShape(selectedShape.id, { opacity: parseInt(e.target.value) / 100 })
                }
                className={styles.slider}
              />
            </label>

            <label className={styles.label}>
              색상:
              <input
                type="color"
                value={selectedShape.fill}
                onChange={(e) => onUpdateShape(selectedShape.id, { fill: e.target.value })}
                className={styles.colorPicker}
              />
            </label>

            <label className={styles.label}>
              블렌드 모드:
              <select
                value={selectedShape.blendMode}
                onChange={(e) =>
                  onUpdateShape(selectedShape.id, { blendMode: e.target.value as BlendMode })
                }
                className={styles.select}
              >
                {blendModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              회전: {selectedShape.rotation}°
              <input
                type="range"
                min="0"
                max="360"
                value={selectedShape.rotation}
                onChange={(e) =>
                  onUpdateShape(selectedShape.id, { rotation: parseInt(e.target.value) })
                }
                className={styles.slider}
              />
            </label>

            <label className={styles.label}>
              크기: {Math.round(selectedShape.size.width)}px
              <input
                type="range"
                min="30"
                max="200"
                value={selectedShape.size.width}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  onUpdateShape(selectedShape.id, {
                    size: { width: newSize, height: newSize },
                  });
                }}
                className={styles.slider}
              />
            </label>

            <button
              onClick={() => onDeleteShape(selectedShape.id)}
              className={styles.deleteButton}
            >
              🗑️ 삭제
            </button>
          </div>
        </>
      )}

      <div className={styles.section}>
        <div className={styles.info}>
          <p>총 도형: {shapes.length}</p>
          <button onClick={onClearAll} className={styles.clearButton} disabled={shapes.length === 0}>
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  );
};

const getShapeIcon = (type: ShapeType): string => {
  const icons: Record<ShapeType, string> = {
    circle: '⚫',
    square: '⬛',
    triangle: '🔺',
    rectangle: '▬',
    pentagon: '⬟',
    hexagon: '⬢',
  };
  return icons[type];
};
