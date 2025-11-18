import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import SmartphoneFrame from './components/SmartphoneFrame';
import TriangleMirror from './components/TriangleMirror';
import { useTriangleStore } from './store/triangleStore';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
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
    ].join(','),
  },
});

function App() {
  const [problemData, setProblemData] = useState<any>(null);
  const { loadProblem } = useTriangleStore();

  useEffect(() => {
    // Check if loaded from Moodle (via URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const moodleQuestionId = urlParams.get('questionId');

    if (moodleQuestionId) {
      // Fetch problem from API
      fetch(`/api/problems/moodle/${moodleQuestionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProblemData(data.data);
            loadProblem(data.data);
          }
        })
        .catch(err => console.error('Error loading problem:', err));
    } else {
      // Load demo problem for testing
      loadDemoProblem();
    }
  }, []);

  const loadDemoProblem = () => {
    // Demo: Similar triangles problem
    const demo = {
      id: 'demo-1',
      title: '유사 삼각형 찾기',
      description: '아래 그림에서 서로 유사한 삼각형을 찾아보세요.',
      problemData: {
        triangles: [
          {
            label: 'ABC',
            vertices: [
              { x: 100, y: 100 },
              { x: 200, y: 100 },
              { x: 150, y: 50 }
            ]
          },
          {
            label: 'DEF',
            vertices: [
              { x: 250, y: 150 },
              { x: 400, y: 150 },
              { x: 325, y: 25 }
            ]
          },
          {
            label: 'GHI',
            vertices: [
              { x: 100, y: 250 },
              { x: 180, y: 250 },
              { x: 100, y: 190 }
            ]
          }
        ]
      }
    };

    setProblemData(demo);
    loadProblem(demo);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                bgcolor: 'white',
                borderRadius: 4,
                p: 4,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                minHeight: '600px',
              }}
            >
              <TriangleMirror problemData={problemData} />
            </Box>

            {/* Smartphone Frame - Bottom Right */}
            <Box
              sx={{
                position: 'relative',
              }}
            >
              <SmartphoneFrame problemData={problemData} />
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
