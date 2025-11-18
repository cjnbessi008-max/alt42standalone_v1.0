import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Paper, Typography, Slider, IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface PartialSumDataPoint {
  index: number;
  value: number;
  partialSum: number;
}

interface PartialSumFlowCurveProps {
  data: number[];
  title?: string;
  width?: number;
  height?: number;
  animationSpeed?: number;
  showControls?: boolean;
  curveType?: 'smooth' | 'linear' | 'step';
}

/**
 * Partial Sum Flow Curve Component
 *
 * Visualizes partial sums as smooth flowing curves using D3.js and Bézier interpolation.
 * Designed for mobile-responsive display in virtual smartphone interface.
 *
 * @component
 * @example
 * ```tsx
 * <PartialSumFlowCurve
 *   data={[1, 2, 3, 4, 5]}
 *   title="부분합 시각화"
 *   curveType="smooth"
 * />
 * ```
 */
export const PartialSumFlowCurve: React.FC<PartialSumFlowCurveProps> = ({
  data,
  title = '부분합 흐름 곡선 (Partial Sum Flow)',
  width = 350,
  height = 400,
  animationSpeed = 2000,
  showControls = true,
  curveType = 'smooth'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(animationSpeed);

  // Calculate partial sums
  const partialSumData: PartialSumDataPoint[] = React.useMemo(() => {
    let sum = 0;
    return data.map((value, index) => {
      sum += value;
      return {
        index,
        value,
        partialSum: sum
      };
    });
  }, [data]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const maxSum = Math.max(...partialSumData.map(d => d.partialSum));
    const minSum = Math.min(...partialSumData.map(d => d.partialSum), 0);

    const yScale = d3.scaleLinear()
      .domain([minSum, maxSum])
      .range([innerHeight, 0])
      .nice();

    // Add gradient for flow effect
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'flow-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', yScale(maxSum))
      .attr('x2', 0)
      .attr('y2', yScale(minSum));

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#667eea')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#764ba2')
      .attr('stop-opacity', 0.8);

    // Area gradient for fill
    const areaGradient = svg.select('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', yScale(maxSum))
      .attr('x2', 0)
      .attr('y2', yScale(minSum));

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#667eea')
      .attr('stop-opacity', 0.3);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#764ba2')
      .attr('stop-opacity', 0.1);

    // Define curve generator based on curve type
    let curveGenerator: d3.CurveFactory;
    switch (curveType) {
      case 'linear':
        curveGenerator = d3.curveLinear;
        break;
      case 'step':
        curveGenerator = d3.curveStep;
        break;
      case 'smooth':
      default:
        curveGenerator = d3.curveCatmullRom.alpha(0.5); // Smooth Bézier-like curves
    }

    // Line generator with smooth curves
    const line = d3.line<PartialSumDataPoint>()
      .x(d => xScale(d.index))
      .y(d => yScale(d.partialSum))
      .curve(curveGenerator);

    // Area generator for fill
    const area = d3.area<PartialSumDataPoint>()
      .x(d => xScale(d.index))
      .y0(innerHeight)
      .y1(d => yScale(d.partialSum))
      .curve(curveGenerator);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      );

    // Add X axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(data.length))
      .selectAll('text')
      .style('font-size', '12px');

    // Add Y axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px');

    // Add axis labels
    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('인덱스 (Index)');

    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('부분합 (Partial Sum)');

    // Add area (filled region under curve)
    const areaPath = g.append('path')
      .datum(partialSumData.slice(0, currentIndex + 1))
      .attr('class', 'area')
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Add the flow curve line
    const path = g.append('path')
      .datum(partialSumData.slice(0, currentIndex + 1))
      .attr('class', 'flow-line')
      .attr('fill', 'none')
      .attr('stroke', 'url(#flow-gradient)')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Add data points
    const points = g.selectAll('.data-point')
      .data(partialSumData.slice(0, currentIndex + 1))
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.index))
      .attr('cy', d => yScale(d.partialSum))
      .attr('r', 0)
      .attr('fill', '#667eea')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Animate points appearing
    points.transition()
      .duration(300)
      .attr('r', 5);

    // Add value labels
    const labels = g.selectAll('.value-label')
      .data(partialSumData.slice(0, currentIndex + 1))
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.index))
      .attr('y', d => yScale(d.partialSum) - 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#667eea')
      .style('opacity', 0)
      .text(d => d.partialSum);

    // Fade in labels
    labels.transition()
      .duration(300)
      .style('opacity', 1);

    // Animate line drawing
    if (currentIndex > 0) {
      const pathLength = (path.node() as SVGPathElement).getTotalLength();

      path
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(500)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    }

  }, [data, partialSumData, currentIndex, width, height, curveType]);

  // Animation control
  useEffect(() => {
    if (!isPlaying || currentIndex >= data.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, data.length - 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, data.length, speed]);

  const handlePlayPause = () => {
    if (currentIndex >= data.length - 1 && !isPlaying) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (_: Event, value: number | number[]) => {
    setSpeed(3000 - (value as number)); // Inverse for intuitive slider
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        maxWidth: width + 40,
        margin: '0 auto'
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#333'
        }}
      >
        {title}
      </Typography>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 2,
        background: 'white',
        borderRadius: 2,
        p: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <svg ref={svgRef} style={{ display: 'block' }} />
      </Box>

      {showControls && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Tooltip title={isPlaying ? "일시정지" : "재생"}>
              <IconButton
                onClick={handlePlayPause}
                color="primary"
                sx={{
                  bgcolor: 'white',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="처음부터">
              <IconButton
                onClick={handleReset}
                color="secondary"
                sx={{
                  bgcolor: 'white',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ px: 2 }}>
            <Typography variant="caption" gutterBottom sx={{ color: '#666' }}>
              애니메이션 속도
            </Typography>
            <Slider
              value={3000 - speed}
              onChange={handleSpeedChange}
              min={500}
              max={2500}
              step={100}
              marks={[
                { value: 500, label: '느림' },
                { value: 1500, label: '보통' },
                { value: 2500, label: '빠름' }
              ]}
              sx={{ color: '#667eea' }}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mt: 2,
              color: '#666',
              fontWeight: 'bold'
            }}
          >
            진행: {currentIndex + 1} / {data.length}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PartialSumFlowCurve;
