// Geometry Canvas using React-Konva

import React, { useRef, useState } from 'react';
import { Stage, Layer, Line as KonvaLine, Circle, Text, Rect } from 'react-konva';
import { Box } from '@mui/material';
import { Line, Point, CanvasConfig } from '@/types/geometry';
import { calculateDistance } from '@/utils/geometry';

interface GeometryCanvasProps {
  lines: Line[];
  config: CanvasConfig;
  selectedLineId: string | null;
  onLineUpdate: (lineId: string, updates: Partial<Line>) => void;
  onLineSelect: (lineId: string | null) => void;
}

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  lines,
  config,
  selectedLineId,
  onLineUpdate,
  onLineSelect,
}) => {
  const stageRef = useRef(null);
  const [draggedPoint, setDraggedPoint] = useState<{
    lineId: string;
    point: 'start' | 'end';
  } | null>(null);

  const handlePointDragMove = (
    lineId: string,
    point: 'start' | 'end',
    newPos: Point
  ) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const updates: Partial<Line> = {
      [point]: newPos,
    };

    // Recalculate length
    const start = point === 'start' ? newPos : line.start;
    const end = point === 'end' ? newPos : line.end;
    updates.length = calculateDistance(start, end);

    onLineUpdate(lineId, updates);
  };

  const renderGrid = () => {
    if (!config.gridEnabled) return null;

    const gridLines = [];
    const { width, height, gridSize } = config;

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      gridLines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      gridLines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[0, i, width, i]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }

    return gridLines;
  };

  const renderLine = (line: Line) => {
    const isSelected = line.id === selectedLineId;
    const lineColor = isSelected ? '#1976d2' : line.color;
    const lineWidth = isSelected ? 3 : 2;

    return (
      <React.Fragment key={line.id}>
        {/* The line itself */}
        <KonvaLine
          points={[line.start.x, line.start.y, line.end.x, line.end.y]}
          stroke={lineColor}
          strokeWidth={lineWidth}
          onClick={() => onLineSelect(line.id)}
          onTap={() => onLineSelect(line.id)}
        />

        {/* Start point */}
        {line.isDraggable && (
          <Circle
            x={line.start.x}
            y={line.start.y}
            radius={isSelected ? 8 : 6}
            fill={isSelected ? '#1976d2' : '#757575'}
            stroke="#fff"
            strokeWidth={2}
            draggable
            onDragMove={(e) => {
              handlePointDragMove(line.id, 'start', {
                x: e.target.x(),
                y: e.target.y(),
              });
            }}
            onDragStart={() => setDraggedPoint({ lineId: line.id, point: 'start' })}
            onDragEnd={() => setDraggedPoint(null)}
          />
        )}

        {/* End point */}
        {line.isDraggable && (
          <Circle
            x={line.end.x}
            y={line.end.y}
            radius={isSelected ? 8 : 6}
            fill={isSelected ? '#1976d2' : '#757575'}
            stroke="#fff"
            strokeWidth={2}
            draggable
            onDragMove={(e) => {
              handlePointDragMove(line.id, 'end', {
                x: e.target.x(),
                y: e.target.y(),
              });
            }}
            onDragStart={() => setDraggedPoint({ lineId: line.id, point: 'end' })}
            onDragEnd={() => setDraggedPoint(null)}
          />
        )}

        {/* Length label */}
        {line.label && (
          <Text
            x={(line.start.x + line.end.x) / 2 - 20}
            y={(line.start.y + line.end.y) / 2 - 20}
            text={line.label}
            fontSize={14}
            fontStyle="bold"
            fill={lineColor}
          />
        )}

        {/* Length measurement */}
        {isSelected && (
          <Text
            x={(line.start.x + line.end.x) / 2 - 30}
            y={(line.start.y + line.end.y) / 2 + 10}
            text={`${Math.round(line.length)} px`}
            fontSize={12}
            fill="#666"
            padding={4}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #ddd',
      }}
    >
      <Stage
        ref={stageRef}
        width={config.width}
        height={config.height}
        onClick={(e) => {
          // Deselect if clicking on empty space
          if (e.target === e.target.getStage()) {
            onLineSelect(null);
          }
        }}
      >
        <Layer>
          {/* Grid */}
          {renderGrid()}

          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={config.width}
            height={config.height}
            fill={config.backgroundColor}
            listening={false}
          />

          {/* Lines */}
          {lines.map((line) => renderLine(line))}
        </Layer>
      </Stage>

      {/* Instructions overlay */}
      {lines.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#999',
            pointerEvents: 'none',
          }}
        >
          <p>문제가 여기에 표시됩니다</p>
          <p style={{ fontSize: '12px' }}>점을 드래그하여 길이를 조절하세요</p>
        </Box>
      )}
    </Box>
  );
};

export default GeometryCanvas;
