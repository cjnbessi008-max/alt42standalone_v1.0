/**
 * Vector Canvas Component - Displays and animates vector transformations
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Vector, VectorProblem } from '../../types/vector';

interface VectorCanvasProps {
  problem: VectorProblem;
  onAnimationComplete?: () => void;
  showResult?: boolean;
}

const CANVAS_SIZE = 400;
const GRID_SIZE = 50;
const ARROW_HEAD_SIZE = 8;
const SCALE_FACTOR = 40; // pixels per unit

export const VectorCanvas: React.FC<VectorCanvasProps> = ({
  problem,
  onAnimationComplete,
  showResult = false,
}) => {
  const [animatedVector, setAnimatedVector] = useState<Vector>({
    x: problem.initial_x,
    y: problem.initial_y,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<any>(null);

  const centerX = CANVAS_SIZE / 2;
  const centerY = CANVAS_SIZE / 2;

  // Convert mathematical coordinates to SVG coordinates
  const toSVGCoords = (vec: Vector) => ({
    x: centerX + vec.x * SCALE_FACTOR,
    y: centerY - vec.y * SCALE_FACTOR, // Flip Y axis
  });

  // Calculate transformed vector
  const calculateTransformedVector = (
    initial: Vector,
    progress: number
  ): Vector => {
    let x = initial.x;
    let y = initial.y;

    // Apply rotation
    if (problem.rotation_angle !== undefined && problem.rotation_angle !== null) {
      const angle = (problem.rotation_angle * Math.PI / 180) * progress;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const rotatedX = x * cosAngle - y * sinAngle;
      const rotatedY = x * sinAngle + y * cosAngle;
      x = rotatedX;
      y = rotatedY;
    }

    // Apply scaling
    if (problem.scale_x !== undefined && problem.scale_y !== undefined) {
      const scaleXProgress = 1 + (problem.scale_x - 1) * progress;
      const scaleYProgress = 1 + (problem.scale_y - 1) * progress;
      x *= scaleXProgress;
      y *= scaleYProgress;
    }

    return { x, y };
  };

  // Start animation
  const startAnimation = () => {
    setIsAnimating(true);

    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = animate(0, 1, {
      duration: problem.animation_duration / 1000,
      ease: "easeInOut",
      onUpdate: (progress) => {
        const transformed = calculateTransformedVector(
          { x: problem.initial_x, y: problem.initial_y },
          progress
        );
        setAnimatedVector(transformed);
      },
      onComplete: () => {
        setIsAnimating(false);
        onAnimationComplete?.();
      },
    });
  };

  // Reset animation
  const resetAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    setAnimatedVector({ x: problem.initial_x, y: problem.initial_y });
    setIsAnimating(false);
  };

  useEffect(() => {
    resetAnimation();
  }, [problem]);

  const initialSVG = toSVGCoords({ x: problem.initial_x, y: problem.initial_y });
  const animatedSVG = toSVGCoords(animatedVector);
  const expectedSVG = toSVGCoords({ x: problem.expected_x, y: problem.expected_y });

  // Calculate arrow angle for proper arrowhead rotation
  const getArrowAngle = (dx: number, dy: number) => {
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  return (
    <div className="vector-canvas-container">
      <svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '2px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          </pattern>
          <marker
            id="arrowhead-initial"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#2196F3" />
          </marker>
          <marker
            id="arrowhead-animated"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#4CAF50" />
          </marker>
          <marker
            id="arrowhead-expected"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#FF9800" opacity="0.6" />
          </marker>
        </defs>

        <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#grid)" />

        {/* Axes */}
        <line
          x1={0}
          y1={centerY}
          x2={CANVAS_SIZE}
          y2={centerY}
          stroke="#999"
          strokeWidth="1"
        />
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={CANVAS_SIZE}
          stroke="#999"
          strokeWidth="1"
        />

        {/* Origin */}
        <circle cx={centerX} cy={centerY} r="3" fill="#333" />

        {/* Initial vector (blue) - shown as reference */}
        {!isAnimating && (
          <g opacity="0.4">
            <line
              x1={centerX}
              y1={centerY}
              x2={initialSVG.x}
              y2={initialSVG.y}
              stroke="#2196F3"
              strokeWidth="2"
              markerEnd="url(#arrowhead-initial)"
            />
            <text x={initialSVG.x + 10} y={initialSVG.y - 10} fill="#2196F3" fontSize="12">
              초기
            </text>
          </g>
        )}

        {/* Animated vector (green) */}
        <motion.line
          x1={centerX}
          y1={centerY}
          x2={animatedSVG.x}
          y2={animatedSVG.y}
          stroke="#4CAF50"
          strokeWidth="3"
          markerEnd="url(#arrowhead-animated)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Expected result (orange dashed) - shown when showResult is true */}
        {showResult && (
          <g>
            <line
              x1={centerX}
              y1={centerY}
              x2={expectedSVG.x}
              y2={expectedSVG.y}
              stroke="#FF9800"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-expected)"
              opacity="0.6"
            />
            <text x={expectedSVG.x + 10} y={expectedSVG.y + 20} fill="#FF9800" fontSize="12">
              정답
            </text>
          </g>
        )}
      </svg>

      {/* Control buttons */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          style={{
            padding: '8px 16px',
            background: isAnimating ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {isAnimating ? '애니메이션 중...' : '애니메이션 시작'}
        </button>
        <button
          onClick={resetAnimation}
          style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          초기화
        </button>
      </div>

      {/* Vector information */}
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#555' }}>
        <div>
          <strong>현재 벡터:</strong> ({animatedVector.x.toFixed(2)}, {animatedVector.y.toFixed(2)})
        </div>
        {problem.rotation_angle !== undefined && problem.rotation_angle !== null && (
          <div>
            <strong>회전 각도:</strong> {problem.rotation_angle}°
          </div>
        )}
        {problem.scale_x !== undefined && problem.scale_y !== undefined && (
          <div>
            <strong>스케일:</strong> X={problem.scale_x}x, Y={problem.scale_y}x
          </div>
        )}
      </div>
    </div>
  );
};
