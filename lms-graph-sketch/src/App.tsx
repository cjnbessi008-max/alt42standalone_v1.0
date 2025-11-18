import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Header } from './components/Layout/Header';
import { TextInputPanel } from './components/TextInput/TextInputPanel';
import { GraphCanvas } from './components/GraphVisualization/GraphCanvas';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden', display: 'flex', gap: 2, height: 'calc(100vh - 64px)' }}>
          <Box sx={{ width: '33.33%', height: '100%' }}>
            <TextInputPanel />
          </Box>
          <Box sx={{ width: '66.67%', height: '100%' }}>
            <GraphCanvas />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
