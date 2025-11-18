/**
 * 학생 목록 페이지
 */
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
} from '@mui/material';
import { studentApi } from '../services/api';
import type { Student } from '../types';

interface StudentListProps {
  onSelectStudent: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await studentApi.list();
        setStudents(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || '학생 목록을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        👨‍🎓 학생 선택
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        성공 루틴 카드를 확인할 학생을 선택하세요
      </Typography>

      <Card>
        <List>
          {students.map((student) => (
            <ListItem key={student.id} disablePadding>
              <ListItemButton onClick={() => onSelectStudent(student.id)}>
                <ListItemText
                  primary={student.name}
                  secondary={`${student.grade_level || '학년 미지정'} • ${student.student_number}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Card>

      {students.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          등록된 학생이 없습니다
        </Alert>
      )}
    </Container>
  );
};

export default StudentList;
