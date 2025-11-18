import React from 'react';
import { Box, Paper } from '@mui/material';
import './SmartphoneSimulator.css';

interface SmartphoneSimulatorProps {
  children: React.ReactNode;
}

const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({ children }) => {
  return (
    <Box className="smartphone-container">
      <Paper elevation={8} className="smartphone-frame">
        {/* Notch */}
        <Box className="smartphone-notch" />

        {/* Screen */}
        <Box className="smartphone-screen">
          <Box className="smartphone-content">
            {children}
          </Box>
        </Box>

        {/* Home indicator */}
        <Box className="smartphone-home-indicator" />
      </Paper>
    </Box>
  );
};

export default SmartphoneSimulator;
