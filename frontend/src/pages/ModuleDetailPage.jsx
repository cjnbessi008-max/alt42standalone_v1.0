import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getModuleById } from '../services/api';

const ModuleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModule();
  }, [id]);

  const fetchModule = async () => {
    try {
      const data = await getModuleById(id);
      setModule(data);
    } catch (error) {
      console.error('Failed to fetch module:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>로딩중...</Typography>
      </Paper>
    );
  }

  if (!module) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>모듈을 찾을 수 없습니다</Typography>
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
          돌아가기
        </Button>
        <Typography variant="h4">{module.name}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              모듈 정보
            </Typography>
            <Typography variant="body1" paragraph>
              {module.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              과목: {module.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              학년: {module.grade_level}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              교사 요청
            </Typography>
            <Typography variant="body1">{module.teacher_request}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                액션
              </Typography>
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate(`/case-roadmap/${module.id}`)}
              >
                Roadmap 보기
              </Button>
              <Button variant="outlined" fullWidth>
                모듈 편집
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModuleDetailPage;
