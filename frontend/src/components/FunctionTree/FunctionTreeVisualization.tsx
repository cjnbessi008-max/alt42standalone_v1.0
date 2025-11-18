import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { TreeNode } from '../../services/api';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface FunctionTreeVisualizationProps {
  tree: TreeNode;
  expression: string;
}

interface D3Node extends d3.HierarchyPointNode<TreeNode> {
  x: number;
  y: number;
}

const FunctionTreeVisualization: React.FC<FunctionTreeVisualizationProps> = ({
  tree,
  expression,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight - 100,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !tree) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 90, bottom: 40, left: 90 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>().size([innerWidth, innerHeight]);

    // Create hierarchy
    const root = d3.hierarchy(tree, (d) => d.children);

    // Generate tree
    const treeData = treeLayout(root);

    // Links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2)
      .attr(
        'd',
        d3
          .linkVertical<any, D3Node>()
          .x((d) => d.x)
          .y((d) => d.y)
      );

    // Nodes
    const nodes = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        setSelectedNode(d.data);
      });

    // Node circles
    nodes
      .append('circle')
      .attr('r', 30)
      .attr('fill', (d: any) => getNodeColor(d.data.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .on('mouseenter', function () {
        d3.select(this).transition().duration(200).attr('r', 35);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200).attr('r', 30);
      });

    // Node labels
    nodes
      .append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const value = d.data.value;
        if (value.length > 8) {
          return value.substring(0, 6) + '...';
        }
        return value;
      });

    // Type labels
    nodes
      .append('text')
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .attr('pointer-events', 'none')
      .text((d: any) => getTypeLabel(d.data.type));
  }, [tree, dimensions]);

  const getNodeColor = (type: string): string => {
    const colors: Record<string, string> = {
      operator: '#FF6B6B',
      function: '#4ECDC4',
      variable: '#45B7D1',
      constant: '#FFA07A',
      symbol: '#95E1D3',
    };
    return colors[type] || '#999';
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      operator: '연산자',
      function: '함수',
      variable: '변수',
      constant: '상수',
      symbol: '기호',
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: '#fff',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          함수 트리 시각화
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            수식:
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              fontFamily: 'monospace',
            }}
          >
            <InlineMath math={expression} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`노드: ${tree ? countNodes(tree) : 0}개`} size="small" />
          <Chip label={`깊이: ${tree ? tree.depth : 0}`} size="small" />
          <Chip
            label="연산자"
            size="small"
            sx={{ backgroundColor: getNodeColor('operator'), color: '#fff' }}
          />
          <Chip
            label="함수"
            size="small"
            sx={{ backgroundColor: getNodeColor('function'), color: '#fff' }}
          />
          <Chip
            label="변수"
            size="small"
            sx={{ backgroundColor: getNodeColor('variable'), color: '#fff' }}
          />
          <Chip
            label="상수"
            size="small"
            sx={{ backgroundColor: getNodeColor('constant'), color: '#fff' }}
          />
        </Box>
      </Paper>

      {/* SVG Tree */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 2,
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </Paper>

      {/* Selected Node Info */}
      {selectedNode && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mt: 2,
            backgroundColor: '#fff',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            선택된 노드 정보
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              값:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {selectedNode.value}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              타입:
            </Typography>
            <Chip
              label={getTypeLabel(selectedNode.type)}
              size="small"
              sx={{
                backgroundColor: getNodeColor(selectedNode.type),
                color: '#fff',
                width: 'fit-content',
              }}
            />

            <Typography variant="body2" color="text.secondary">
              설명:
            </Typography>
            <Typography variant="body2">{selectedNode.description}</Typography>

            {selectedNode.latex && (
              <>
                <Typography variant="body2" color="text.secondary">
                  LaTeX:
                </Typography>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                  }}
                >
                  <InlineMath math={selectedNode.latex} />
                </Box>
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              깊이:
            </Typography>
            <Typography variant="body2">{selectedNode.depth}</Typography>

            <Typography variant="body2" color="text.secondary">
              자식 노드:
            </Typography>
            <Typography variant="body2">{selectedNode.children.length}개</Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// Helper function to count nodes
const countNodes = (node: TreeNode): number => {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
};

export default FunctionTreeVisualization;
