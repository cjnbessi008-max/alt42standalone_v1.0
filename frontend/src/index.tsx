import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#F44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans KR", sans-serif',
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
