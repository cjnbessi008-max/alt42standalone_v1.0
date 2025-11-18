import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { reportsApi } from '../services/api';
import type { DailyReport } from '../types';

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      loadReport(parseInt(reportId));
    }
  }, [reportId]);

  const loadReport = async (id: number) => {
    try {
      setLoading(true);
      const data = await reportsApi.getReport(id);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box>
        <Typography>리포트를 찾을 수 없습니다.</Typography>
        <Button onClick={() => navigate('/reports')}>목록으로 돌아가기</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/reports')}
        sx={{ mb: 2 }}
      >
        목록으로
      </Button>

      <Typography variant="h4" gutterBottom>
        일일 리포트 상세
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          기본 정보
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography>
              <strong>날짜:</strong> {format(new Date(report.report_date), 'yyyy-MM-dd')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography>
              <strong>생성 시각:</strong>{' '}
              {format(new Date(report.generated_at), 'yyyy-MM-dd HH:mm:ss')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                전체 사고 수
              </Typography>
              <Typography variant="h4">{report.incidents_count}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                전체 학생
              </Typography>
              <Typography variant="h4">{report.total_students}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                활성 학생
              </Typography>
              <Typography variant="h4">{report.active_students}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                오류 수
              </Typography>
              <Typography variant="h4" color="error">
                {report.error_count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 타입별 통계 */}
      {report.summary?.by_type && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            사고 유형별 통계
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>유형</TableCell>
                  <TableCell align="right">건수</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(report.summary.by_type).map(([type, count]) => (
                  <TableRow key={type}>
                    <TableCell>{type}</TableCell>
                    <TableCell align="right">{count as number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 심각도별 통계 */}
      {report.summary?.by_severity && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            심각도별 통계
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>심각도</TableCell>
                  <TableCell align="right">건수</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(report.summary.by_severity).map(([severity, count]) => (
                  <TableRow key={severity}>
                    <TableCell>{severity}</TableCell>
                    <TableCell align="right">{count as number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 상위 활동 학생 */}
      {report.details?.top_students && report.details.top_students.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            최다 활동 학생
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>학생 ID</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell align="right">활동 수</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.details.top_students.map((student: any) => (
                  <TableRow key={student.student_id}>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>{student.name || 'N/A'}</TableCell>
                    <TableCell>{student.email || 'N/A'}</TableCell>
                    <TableCell align="right">{student.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
