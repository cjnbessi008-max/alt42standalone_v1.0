import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleStartSession = async () => {
    // In a real app, this would create a session via API
    // For demo, we'll use a mock session ID
    const mockSessionId = 'demo-session-' + Date.now();
    navigate(`/learning/${mockSessionId}`);
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        메타인지 미러링 시스템
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        AI가 당신의 문제 풀이 과정을 실시간으로 분석하고 요약해드립니다
      </Typography>

      <Card sx={{ mt: 4, maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            새로운 학습 세션 시작하기
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            문제를 풀면서 당신이 어떤 사고 과정을 거치는지 실시간으로 확인해보세요.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartSession}
            fullWidth
            sx={{ mt: 2 }}
          >
            학습 시작
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          주요 기능
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">🧠 실시간 사고 분석</Typography>
              <Typography variant="body2">
                Claude AI가 당신의 행동을 분석하여 지금 무엇을 생각하고 있는지 알려줍니다
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">📊 학습 과정 시각화</Typography>
              <Typography variant="body2">
                문제 풀이의 각 단계를 시각적으로 확인하고 시간 관리를 개선하세요
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">🎯 전략 식별</Typography>
              <Typography variant="body2">
                사용한 문제 해결 전략을 자동으로 식별하여 메타인지 능력을 향상시킵니다
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
