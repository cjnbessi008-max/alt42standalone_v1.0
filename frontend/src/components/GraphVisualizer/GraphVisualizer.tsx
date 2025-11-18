import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { motion } from 'framer-motion';
import { GraphData, AnimationPhase } from '../../types/graph';
import './GraphVisualizer.css';

interface GraphVisualizerProps {
  data: GraphData;
  onAnimationComplete?: () => void;
}

/**
 * GraphVisualizer Component
 *
 * Displays a concept graph with a choreographed 1-second animation sequence:
 * - T=0-250ms: Nodes animate in (fade/scale)
 * - T=250-500ms: Edges animate in (draw animation)
 * - T=500-750ms: Layout stabilizes (force-directed layout)
 * - T=750-1000ms: Interactive state ready
 */
const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  onAnimationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('initializing');
  const [progress, setProgress] = useState(0);

  const animationPhases: AnimationPhase[] = [
    { name: 'nodes', duration: 250, startTime: 0 },
    { name: 'edges', duration: 250, startTime: 250 },
    { name: 'stabilize', duration: 250, startTime: 500 },
    { name: 'interactive', duration: 250, startTime: 750 },
  ];

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Create datasets
    const nodes = new DataSet(
      data.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        title: node.title,
        color: {
          background: node.color || '#667eea',
          border: '#ffffff',
          highlight: {
            background: node.color || '#667eea',
            border: '#ffffff',
          },
        },
        font: {
          color: '#ffffff',
          size: 14,
          face: 'Arial',
          bold: {
            color: '#ffffff',
          },
        },
        borderWidth: 3,
        borderWidthSelected: 5,
        shape: 'box',
        margin: 10,
        widthConstraint: {
          minimum: 80,
          maximum: 120,
        },
      }))
    );

    const edges = new DataSet(
      data.edges.map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
          },
        },
        color: {
          color: '#ffffff',
          highlight: '#ffd700',
          opacity: 0.8,
        },
        font: {
          color: '#ffffff',
          size: 11,
          strokeWidth: 3,
          strokeColor: '#764ba2',
          align: 'middle',
        },
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'horizontal',
          roundness: 0.4,
        },
        width: 2,
      }))
    );

    // Network options
    const options = {
      layout: {
        hierarchical: {
          enabled: false,
        },
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 100,
          updateInterval: 10,
        },
        barnesHut: {
          gravitationalConstant: -8000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.5,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
      },
      nodes: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.3)',
          size: 10,
          x: 2,
          y: 2,
        },
      },
      edges: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5,
          x: 1,
          y: 1,
        },
      },
    };

    // Create network
    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options
    );

    networkRef.current = network;

    // Animation sequence (1 second total)
    let animationTimer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const startAnimation = () => {
      const totalDuration = 1000;
      const startTime = Date.now();

      // Progress bar animation
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
        setProgress(newProgress);
      }, 16); // ~60fps

      // Phase 1: Nodes appear (0-250ms)
      setCurrentPhase('nodes');
      nodes.forEach((node) => {
        nodes.update({
          ...node,
          opacity: 0,
          scaling: { min: 0.5, max: 0.5 },
        });
      });

      setTimeout(() => {
        nodes.forEach((node) => {
          nodes.update({
            ...node,
            opacity: 1,
            scaling: { min: 1, max: 1 },
          });
        });
      }, 50);

      // Phase 2: Edges appear (250-500ms)
      setTimeout(() => {
        setCurrentPhase('edges');
        edges.forEach((edge) => {
          edges.update({
            ...edge,
            color: { ...edge.color, opacity: 1 },
          });
        });
      }, 250);

      // Phase 3: Layout stabilizes (500-750ms)
      setTimeout(() => {
        setCurrentPhase('stabilize');
        network.stabilize(50);
      }, 500);

      // Phase 4: Interactive mode ready (750-1000ms)
      setTimeout(() => {
        setCurrentPhase('interactive');
        network.fit({
          animation: {
            duration: 250,
            easingFunction: 'easeOutQuad',
          },
        });
      }, 750);

      // Complete animation
      animationTimer = setTimeout(() => {
        setCurrentPhase('complete');
        clearInterval(progressInterval);
        setProgress(100);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1000);
    };

    // Start animation after network is ready
    network.once('stabilized', () => {
      setTimeout(startAnimation, 100);
    });

    // Cleanup
    return () => {
      if (animationTimer) clearTimeout(animationTimer);
      if (progressInterval) clearInterval(progressInterval);
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, onAnimationComplete]);

  return (
    <div className="graph-visualizer">
      <motion.div
        ref={containerRef}
        className="graph-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Animation progress indicator */}
      <div className="animation-status">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="phase-indicator">
          <span className="phase-label">
            {currentPhase === 'nodes' && 'Loading Concepts...'}
            {currentPhase === 'edges' && 'Drawing Relationships...'}
            {currentPhase === 'stabilize' && 'Organizing Layout...'}
            {currentPhase === 'interactive' && 'Ready!'}
            {currentPhase === 'complete' && 'Interactive Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;
