/**
 * 학생 대시보드 페이지
 */
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import RoutineCardView from '../components/RoutineCardView';
import { cardApi } from '../services/api';
import type { RoutineCard } from '../types';

interface StudentDashboardProps {
  studentId: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  const [card, setCard] = useState<RoutineCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodayCard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await cardApi.getToday(studentId);
      setCard(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '카드를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!card) return;

    try {
      const updatedCard = await cardApi.complete(card.id);
      setCard(updatedCard);
    } catch (err: any) {
      setError(err.response?.data?.detail || '완료 처리에 실패했습니다');
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await cardApi.generate({
        student_id: studentId,
        force_regenerate: true,
      });
      setCard(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '카드 재생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayCard();
  }, [studentId]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          오늘의 성공 루틴 카드를 준비하고 있어요...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadTodayCard}>
          다시 시도
        </Button>
      </Container>
    );
  }

  if (!card) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="info">
          오늘의 카드가 없습니다
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h3" component="h1">
          ✨ 오늘의 성공 루틴
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRegenerate}
        >
          새로 만들기
        </Button>
      </Box>

      <RoutineCardView card={card} onComplete={handleComplete} />
    </Container>
  );
};

export default StudentDashboard;
