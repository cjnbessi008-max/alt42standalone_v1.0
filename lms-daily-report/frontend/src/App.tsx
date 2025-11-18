import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as ReportIcon,
  Warning as IncidentIcon,
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import ReportsList from './components/ReportsList';
import ReportDetail from './components/ReportDetail';
import IncidentsList from './components/IncidentsList';

const drawerWidth = 240;

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              LMS 일일 사고 흐름 리포트
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/">
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="대시보드" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton component={Link} to="/reports">
                  <ListItemIcon>
                    <ReportIcon />
                  </ListItemIcon>
                  <ListItemText primary="일일 리포트" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton component={Link} to="/incidents">
                  <ListItemIcon>
                    <IncidentIcon />
                  </ListItemIcon>
                  <ListItemText primary="사고 목록" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/reports/:reportId" element={<ReportDetail />} />
              <Route path="/incidents" element={<IncidentsList />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
