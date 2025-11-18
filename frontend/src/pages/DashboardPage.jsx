import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getAllModules } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const data = await getAllModules();
      setModules(data);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'generating':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'generating':
        return '생성중';
      case 'failed':
        return '실패';
      case 'pending':
        return '대기';
      case 'archived':
        return '보관됨';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>로딩중...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">교육 모듈 대시보드</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          새 모듈 생성
        </Button>
      </Box>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} md={6} lg={4} key={module.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {module.name}
                  </Typography>
                  <Chip
                    label={getStatusLabel(module.status)}
                    color={getStatusColor(module.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description || '설명 없음'}
                </Typography>
                <Typography variant="caption" display="block" gutterBottom>
                  과목: {module.subject}
                </Typography>
                <Typography variant="caption" display="block" gutterBottom>
                  학년: {module.grade_level}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  생성일: {new Date(module.created_at).toLocaleDateString('ko-KR')}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate(`/case-roadmap/${module.id}`)}
                >
                  Roadmap 보기
                </Button>
                <Button size="small" onClick={() => navigate(`/modules/${module.id}`)}>
                  상세 보기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {modules.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            생성된 모듈이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            새 교육 모듈을 생성하여 시작하세요
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            첫 모듈 생성하기
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPage;
