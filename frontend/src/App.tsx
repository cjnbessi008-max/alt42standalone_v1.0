/**
 * Main Application Component
 */
import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import StudentDashboard from './components/StudentDashboard'
import { studentsApi } from './services/api'

function App() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: studentsApi.getAll,
  })

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LMS 병목 지점 감지 시스템
          </Typography>
          <Typography variant="body2">
            KAIST Touch Math Academy
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={4}>
          <FormControl fullWidth>
            <InputLabel>학생 선택</InputLabel>
            <Select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              label="학생 선택"
            >
              {students?.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name} ({student.student_number}) - {student.grade_level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedStudentId ? (
          <StudentDashboard studentId={selectedStudentId} />
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.secondary">
              학생을 선택하여 시작하세요
            </Typography>
          </Box>
        )}
      </Container>
    </>
  )
}

export default App
