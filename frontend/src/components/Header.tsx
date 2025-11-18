import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <CalculateIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Math Error Detection System
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/practice" startIcon={<CalculateIcon />}>
            연습
          </Button>
          <Button color="inherit" component={RouterLink} to="/progress" startIcon={<TrendingUpIcon />}>
            진도
          </Button>
          <Button color="inherit" component={RouterLink} to="/dashboard" startIcon={<DashboardIcon />}>
            대시보드
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
