import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  CircularProgress,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import type { BubbleNode, BubbleLink, VisualizationData } from '../types/keyword';
import { getCategoryColor } from '../utils/colorUtils';

interface KeywordBubbleVisualizationProps {
  data: VisualizationData;
  width?: number;
  height?: number;
  onNodeClick?: (node: BubbleNode) => void;
}

export const KeywordBubbleVisualization: React.FC<KeywordBubbleVisualizationProps> = ({
  data,
  width = 1200,
  height = 800,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [minImportance, setMinImportance] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<BubbleNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Filter data based on search and filters
    const filteredNodes = data.nodes.filter(node => {
      const matchesSearch = searchTerm === '' ||
        node.keyword.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' ||
        node.keywordType === filterCategory;
      const matchesImportance = node.importanceScore >= minImportance;
      return matchesSearch && matchesCategory && matchesImportance;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(link =>
      filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<BubbleNode>().radius(d => d.radius + 5))
      .force('link', d3.forceLink(filteredLinks)
        .id((d: any) => d.id)
        .distance(100)
        .strength(d => (d as BubbleLink).strength)
      );

    // Draw links
    const link = container.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => d.strength * 3);

    // Draw nodes
    const node = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .call(d3.drag<SVGGElement, BubbleNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any
      );

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => getCategoryColor(d.keywordType))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('r', d.radius * 1.1);
        setHoveredNode(d);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('r', d.radius);
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });

    // Add labels to nodes
    node.append('text')
      .text(d => d.keyword)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', d => Math.max(10, d.radius / 2))
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragStarted(event: any, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: BubbleNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: any, d: BubbleNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height, searchTerm, filterCategory, minImportance, onNodeClick]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call((d3.zoom<SVGSVGElement, unknown>() as any).scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call((d3.zoom<SVGSVGElement, unknown>() as any).scaleBy, 0.7);
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom<SVGSVGElement, unknown>() as any).transform,
      d3.zoomIdentity
    );
    setZoomLevel(1);
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
          키워드 버블 시각화
        </Typography>

        <TextField
          size="small"
          label="키워드 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 200 }}
        />

        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={filterCategory}
            label="카테고리"
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="concept">개념</MenuItem>
            <MenuItem value="operation">연산</MenuItem>
            <MenuItem value="entity">개체</MenuItem>
            <MenuItem value="attribute">속성</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ width: 200 }}>
          <Typography variant="caption" gutterBottom>
            중요도 필터: {minImportance.toFixed(2)}
          </Typography>
          <Slider
            value={minImportance}
            onChange={(_, value) => setMinImportance(value as number)}
            min={0}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>

        <IconButton onClick={handleZoomIn} title="확대">
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleZoomOut} title="축소">
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={handleReset} title="초기화">
          <RestartAltIcon />
        </IconButton>
      </Box>

      <Box sx={{ position: 'relative', border: '1px solid #ddd', borderRadius: 1 }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ display: 'block', backgroundColor: '#f5f5f5' }}
        />

        {hoveredNode && (
          <Paper
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              p: 2,
              maxWidth: 300,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {hoveredNode.keyword}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              타입: {hoveredNode.keywordType}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              중요도: {hoveredNode.importanceScore.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              빈도: {hoveredNode.frequency}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              카테고리: {hoveredNode.category}
            </Typography>
          </Paper>
        )}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          줌 레벨: {zoomLevel.toFixed(2)}x
        </Typography>
        <Typography variant="body2" color="text.secondary">
          노드 수: {data.nodes.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          연결 수: {data.links.length}
        </Typography>
      </Box>
    </Paper>
  );
};
