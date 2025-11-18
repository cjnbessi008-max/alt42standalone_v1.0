import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { Problem, FunctionTree } from '../../services/api';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import { InlineMath } from 'react-katex';

interface MobilePreviewProps {
  tree: FunctionTree | null;
  problem: Problem | null;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ tree, problem }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: '100%', sm: '375px' },
        height: '100%',
        maxHeight: { xs: '500px', sm: '667px' },
      }}
    >
      {/* Smartphone Frame */}
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '36px',
          border: '12px solid #333',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Notch (iPhone-style) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '30px',
            backgroundColor: '#000',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            zIndex: 10,
          }}
        />

        {/* Screen Content */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: '#fff',
            overflow: 'auto',
            pt: 5,
          }}
        >
          {/* Mobile App Header */}
          <Box
            sx={{
              backgroundColor: '#1976d2',
              color: '#fff',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SmartphoneIcon />
            <Typography variant="h6" fontWeight="bold">
              Function Tree
            </Typography>
          </Box>

          {/* Mobile Content */}
          <Box sx={{ p: 2 }}>
            {problem && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {problem.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {problem.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={`난이도 ${problem.difficulty_level}`}
                    size="small"
                    color="primary"
                  />
                  <Chip label={problem.category} size="small" variant="outlined" />
                </Box>
              </Box>
            )}

            {tree && (
              <Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    수식
                  </Typography>
                  <Box
                    sx={{
                      fontSize: '18px',
                      fontFamily: 'monospace',
                      mb: 1,
                    }}
                  >
                    <InlineMath math={tree.expression} />
                  </Box>
                </Paper>

                {/* Tree Statistics */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    트리 정보
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        총 노드 수
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {tree.nodeCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        최대 깊이
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {tree.maxDepth}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Variables */}
                {tree.variables.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      변수
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {tree.variables.map((variable, index) => (
                        <Chip
                          key={index}
                          label={variable}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Paper>
                )}

                {/* Tree Structure (simplified mobile view) */}
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    트리 구조 (단순화)
                  </Typography>
                  <Box
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      backgroundColor: '#f9f9f9',
                      p: 1,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: '200px',
                    }}
                  >
                    {renderTreeText(tree.root, 0)}
                  </Box>
                </Paper>
              </Box>
            )}

            {!tree && !problem && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  문제를 선택하거나 수식을 입력하세요
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Home Indicator (iPhone-style) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '134px',
            height: '5px',
            backgroundColor: '#000',
            borderRadius: '100px',
            opacity: 0.3,
          }}
        />
      </Paper>

      {/* Label */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SmartphoneIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          모바일 미리보기
        </Typography>
      </Box>
    </Box>
  );
};

// Helper function to render tree structure as text
const renderTreeText = (node: any, depth: number): JSX.Element[] => {
  const indent = '  '.repeat(depth);
  const elements: JSX.Element[] = [];

  elements.push(
    <div key={`${node.id}-${depth}`}>
      {indent}
      {depth > 0 && '└─ '}
      <strong>{node.value}</strong> ({node.type})
    </div>
  );

  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any) => {
      elements.push(...renderTreeText(child, depth + 1));
    });
  }

  return elements;
};

export default MobilePreview;
