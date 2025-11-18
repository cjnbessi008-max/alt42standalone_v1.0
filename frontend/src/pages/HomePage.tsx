import { Box, Typography, Button, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          AI Education System Pipeline
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Transform your teaching ideas into complete educational modules
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/modules/create')}
          sx={{ mt: 2 }}
        >
          Create New Module
        </Button>
      </Paper>
    </Box>
  )
}
