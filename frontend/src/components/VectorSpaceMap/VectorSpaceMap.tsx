import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { VectorSpaceMapProps, Concept } from '@types/index';
import { useVectorData } from './hooks/useVectorData';
import { useLearningPath } from './hooks/useLearningPath';
import { useInteraction } from './hooks/useInteraction';
import { ForceSimulation, SimulationNode, SimulationLink } from './utils/forceSimulation';
import { getConceptColor, getColorWithOpacity } from './utils/colorMapping';
import ConceptPanel from './components/ConceptPanel';
import Legend from './components/Legend';
import './VectorSpaceMap.css';

/**
 * Vector Space Map 메인 컴포넌트
 */
const VectorSpaceMap: React.FC<VectorSpaceMapProps> = ({
  moduleId,
  interactiveMode = 'explore',
  dimension = '2d',
  colorScheme = 'by-category',
  onConceptSelect,
  studentId,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [simulation, setSimulation] = useState<ForceSimulation | null>(null);

  // 데이터 로드
  const { data, loading, error, refresh } = useVectorData(moduleId);
  const { learningPath } = useLearningPath(studentId, moduleId);
  const {
    selectedConcept,
    hoveredConcept,
    handleNodeClick,
    handleNodeHover,
    clearSelection,
  } = useInteraction();

  // 컨테이너 크기 측정
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Force Simulation 초기화
  useEffect(() => {
    const sim = new ForceSimulation(dimensions.width, dimensions.height);
    setSimulation(sim);

    return () => sim.destroy();
  }, [dimensions]);

  // 시각화 렌더링
  useEffect(() => {
    if (!data || !simulation || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 데이터 업데이트
    const { nodes, links } = simulation.updateData(data.concepts, data.relationships);

    // SVG 그룹 생성
    const g = svg.append('g').attr('class', 'vector-space');

    // 줌 & 팬 설정
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 링크 그리기
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => d.relationship.weight * 2);

    // 노드 그룹 생성
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node');

    // 노드 원 그리기
    nodeElements
      .append('circle')
      .attr('r', (d) => 8 + d.concept.difficulty * 2)
      .attr('fill', (d) => {
        const masteryScore = learningPath?.visitedConcepts.find(
          v => v.conceptId === d.concept.id
        )?.masteryScore;
        return getConceptColor(colorScheme, d.concept.category, d.concept.difficulty, masteryScore);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d.concept);
        onConceptSelect?.(d.concept);
      })
      .on('mouseenter', (event, d) => {
        handleNodeHover(d.concept);
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('r', (data: SimulationNode) => 12 + data.concept.difficulty * 2);
      })
      .on('mouseleave', (event) => {
        handleNodeHover(null);
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('r', (d: SimulationNode) => 8 + d.concept.difficulty * 2);
      });

    // 노드 라벨
    nodeElements
      .append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .text((d) => d.concept.name)
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // 학습 경로 표시
    if (learningPath && learningPath.visitedConcepts.length > 0) {
      const visitedIds = learningPath.visitedConcepts.map(v => v.conceptId);

      nodeElements
        .filter((d: SimulationNode) => visitedIds.includes(d.concept.id))
        .append('circle')
        .attr('r', (d: SimulationNode) => 14 + d.concept.difficulty * 2)
        .attr('fill', 'none')
        .attr('stroke', '#27AE60')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5')
        .style('pointer-events', 'none');
    }

    // 드래그 적용
    const drag = simulation.getDragBehavior();
    nodeElements.call(drag as any);

    // Tick 업데이트
    simulation.onTick((updatedNodes, updatedLinks) => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr('transform', (d: SimulationNode) => `translate(${d.x},${d.y})`);
    });

    simulation.start();

    // SVG 클릭 시 선택 해제
    svg.on('click', () => clearSelection());

  }, [data, simulation, colorScheme, learningPath, handleNodeClick, handleNodeHover, clearSelection, onConceptSelect]);

  if (loading) {
    return (
      <div className={`vector-space-map ${className}`}>
        <div className="loading">Loading Vector Space Map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`vector-space-map ${className}`}>
        <div className="error">
          <p>Failed to load Vector Space Map</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`vector-space-map ${className}`} ref={containerRef}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="vector-space-svg"
      />

      {/* 범례 */}
      <Legend colorScheme={colorScheme} />

      {/* 개념 상세 패널 */}
      {selectedConcept && (
        <ConceptPanel
          concept={selectedConcept}
          onClose={clearSelection}
        />
      )}

      {/* 컨트롤 */}
      <div className="controls">
        <button onClick={refresh} title="Refresh">🔄</button>
        {data && (
          <span className="concept-count">
            {data.concepts.length} concepts
          </span>
        )}
      </div>
    </div>
  );
};

export default VectorSpaceMap;
