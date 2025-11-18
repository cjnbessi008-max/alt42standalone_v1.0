/**
 * GraphEmotion Component
 * 그래프의 감정을 온도, 색감, 리듬으로 표현하는 메인 컴포넌트
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge } from '../../types/graph.types';
import {
  mapDifficultyToTemperature,
  mapNodeToColorEmotion,
  mapProgressToRhythm,
  calculateNodeSize,
  calculateEdgeThickness,
  calculateAnimationDuration,
} from '../../utils/emotionMapper';

interface GraphEmotionProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

export const GraphEmotion: React.FC<GraphEmotionProps> = ({
  data,
  width = 400,
  height = 600,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // SVG 초기화
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 컨테이너 그룹
    const container = svg
      .append('g')
      .attr('class', 'graph-container')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Force Simulation 설정
    const simulation = d3
      .forceSimulation<GraphNode>(data.nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(data.edges)
          .id((d) => d.id)
          .distance(80)
          .strength((d) => d.strength)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => calculateNodeSize(d) / 2 + 10)
      );

    // 엣지 그리기
    const links = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', (d) => calculateEdgeThickness(d.strength))
      .attr('stroke-opacity', 0.6);

    // 노드 그룹
    const nodes = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // 노드 원 (배경)
    nodes
      .append('circle')
      .attr('class', 'node-background')
      .attr('r', (d) => calculateNodeSize(d))
      .attr('fill', (d) => {
        const colorEmotion = mapNodeToColorEmotion(d);
        return colorEmotion.primary;
      })
      .attr('opacity', 0.3);

    // 노드 원 (온도 표현)
    nodes
      .append('circle')
      .attr('class', 'node-temperature')
      .attr('r', (d) => calculateNodeSize(d) * 0.85)
      .attr('fill', (d) => {
        const tempEmotion = mapDifficultyToTemperature(d.difficulty);
        return tempEmotion.color;
      })
      .attr('stroke', (d) => {
        const colorEmotion = mapNodeToColorEmotion(d);
        return colorEmotion.secondary;
      })
      .attr('stroke-width', 3);

    // 진행률 링 (Progress Ring)
    nodes
      .append('circle')
      .attr('class', 'node-progress')
      .attr('r', (d) => calculateNodeSize(d) * 0.95)
      .attr('fill', 'none')
      .attr('stroke', '#22C55E')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', (d) => {
        const radius = calculateNodeSize(d) * 0.95;
        const circumference = 2 * Math.PI * radius;
        const progress = d.progress / 100;
        return `${circumference * progress} ${circumference}`;
      })
      .attr('stroke-linecap', 'round')
      .attr('opacity', (d) => (d.progress > 0 ? 0.8 : 0));

    // 노드 라벨
    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => calculateNodeSize(d) + 20)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#1F2937')
      .style('pointer-events', 'none')
      .text((d) => d.label);

    // 난이도 라벨
    nodes
      .append('text')
      .attr('class', 'node-difficulty')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#FFFFFF')
      .style('pointer-events', 'none')
      .text((d) => {
        const tempEmotion = mapDifficultyToTemperature(d.difficulty);
        return tempEmotion.label;
      });

    // 노드 이벤트
    nodes
      .on('mouseenter', function (event, d) {
        setHoveredNode(d.id);
        d3.select(this).select('.node-temperature').attr('r', calculateNodeSize(d) * 1.1);
      })
      .on('mouseleave', function (event, d) {
        setHoveredNode(null);
        d3.select(this).select('.node-temperature').attr('r', calculateNodeSize(d) * 0.85);
      })
      .on('click', function (event, d) {
        setSelectedNode(d);
        onNodeClick?.(d.id);
      });

    // 리듬 애니메이션 (Pulse)
    nodes.each(function (d) {
      const rhythmEmotion = mapProgressToRhythm(d.progress, d.completed);
      if (rhythmEmotion.pulse) {
        const node = d3.select(this).select('.node-temperature');
        const duration = calculateAnimationDuration(rhythmEmotion.tempo) * 1000;

        function pulse() {
          node
            .transition()
            .duration(duration / 2)
            .attr('r', calculateNodeSize(d) * 0.95)
            .transition()
            .duration(duration / 2)
            .attr('r', calculateNodeSize(d) * 0.85)
            .on('end', pulse);
        }
        pulse();
      }
    });

    // Simulation 업데이트
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Drag 함수
    function dragStarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="graph-emotion-container relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-inner"
      />

      {/* 선택된 노드 정보 패널 */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">난이도:</span>
              <span className="font-semibold">
                {mapDifficultyToTemperature(selectedNode.difficulty).label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">진행률:</span>
              <span className="font-semibold">{selectedNode.progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">상태:</span>
              <span
                className={`font-semibold ${
                  selectedNode.completed ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {selectedNode.completed ? '완료' : '진행 중'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 범례 (Legend) */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 text-xs">
        <h4 className="font-bold mb-2">온도 (난이도)</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-400" />
            <span>매우 쉬움</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-400" />
            <span>쉬움</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400" />
            <span>보통</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-400" />
            <span>어려움</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-400" />
            <span>매우 어려움</span>
          </div>
        </div>
      </div>
    </div>
  );
};
