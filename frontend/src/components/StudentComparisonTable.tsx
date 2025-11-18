import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { StudentScore } from '../types';

interface StudentComparisonTableProps {
  scores: StudentScore[];
}

export const StudentComparisonTable: React.FC<StudentComparisonTableProps> = ({ scores }) => {
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRank = (index: number): string => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}위`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        전체 학생 꾸준함 점수 비교
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>순위</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>학번</TableCell>
              <TableCell align="center">총점</TableCell>
              <TableCell align="center">출석</TableCell>
              <TableCell align="center">활동</TableCell>
              <TableCell align="center">과제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map((score, index) => (
              <TableRow
                key={score.id}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                  backgroundColor: index < 3 ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {getRank(index)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {score.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {score.student_id}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={score.total_score.toFixed(1)}
                    color={getScoreColor(score.total_score)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{score.attendance_score.toFixed(1)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{score.activity_score.toFixed(1)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{score.submission_score.toFixed(1)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
