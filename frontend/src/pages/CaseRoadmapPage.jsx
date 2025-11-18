import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CaseRoadmapVisualization from '../components/CaseRoadmapVisualization';
import MobilePhoneView from '../components/MobilePhoneView';
import MobileRoadmapPreview from '../components/MobileRoadmapPreview';
import { getCaseRoadmap, getPipelineProgress } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const CaseRoadmapPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socket = useSocket();

  const fetchRoadmapData = async () => {
    try {
      setLoading(true);
      const [roadmap, progress] = await Promise.all([
        getCaseRoadmap(moduleId),
        getPipelineProgress(moduleId)
      ]);
      setRoadmapData(roadmap);
      setProgressData(progress);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapData();
  }, [moduleId]);

  // Listen to real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleStageCompleted = (data) => {
      if (data.moduleId === moduleId) {
        fetchRoadmapData();
      }
    };

    socket.on('pipeline:stage-completed', handleStageCompleted);

    return () => {
      socket.off('pipeline:stage-completed', handleStageCompleted);
    };
  }, [socket, moduleId]);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>로딩중...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">오류: {error}</Typography>
        <Button onClick={fetchRoadmapData} sx={{ mt: 2 }}>
          다시 시도
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          대시보드로 돌아가기
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Case Roadmap: {roadmapData?.moduleName}
        </Typography>
        <Chip
          label={roadmapData?.overallStatus}
          color={
            roadmapData?.overallStatus === 'active'
              ? 'success'
              : roadmapData?.overallStatus === 'generating'
              ? 'primary'
              : 'default'
          }
        />
      </Box>

      <Grid container spacing={3}>
        {/* Progress Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                전체 진행 상황
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressData?.progress_percentage || 0}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="h6" color="primary">
                  {progressData?.progress_percentage || 0}%
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">
                    완료
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {progressData?.completed_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">
                    진행중
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {progressData?.in_progress_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">
                    대기
                  </Typography>
                  <Typography variant="h6">
                    {progressData?.pending_count || 0}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">
                    실패
                  </Typography>
                  <Typography variant="h6" color="error">
                    {progressData?.failed_count || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Roadmap Visualization */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              파이프라인 흐름도
            </Typography>
            <CaseRoadmapVisualization roadmapData={roadmapData} />
          </Paper>
        </Grid>

        {/* Stage Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              단계별 상세 정보
            </Typography>
            <Grid container spacing={2}>
              {roadmapData?.stages.map((stage, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{stage.displayName}</Typography>
                        <Chip
                          label={
                            stage.status === 'completed'
                              ? '완료'
                              : stage.status === 'in_progress'
                              ? '진행중'
                              : stage.status === 'failed'
                              ? '실패'
                              : '대기'
                          }
                          color={
                            stage.status === 'completed'
                              ? 'success'
                              : stage.status === 'in_progress'
                              ? 'primary'
                              : stage.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {stage.startedAt
                          ? `시작: ${new Date(stage.startedAt).toLocaleString('ko-KR')}`
                          : '아직 시작하지 않음'}
                      </Typography>
                      {stage.completedAt && (
                        <Typography variant="body2" color="textSecondary">
                          완료: {new Date(stage.completedAt).toLocaleString('ko-KR')}
                        </Typography>
                      )}
                      {stage.durationSeconds && (
                        <Typography variant="body2" color="primary">
                          소요 시간: {Math.round(stage.durationSeconds)}초
                        </Typography>
                      )}
                      {stage.errorLog && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          오류: {stage.errorLog}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Mobile Phone View (Fixed bottom-right) */}
      <MobilePhoneView title={roadmapData?.moduleName}>
        <MobileRoadmapPreview roadmapData={roadmapData} progressData={progressData} />
      </MobilePhoneView>
    </Box>
  );
};

export default CaseRoadmapPage;
