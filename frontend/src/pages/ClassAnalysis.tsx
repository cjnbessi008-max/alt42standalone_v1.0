import { useParams } from 'react-router-dom';
import { Typography, Card, CardContent, Alert } from '@mui/material';

export default function ClassAnalysis() {
  const { courseId } = useParams<{ courseId: string }>();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        학급 분석
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        코스 ID: {courseId}
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            학급 전체 확신 오답 통계
          </Typography>
          <Typography variant="body2" color="text.secondary">
            API 연동 후 학급 전체 데이터가 표시됩니다.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
