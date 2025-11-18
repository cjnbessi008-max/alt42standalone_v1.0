import { useState } from 'react'
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import { useQuery, useMutation } from '@tanstack/react-query'
import { moodleApi } from '../services/api'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export default function MoodleConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const connectMutation = useMutation({
    mutationFn: moodleApi.connect,
    onSuccess: () => {
      setConnectionStatus('success')
    },
    onError: () => {
      setConnectionStatus('error')
    },
  })

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => moodleApi.getCourses(),
    enabled: connectionStatus === 'success',
  })

  const handleConnect = () => {
    connectMutation.mutate()
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Moodle LMS 연동
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          연결 상태
        </Typography>

        <Box sx={{ mb: 2 }}>
          {connectionStatus === 'idle' && (
            <Button
              variant="contained"
              startIcon={<CloudSyncIcon />}
              onClick={handleConnect}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? '연결 중...' : 'Moodle에 연결'}
            </Button>
          )}

          {connectionStatus === 'success' && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Moodle에 성공적으로 연결되었습니다.
            </Alert>
          )}

          {connectionStatus === 'error' && (
            <Alert severity="error">
              Moodle 연결에 실패했습니다. 설정을 확인해주세요.
            </Alert>
          )}
        </Box>
      </Paper>

      {connectionStatus === 'success' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            사용 가능한 코스
          </Typography>

          {coursesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : courses?.data && courses.data.length > 0 ? (
            <List>
              {courses.data.map((course: any) => (
                <ListItem key={course.id} divider>
                  <ListItemText
                    primary={course.fullname || course.shortname}
                    secondary={`코스 ID: ${course.id}`}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // TODO: Navigate to course details or sync
                    }}
                  >
                    동기화
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              사용 가능한 코스가 없습니다.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}
