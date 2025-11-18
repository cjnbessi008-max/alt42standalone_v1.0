// Virtual smartphone frame component

import React from 'react';
import { Box, Paper } from '@mui/material';

interface PhoneFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  showFrame?: boolean;
}

const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  width = 375,
  height = 667,
  showFrame = true,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f0f0',
        padding: 2,
      }}
    >
      <Paper
        elevation={showFrame ? 8 : 0}
        sx={{
          width: width,
          height: height,
          borderRadius: showFrame ? '36px' : 0,
          border: showFrame ? '12px solid #1a1a1a' : 'none',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: showFrame
            ? '0 8px 32px rgba(0, 0, 0, 0.2)'
            : 'none',
        }}
      >
        {/* Notch (optional - for modern phone style) */}
        {showFrame && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 150,
              height: 30,
              backgroundColor: '#1a1a1a',
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
              zIndex: 1000,
            }}
          />
        )}

        {/* Screen content */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Paper>
    </Box>
  );
};

export default PhoneFrame;
