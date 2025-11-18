import React, { useEffect, useRef, useState } from 'react';
import { RecurrenceNode, RecurrenceTree } from '../types/recurrence';
import './RecurrenceWave.css';

interface RecurrenceWaveProps {
  tree: RecurrenceTree;
  isAnimating: boolean;
  speed: number;
}

interface WaveLayer {
  depth: number;
  nodes: RecurrenceNode[];
  amplitude: number;
  frequency: number;
  phase: number;
  color: string;
}

export const RecurrenceWave: React.FC<RecurrenceWaveProps> = ({
  tree,
  isAnimating,
  speed
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentDepth, setCurrentDepth] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 노드를 깊이별로 그룹화
    const layers: WaveLayer[] = [];
    const collectNodesByDepth = (node: RecurrenceNode) => {
      if (!layers[node.depth]) {
        layers[node.depth] = {
          depth: node.depth,
          nodes: [],
          amplitude: 30 - node.depth * 3,
          frequency: 0.01 + node.depth * 0.005,
          phase: 0,
          color: `hsl(${200 + node.depth * 20}, 70%, ${60 - node.depth * 5}%)`
        };
      }
      layers[node.depth].nodes.push(node);

      if (node.children) {
        node.children.forEach(child => collectNodesByDepth(child));
      }
    };

    collectNodesByDepth(tree.root);

    // 애니메이션 루프
    const animate = () => {
      if (!isAnimating) return;

      ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      timeRef.current += speed;

      // 깊이별로 파도 그리기
      layers.forEach((layer, index) => {
        if (index > currentDepth) return;

        const y = (canvas.height / (tree.maxDepth + 1)) * (layer.depth + 1);

        ctx.beginPath();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = layer.color;

        // 파도 그리기
        for (let x = 0; x < canvas.width; x += 2) {
          const waveY = y +
            Math.sin(x * layer.frequency + timeRef.current + layer.phase) * layer.amplitude +
            Math.sin(x * layer.frequency * 2 + timeRef.current * 1.5) * (layer.amplitude / 3);

          if (x === 0) {
            ctx.moveTo(x, waveY);
          } else {
            ctx.lineTo(x, waveY);
          }
        }

        ctx.stroke();

        // 노드 표시
        layer.nodes.forEach((node, nodeIndex) => {
          const nodeX = (canvas.width / (layer.nodes.length + 1)) * (nodeIndex + 1);
          const waveOffset = Math.sin(nodeX * layer.frequency + timeRef.current + layer.phase) * layer.amplitude;
          const nodeY = y + waveOffset;

          // 노드 원
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 8, 0, Math.PI * 2);
          ctx.fillStyle = layer.color;
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 노드 값 표시
          ctx.fillStyle = 'white';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'black';
          ctx.fillText(`${node.value}`, nodeX, nodeY);

          // 결과 표시 (base case)
          if (node.result !== undefined && (!node.children || node.children.length === 0)) {
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`=${node.result}`, nodeX, nodeY + 18);
          }
        });

        ctx.shadowBlur = 0;
      });

      // 진행 상태 업데이트
      if (timeRef.current % (Math.PI * 2) < 0.1 && currentDepth < tree.maxDepth - 1) {
        setCurrentDepth(prev => Math.min(prev + 1, tree.maxDepth - 1));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [tree, isAnimating, speed, currentDepth]);

  const resetAnimation = () => {
    setCurrentDepth(0);
    timeRef.current = 0;
  };

  return (
    <div className="recurrence-wave-container">
      <canvas ref={canvasRef} className="wave-canvas" />
      <div className="wave-info">
        <div className="depth-indicator">
          깊이: {currentDepth + 1} / {tree.maxDepth}
        </div>
        <div className="node-count">
          노드 수: {tree.totalNodes}
        </div>
        <button className="reset-button" onClick={resetAnimation}>
          다시 시작
        </button>
      </div>
    </div>
  );
};
