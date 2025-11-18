import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                학생 분석
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                개별 학생의 확신 오답 패턴을 분석합니다.
              </Typography>
              <Button component={Link} to="/student/demo-user-id" variant="contained">
                학생 분석 보기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                학급 분석
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                학급 전체의 확신 오답 통계를 확인합니다.
              </Typography>
              <Button component={Link} to="/class/demo-course-id" variant="contained">
                학급 분석 보기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시스템 안내
              </Typography>
              <Typography variant="body2" paragraph>
                이 시스템은 Moodle LMS와 연동하여 학생들이 스스로 확신했던 문제 중 틀린 문제를 분석합니다.
              </Typography>
              <Typography variant="body2">
                • 확신도 척도: 1-5점 (1=전혀 확신 없음, 5=매우 확신함)
                <br />
                • 확신 오답: 확신도 ≥ 4점이지만 틀린 문제
                <br />
                • 메타인지 분석: 자기 이해도와 실제 이해도의 차이 파악
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
