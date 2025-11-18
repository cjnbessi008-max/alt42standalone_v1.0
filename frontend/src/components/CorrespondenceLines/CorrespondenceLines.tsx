import React, { useState, useRef, useEffect } from 'react';
import LineDrawing from './LineDrawing';
import CorrespondenceItem from './CorrespondenceItem';
import { Connection, InteractionEvent, ItemPosition, Problem } from '../../types';

interface CorrespondenceLinesProps {
  problem: Problem;
  onSubmit: (
    connections: Connection[],
    timeSpent: number,
    interactions: InteractionEvent[]
  ) => void;
  disabled?: boolean;
}

const CorrespondenceLines: React.FC<CorrespondenceLinesProps> = ({
  problem,
  onSubmit,
  disabled = false,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawingFrom, setDrawingFrom] = useState<{
    itemId: string;
    side: 'left' | 'right';
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [itemPositions, setItemPositions] = useState<Map<string, ItemPosition>>(
    new Map()
  );
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const [startTime] = useState<number>(Date.now());

  const containerRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // Track item positions for line drawing
  useEffect(() => {
    const updatePositions = () => {
      const positions = new Map<string, ItemPosition>();

      // Get left items positions
      leftColumnRef.current?.querySelectorAll('.correspondence-item').forEach(
        (element, index) => {
          const rect = element.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const item = problem.left_items[index];
            positions.set(item.id, {
              id: item.id,
              x: rect.right - containerRect.left,
              y: rect.top + rect.height / 2 - containerRect.top,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      );

      // Get right items positions
      rightColumnRef.current?.querySelectorAll('.correspondence-item').forEach(
        (element, index) => {
          const rect = element.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const item = problem.right_items[index];
            positions.set(item.id, {
              id: item.id,
              x: rect.left - containerRect.left,
              y: rect.top + rect.height / 2 - containerRect.top,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      );

      setItemPositions(positions);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [problem]);

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingFrom && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle touch move for mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (drawingFrom && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setMousePosition({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  };

  // Start drawing connection
  const handleConnectionStart = (itemId: string, side: 'left' | 'right') => {
    if (disabled) return;

    setDrawingFrom({ itemId, side });

    // Record interaction
    const event: InteractionEvent = {
      timestamp: Date.now() - startTime,
      action: 'draw',
      [side === 'left' ? 'leftId' : 'rightId']: itemId,
    };
    setInteractions((prev) => [...prev, event]);
  };

  // Complete drawing connection
  const handleConnectionEnd = (itemId: string, side: 'left' | 'right') => {
    if (!drawingFrom || disabled) {
      setDrawingFrom(null);
      setMousePosition(null);
      return;
    }

    // Can only connect left to right or right to left
    if (drawingFrom.side === side) {
      setDrawingFrom(null);
      setMousePosition(null);
      return;
    }

    const leftId = drawingFrom.side === 'left' ? drawingFrom.itemId : itemId;
    const rightId = drawingFrom.side === 'right' ? drawingFrom.itemId : itemId;

    // Check if connection already exists
    const existingIndex = connections.findIndex(
      (conn) => conn.leftId === leftId || conn.rightId === rightId
    );

    if (existingIndex >= 0) {
      // Remove existing connection
      const newConnections = connections.filter((_, i) => i !== existingIndex);
      setConnections(newConnections);

      const event: InteractionEvent = {
        timestamp: Date.now() - startTime,
        action: 'remove',
        leftId,
        rightId,
      };
      setInteractions((prev) => [...prev, event]);
    }

    // Add new connection
    const newConnection: Connection = { leftId, rightId };
    setConnections([...connections.filter((_, i) => i !== existingIndex), newConnection]);

    const event: InteractionEvent = {
      timestamp: Date.now() - startTime,
      action: 'draw',
      leftId,
      rightId,
    };
    setInteractions((prev) => [...prev, event]);

    setDrawingFrom(null);
    setMousePosition(null);
  };

  // Handle submit
  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const submitEvent: InteractionEvent = {
      timestamp: Date.now() - startTime,
      action: 'submit',
    };
    const allInteractions = [...interactions, submitEvent];

    onSubmit(connections, timeSpent, allInteractions);
  };

  // Check if item is connected
  const isItemConnected = (itemId: string, side: 'left' | 'right'): boolean => {
    return connections.some((conn) =>
      side === 'left' ? conn.leftId === itemId : conn.rightId === itemId
    );
  };

  // Check if item is active (being drawn from/to)
  const isItemActive = (itemId: string): boolean => {
    return drawingFrom?.itemId === itemId;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Instructions */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{problem.title}</h3>
        {problem.description && (
          <p style={{ margin: '0 0 8px 0', color: '#666' }}>{problem.description}</p>
        )}
        {problem.instructions && (
          <p style={{ margin: '0', color: '#777', fontSize: '14px' }}>
            {problem.instructions}
          </p>
        )}
      </div>

      {/* Main drawing area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{
          position: 'relative',
          minHeight: '400px',
          backgroundColor: '#FAFAFA',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #E0E0E0',
        }}
      >
        {/* SVG overlay for lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {/* Draw established connections */}
          {connections.map((conn, index) => {
            const fromPos = itemPositions.get(conn.leftId);
            const toPos = itemPositions.get(conn.rightId);

            if (fromPos && toPos) {
              return (
                <LineDrawing
                  key={`${conn.leftId}-${conn.rightId}-${index}`}
                  from={{ x: fromPos.x, y: fromPos.y }}
                  to={{ x: toPos.x, y: toPos.y }}
                  isActive={false}
                />
              );
            }
            return null;
          })}

          {/* Draw active connection being drawn */}
          {drawingFrom && mousePosition && itemPositions.get(drawingFrom.itemId) && (
            <LineDrawing
              from={{
                x: itemPositions.get(drawingFrom.itemId)!.x,
                y: itemPositions.get(drawingFrom.itemId)!.y,
              }}
              to={mousePosition}
              isActive={true}
            />
          )}
        </svg>

        {/* Two columns layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Left column */}
          <div ref={leftColumnRef}>
            {problem.left_items.map((item) => (
              <CorrespondenceItem
                key={item.id}
                item={item}
                side="left"
                isConnected={isItemConnected(item.id, 'left')}
                isActive={isItemActive(item.id)}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
              />
            ))}
          </div>

          {/* Right column */}
          <div ref={rightColumnRef}>
            {problem.right_items.map((item) => (
              <CorrespondenceItem
                key={item.id}
                item={item}
                side="right"
                isConnected={isItemConnected(item.id, 'right')}
                isActive={isItemActive(item.id)}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#666', fontSize: '14px' }}>
          Connected: {connections.length} / {problem.left_items.length}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setConnections([]);
              setInteractions([]);
            }}
            disabled={disabled || connections.length === 0}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              backgroundColor: '#F5F5F5',
              color: '#666',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            Clear All
          </button>

          <button
            onClick={handleSubmit}
            disabled={disabled || connections.length !== problem.left_items.length}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '8px',
              cursor:
                disabled || connections.length !== problem.left_items.length
                  ? 'not-allowed'
                  : 'pointer',
              backgroundColor:
                connections.length === problem.left_items.length
                  ? '#4A90E2'
                  : '#BDBDBD',
              color: 'white',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow:
                connections.length === problem.left_items.length
                  ? '0 4px 12px rgba(74, 144, 226, 0.3)'
                  : 'none',
            }}
          >
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrespondenceLines;
