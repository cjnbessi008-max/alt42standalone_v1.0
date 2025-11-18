import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
}) => {
  return (
    <Paper elevation={2} sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">학생 목록</Typography>
        <Typography variant="body2" color="text.secondary">
          총 {students.length}명
        </Typography>
      </Box>
      <List>
        {students.map((student) => (
          <ListItem key={student.id} disablePadding>
            <ListItemButton
              selected={selectedStudent?.id === student.id}
              onClick={() => onSelectStudent(student)}
            >
              <ListItemText
                primary={student.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip label={student.student_id} size="small" variant="outlined" />
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
