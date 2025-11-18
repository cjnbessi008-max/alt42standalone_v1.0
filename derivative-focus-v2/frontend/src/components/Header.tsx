import { Box, Typography } from '@mui/material'

export default function Header() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        color: 'white',
        py: 4,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
        Derivative Focus
      </Typography>
      <Typography variant="h6" sx={{ opacity: 0.9 }}>
        AI 기반 미분 문제 핵심 규칙 자동 강조 시스템
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
        Powered by Claude AI + Moodle LMS Integration
      </Typography>
    </Box>
  )
}
