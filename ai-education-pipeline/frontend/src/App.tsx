import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
});

const steps = [
  'World Model',
  'Rules Generation',
  'Data Schema',
  'Input Strategy',
  'UI Generation',
  'Deployment'
];

function App() {
  const [teacherRequest, setTeacherRequest] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [moduleId, setModuleId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create module
      const moduleResponse = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: moduleName,
          description: teacherRequest,
          subject: 'mathematics',
          gradeLevel: 4,
        }),
      });

      if (!moduleResponse.ok) {
        throw new Error('Failed to create module');
      }

      const moduleData = await moduleResponse.json();
      setModuleId(moduleData.module.id);

      // Start generation
      const generationResponse = await fetch('/api/generation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: moduleData.module.id,
          teacherRequest,
          stage: 'world_model',
        }),
      });

      if (!generationResponse.ok) {
        throw new Error('Failed to start generation');
      }

      setActiveStep(1);
      alert('Module generation started! Check the console for progress.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          {/* Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              🎓 AI Education Pipeline
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Transform your teaching ideas into complete educational modules
            </Typography>
          </Box>

          {/* Progress Stepper */}
          {activeStep > 0 && (
            <Box sx={{ mb: 4 }}>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          <Grid container spacing={4}>
            {/* Input Form */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Create New Module
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      label="Module Name"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      required
                      sx={{ mb: 3 }}
                      placeholder="e.g., Fraction Learning Module"
                    />

                    <TextField
                      fullWidth
                      label="Describe your educational module"
                      value={teacherRequest}
                      onChange={(e) => setTeacherRequest(e.target.value)}
                      required
                      multiline
                      rows={8}
                      placeholder="Example: Create a fractions learning module for 4th graders where students practice adding fractions with visual pie chart representations. Include interactive exercises and instant feedback."
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      sx={{ mt: 3 }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          Generating...
                        </>
                      ) : (
                        'Generate Module'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Information */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    How it Works
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    {[
                      {
                        step: '1. World Model',
                        desc: 'AI analyzes your request and creates a comprehensive educational model',
                      },
                      {
                        step: '2. Rules Generation',
                        desc: 'Automatic generation of business rules and validations',
                      },
                      {
                        step: '3. Data Schema',
                        desc: 'Creates database schema tailored to your module',
                      },
                      {
                        step: '4. Input Strategy',
                        desc: 'Designs optimal input methods for students',
                      },
                      {
                        step: '5. UI Generation',
                        desc: 'Generates interactive user interface components',
                      },
                      {
                        step: '6. Deployment',
                        desc: 'Packages and deploys your complete module',
                      },
                    ].map((item, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.step}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {moduleId && (
                <Card elevation={3} sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Module Created
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Module ID: {moduleId}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
