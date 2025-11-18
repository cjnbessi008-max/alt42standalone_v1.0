/**
 * Teacher Dashboard - Shows classroom overview of all students
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import { DMNStatusBadge } from '../components/dmn/DMNStatusBadge';
import { DMNStatus } from '../types/dmn.types';

// Mock data for demonstration
const mockStudents = [
  { id: '1', name: '김철수', status: DMNStatus.DEEP_FOCUS, confidence: 0.89 },
  { id: '2', name: '이영희', status: DMNStatus.ACTIVE_LEARNING, confidence: 0.76 },
  { id: '3', name: '박민수', status: DMNStatus.WANDERING, confidence: 0.65 },
  { id: '4', name: '정수진', status: DMNStatus.DEEP_FOCUS, confidence: 0.92 },
  { id: '5', name: '최지훈', status: DMNStatus.ACTIVE_LEARNING, confidence: 0.81 },
  { id: '6', name: '강민지', status: DMNStatus.DISENGAGED, confidence: 0.54 },
  { id: '7', name: '윤서연', status: DMNStatus.DEEP_FOCUS, confidence: 0.87 },
  { id: '8', name: '임동현', status: DMNStatus.WANDERING, confidence: 0.71 },
];

const TeacherDashboard: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  // Calculate statistics
  const statusCounts = mockStudents.reduce((acc, student) => {
    acc[student.status] = (acc[student.status] || 0) + 1;
    return acc;
  }, {} as Record<DMNStatus, number>);

  const totalStudents = mockStudents.length;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          교사 대시보드
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          과목 ID: {courseId}
        </Typography>

        {/* Statistics Overview */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#00C85320' }}>
              <Typography variant="h3" sx={{ color: '#00C853', fontWeight: 'bold' }}>
                {statusCounts[DMNStatus.DEEP_FOCUS] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                깊은 집중
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(((statusCounts[DMNStatus.DEEP_FOCUS] || 0) / totalStudents) * 100)}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#2196F320' }}>
              <Typography variant="h3" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                {statusCounts[DMNStatus.ACTIVE_LEARNING] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                활동적 학습
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(((statusCounts[DMNStatus.ACTIVE_LEARNING] || 0) / totalStudents) * 100)}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#FFC10720' }}>
              <Typography variant="h3" sx={{ color: '#FFC107', fontWeight: 'bold' }}>
                {statusCounts[DMNStatus.WANDERING] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                주의 분산
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(((statusCounts[DMNStatus.WANDERING] || 0) / totalStudents) * 100)}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#F4433620' }}>
              <Typography variant="h3" sx={{ color: '#F44336', fontWeight: 'bold' }}>
                {statusCounts[DMNStatus.DISENGAGED] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                이탈
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(((statusCounts[DMNStatus.DISENGAGED] || 0) / totalStudents) * 100)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Student List */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            학생 목록 ({totalStudents}명)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>학생</TableCell>
                  <TableCell>현재 상태</TableCell>
                  <TableCell>신뢰도</TableCell>
                  <TableCell>마지막 업데이트</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>{student.name[0]}</Avatar>
                        <Typography>{student.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <DMNStatusBadge
                        status={student.status}
                        confidence={student.confidence}
                        language="ko"
                        showConfidence={false}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Math.round(student.confidence * 100)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        방금 전
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
};

export default TeacherDashboard;
