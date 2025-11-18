import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { reportsApi } from '../services/api';
import type { DailyReport } from '../types';

export default function ReportsList() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getReports({ limit: 30 });
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      await reportsApi.generateReport();
      await loadReports();
      alert('리포트가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('리포트 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">일일 리포트</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleGenerateReport}
          disabled={generating}
        >
          {generating ? '생성 중...' : '리포트 생성'}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>날짜</TableCell>
              <TableCell align="right">사고 수</TableCell>
              <TableCell align="right">전체 학생</TableCell>
              <TableCell align="right">활성 학생</TableCell>
              <TableCell align="right">활동 수</TableCell>
              <TableCell align="right">오류 수</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  리포트가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    {format(new Date(report.report_date), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={report.incidents_count} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="right">{report.total_students}</TableCell>
                  <TableCell align="right">{report.active_students}</TableCell>
                  <TableCell align="right">{report.total_activities}</TableCell>
                  <TableCell align="right">
                    {report.error_count > 0 ? (
                      <Chip label={report.error_count} color="error" size="small" />
                    ) : (
                      <Chip label="0" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      component={Link}
                      to={`/reports/${report.id}`}
                      size="small"
                      startIcon={<ViewIcon />}
                    >
                      보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
