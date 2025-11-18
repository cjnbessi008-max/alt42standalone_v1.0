import { useState } from 'react';
import { Shape, ShapeType } from './types/Shape';
import { MobilePhoneFrame } from './components/MobilePhoneFrame';
import { ShapeRenderer } from './components/ShapeRenderer';
import { ControlPanel } from './components/ControlPanel';
import { createShape, getRandomColor, getRandomPosition } from './utils/shapeFactory';
import './App.css';

const VIEWPORT_WIDTH = 375;
const VIEWPORT_HEIGHT = 667;

function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const handleAddShape = (type: ShapeType) => {
    const color = getRandomColor();
    const position = getRandomPosition(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 80);
    const newShape = createShape(type, position.x, position.y, color);
    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
  };

  const handleUpdateShape = (shapeId: string, updates: Partial<Shape>) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === shapeId ? { ...shape, ...updates } : shape
      )
    );
  };

  const handleDeleteShape = (shapeId: string) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== shapeId));
    if (selectedShapeId === shapeId) {
      setSelectedShapeId(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('모든 도형을 삭제하시겠습니까?')) {
      setShapes([]);
      setSelectedShapeId(null);
    }
  };

  const handleShapeClick = (shapeId: string) => {
    setSelectedShapeId(shapeId);
  };

  return (
    <div className="app">
      <div className="background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <header className="header">
        <h1 className="title">
          <span className="title-icon">🔮</span>
          Overlap Vision
        </h1>
        <p className="subtitle">겹쳐보는 도형 투명 오버레이</p>
      </header>

      <ControlPanel
        shapes={shapes}
        selectedShapeId={selectedShapeId}
        onAddShape={handleAddShape}
        onUpdateShape={handleUpdateShape}
        onDeleteShape={handleDeleteShape}
        onClearAll={handleClearAll}
      />

      <MobilePhoneFrame
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        backgroundColor="#f8fafc"
      >
        <ShapeRenderer
          shapes={shapes}
          onShapeClick={handleShapeClick}
          selectedShapeId={selectedShapeId}
        />
      </MobilePhoneFrame>

      {shapes.length === 0 && (
        <div className="welcome-message">
          <p>👆 왼쪽 패널에서 도형을 추가해보세요!</p>
        </div>
      )}
    </div>
  );
}

export default App;
