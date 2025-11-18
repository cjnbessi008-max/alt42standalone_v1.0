import React, { useRef, useEffect, useState } from 'react';
import { VectorLayer, ComboLayerConfig, Vector2D } from '../../types/vector';
import { linearCombination, toScreenCoords, magnitude } from '../../utils/vectorMath';
import { blendColors } from '../../utils/colorBlending';

interface LinearComboLayerProps {
  layers: VectorLayer[];
  config?: Partial<ComboLayerConfig>;
  onLayerChange?: (layers: VectorLayer[]) => void;
}

const defaultConfig: ComboLayerConfig = {
  width: 600,
  height: 600,
  scale: 40,
  showGrid: true,
  showAxes: true,
  showLabels: true,
  gridSpacing: 1,
};

export const LinearComboLayer: React.FC<LinearComboLayerProps> = ({
  layers,
  config: userConfig,
  onLayerChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const config = { ...defaultConfig, ...userConfig };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);

    const centerX = config.width / 2;
    const centerY = config.height / 2;

    // Draw grid
    if (config.showGrid) {
      drawGrid(ctx, config, centerX, centerY);
    }

    // Draw axes
    if (config.showAxes) {
      drawAxes(ctx, config, centerX, centerY);
    }

    // Draw each vector layer
    layers.forEach((layer) => {
      drawVectorLayer(ctx, layer, config, centerX, centerY, hoveredLayer === layer.id);
    });

    // Draw linear combination result
    if (layers.length > 1) {
      const result = linearCombination({
        coefficients: layers.map(() => 1),
        vectors: layers.map(l => l.vector),
      });
      drawResultVector(ctx, result, config, centerX, centerY, layers);
    }
  }, [layers, config, hoveredLayer]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          background: '#ffffff',
        }}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Vector Layers</div>
        {layers.map((layer) => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              cursor: 'pointer',
              padding: '4px',
              background: hoveredLayer === layer.id ? '#f0f0f0' : 'transparent',
            }}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            <div
              style={{
                width: 16,
                height: 16,
                background: layer.color,
                opacity: layer.opacity,
                marginRight: 8,
                border: '1px solid #333',
              }}
            />
            <span>
              {layer.label}: ({layer.vector.x.toFixed(1)}, {layer.vector.y.toFixed(1)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to draw grid
const drawGrid = (
  ctx: CanvasRenderingContext2D,
  config: ComboLayerConfig,
  centerX: number,
  centerY: number
) => {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;

  const { scale, gridSpacing, width, height } = config;
  const step = gridSpacing * scale;

  // Vertical lines
  for (let x = centerX % step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = centerY % step; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

// Helper function to draw axes
const drawAxes = (
  ctx: CanvasRenderingContext2D,
  config: ComboLayerConfig,
  centerX: number,
  centerY: number
) => {
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;

  // X-axis
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(config.width, centerY);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, config.height);
  ctx.stroke();

  // Arrowheads
  drawArrow(ctx, config.width - 10, centerY, config.width, centerY);
  drawArrow(ctx, centerX, 10, centerX, 0);

  // Labels
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText('x', config.width - 20, centerY - 10);
  ctx.fillText('y', centerX + 10, 20);
};

// Helper function to draw an arrow
const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) => {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 6),
    toY - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 6),
    toY - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
};

// Helper function to draw a vector layer
const drawVectorLayer = (
  ctx: CanvasRenderingContext2D,
  layer: VectorLayer,
  config: ComboLayerConfig,
  centerX: number,
  centerY: number,
  isHovered: boolean
) => {
  const screenCoords = toScreenCoords(layer.vector, centerX, centerY, config.scale);

  // Draw vector arrow
  ctx.strokeStyle = layer.color;
  ctx.fillStyle = layer.color;
  ctx.globalAlpha = layer.opacity;
  ctx.lineWidth = isHovered ? 4 : 3;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(screenCoords.x, screenCoords.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(layer.vector.y, layer.vector.x);
  const arrowSize = 12;
  ctx.beginPath();
  ctx.moveTo(screenCoords.x, screenCoords.y);
  ctx.lineTo(
    screenCoords.x - arrowSize * Math.cos(angle - Math.PI / 6),
    screenCoords.y + arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    screenCoords.x - arrowSize * Math.cos(angle + Math.PI / 6),
    screenCoords.y + arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Draw label
  if (config.showLabels) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#333';
    ctx.font = isHovered ? 'bold 14px Arial' : '12px Arial';
    ctx.fillText(
      layer.label,
      screenCoords.x + 10,
      screenCoords.y - 10
    );
  }

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
};

// Helper function to draw result vector
const drawResultVector = (
  ctx: CanvasRenderingContext2D,
  result: Vector2D,
  config: ComboLayerConfig,
  centerX: number,
  centerY: number,
  layers: VectorLayer[]
) => {
  const screenCoords = toScreenCoords(result, centerX, centerY, config.scale);

  // Blend colors based on layer colors
  const blendedColor = blendColors(
    layers.map(l => ({ color: l.color, opacity: l.opacity }))
  );

  // Draw dashed line for result
  ctx.strokeStyle = blendedColor;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 5]);

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(screenCoords.x, screenCoords.y);
  ctx.stroke();

  ctx.setLineDash([]);

  // Draw result arrowhead
  const angle = Math.atan2(result.y, result.x);
  const arrowSize = 14;
  ctx.fillStyle = blendedColor;
  ctx.beginPath();
  ctx.moveTo(screenCoords.x, screenCoords.y);
  ctx.lineTo(
    screenCoords.x - arrowSize * Math.cos(angle - Math.PI / 6),
    screenCoords.y + arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    screenCoords.x - arrowSize * Math.cos(angle + Math.PI / 6),
    screenCoords.y + arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Draw result label
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px Arial';
  const mag = magnitude(result);
  ctx.fillText(
    `Result: (${result.x.toFixed(1)}, ${result.y.toFixed(1)}) |r|=${mag.toFixed(2)}`,
    screenCoords.x + 15,
    screenCoords.y
  );
};

export default LinearComboLayer;
