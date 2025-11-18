import { useParams } from 'react-router-dom';
import { Typography, Card, CardContent, Grid, Alert } from '@mui/material';

export default function StudentAnalysis() {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        학생 분석
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        학생 ID: {userId}
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                확신 오답 개수
              </Typography>
              <Typography variant="h3" color="error">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                전체 시도 중 확신했지만 틀린 문제
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                취약 개념 수
              </Typography>
              <Typography variant="h3" color="warning.main">
                5
              </Typography>
              <Typography variant="body2" color="text.secondary">
                반복적으로 확신 오답이 나온 개념
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                확신 오답 목록
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API 연동 후 실제 데이터가 표시됩니다.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
