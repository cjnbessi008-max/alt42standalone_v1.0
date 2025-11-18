import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip, Grid, Button } from '@mui/material';
import TriangleVisualization from './TriangleVisualization';
import { useTriangleStore } from '../store/triangleStore';
import axios from 'axios';

interface TriangleMirrorProps {
  problemData: any;
}

const TriangleMirror: React.FC<TriangleMirrorProps> = ({ problemData }) => {
  const { triangles, selectedTriangle, highlightedGroups, setSimilarityGroups } = useTriangleStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (problemData?.id) {
      analyzeTriangles();
    }
  }, [problemData]);

  const analyzeTriangles = async () => {
    if (!problemData) return;

    setAnalyzing(true);

    try {
      const response = await axios.post('/api/triangles/detect', {
        problemId: problemData.id,
        geometryData: problemData.problemData
      });

      if (response.data.success) {
        setAnalysisResult(response.data.data);

        // Build similarity groups map
        const groupsMap = new Map();
        response.data.data.similarityGroups.forEach((indices: number[], groupId: number) => {
          groupsMap.set(groupId, indices.map((i: number) => triangles[i]));
        });

        setSimilarityGroups(groupsMap);
      }
    } catch (error) {
      console.error('Error analyzing triangles:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Triangle Mirror
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        유사한 삼각형 구조를 자동으로 감지하고 강조합니다
      </Typography>

      <Box sx={{ mt: 3 }}>
        {problemData && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {problemData.title}
            </Typography>

            {problemData.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {problemData.description}
              </Typography>
            )}

            {/* Main Visualization */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <TriangleVisualization
                problemData={problemData}
                width={500}
                height={400}
                interactive={true}
              />
            </Box>
          </Paper>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              분석 결과
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {analysisResult.totalTriangles}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    전체 삼각형
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {analysisResult.totalGroups}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    유사 그룹 수
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {analysisResult.similarityGroups.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  유사 삼각형 그룹:
                </Typography>

                {analysisResult.similarityGroups.map((indices: number[], groupId: number) => (
                  <Box key={groupId} sx={{ mb: 1 }}>
                    <Chip
                      label={`그룹 ${groupId + 1}: ${indices.length}개 삼각형`}
                      sx={{
                        bgcolor: colors[groupId % colors.length],
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                      onClick={() => {
                        // Highlight this group
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {selectedTriangle && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f0f0', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  선택된 삼각형: <strong>{selectedTriangle.label}</strong>
                </Typography>

                {selectedTriangle.sides && (
                  <Typography variant="body2">
                    변의 길이: {selectedTriangle.sides.map(s => s.toFixed(1)).join(', ')}
                  </Typography>
                )}

                {selectedTriangle.angles && (
                  <Typography variant="body2">
                    각도: {selectedTriangle.angles.map(a => `${a.toFixed(1)}°`).join(', ')}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}

        {!problemData && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Moodle LMS에서 문제를 불러오는 중...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TriangleMirror;
