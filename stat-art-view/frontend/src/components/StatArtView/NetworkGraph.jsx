import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import './StatArtView.css';

const NetworkGraph = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 400;

    svg.attr('width', width).attr('height', height);

    // 간단한 링크 생성 (인접한 노드들끼리 연결)
    const links = [];
    data.nodes.forEach((node, i) => {
      if (i < data.nodes.length - 1) {
        links.push({
          source: node.id,
          target: data.nodes[i + 1].id,
          value: Math.abs(node.value - data.nodes[i + 1].value)
        });
      }
      // 일부 노드는 건너뛰어 연결
      if (i < data.nodes.length - 2 && Math.random() > 0.5) {
        links.push({
          source: node.id,
          target: data.nodes[i + 2].id,
          value: Math.abs(node.value - data.nodes[i + 2].value)
        });
      }
    });

    // D3 Force Simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // 링크 그리기
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', d => Math.max(1, 5 - d.value / 20))
      .attr('stroke-opacity', 0.6);

    // 노드 그룹
    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .call(drag(simulation));

    // 노드 원
    node.append('circle')
      .attr('r', d => 10 + (d.value / 10))
      .attr('fill', d => getNodeColor(d.value))
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10 + (d.value / 10) + 5);

        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.name || `문제 ${d.id}`}</strong><br/>
            정답률: ${d.value.toFixed(1)}%<br/>
            유형: ${d.type || 'N/A'}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10 + (d.value / 10));

        tooltip.style('opacity', 0);
      });

    // 노드 레이블
    node.append('text')
      .text((d, i) => i + 1)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // 툴팁
    const tooltip = d3.select('body').append('div')
      .attr('class', 'network-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('font-size', '14px')
      .style('z-index', 1000);

    // Simulation 업데이트
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag 함수
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // 클린업
    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [data]);

  const getNodeColor = (value) => {
    if (value >= 80) return '#10b981';  // 초록
    if (value >= 50) return '#f59e0b';  // 노랑
    return '#ef4444';                   // 빨강
  };

  return (
    <motion.div
      className="network-graph-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <svg ref={svgRef}></svg>
      <div className="network-info">
        <p>🔵 노드 크기: 정답률이 높을수록 큼</p>
        <p>🔗 연결선 두께: 문제 간 정답률 차이가 작을수록 두꺼움</p>
        <p>🎨 색상: 초록(쉬움) / 노랑(보통) / 빨강(어려움)</p>
      </div>
    </motion.div>
  );
};

export default NetworkGraph;
