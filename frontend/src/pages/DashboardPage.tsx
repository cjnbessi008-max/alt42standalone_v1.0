import { Box, Typography, Paper } from '@mui/material'

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="body1">
          Dashboard implementation pending...
        </Typography>
      </Paper>
    </Box>
  )
}
