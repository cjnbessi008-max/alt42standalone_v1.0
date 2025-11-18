import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  SelectChangeEvent,
} from '@mui/material';
import { Student } from '../types/timeline';

interface StudentSelectorProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onSelectStudent(event.target.value);
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <FormControl fullWidth>
          <InputLabel id="student-select-label">학생 선택</InputLabel>
          <Select
            labelId="student-select-label"
            id="student-select"
            value={selectedStudentId}
            label="학생 선택"
            onChange={handleChange}
          >
            {students.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.name} ({student.email}) - {student.grade_level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default StudentSelector;
