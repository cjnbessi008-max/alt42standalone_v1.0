import { ReactNode } from 'react'
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import SchoolIcon from '@mui/icons-material/School'
import BarChartIcon from '@mui/icons-material/BarChart'
import DashboardIcon from '@mui/icons-material/Dashboard'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Moodle LMS 상관관계 분석 시스템
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
          >
            대시보드
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/moodle"
            startIcon={<SchoolIcon />}
          >
            Moodle 연동
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/correlation"
            startIcon={<BarChartIcon />}
          >
            상관관계 분석
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  )
}
