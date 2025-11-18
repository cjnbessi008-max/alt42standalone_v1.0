/**
 * Virtual Smartphone Screen Component
 * Displays content in a smartphone frame positioned at bottom-right
 */
import React from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  children,
  onClose,
  onMinimize,
  isMinimized = false,
}) => {
  if (isMinimized) {
    return (
      <Box
        className="virtual-phone-minimized"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}
        onClick={onMinimize}
      >
        <Box
          sx={{
            width: '40px',
            height: '60px',
            border: '3px solid white',
            borderRadius: '6px',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      className="virtual-phone-container"
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: '380px',
        height: '720px',
        zIndex: 1000,
      }}
    >
      {/* Smartphone Frame */}
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '36px',
          padding: '16px',
          backgroundColor: '#1a1a1a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Notch */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '140px',
            height: '28px',
            backgroundColor: '#1a1a1a',
            borderRadius: '0 0 18px 18px',
            zIndex: 1,
          }}
        />

        {/* Control Buttons */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {onMinimize && (
            <IconButton
              size="small"
              onClick={onMinimize}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          )}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,0,0,0.5)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Screen Content */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            borderRadius: '24px',
            overflow: 'auto',
            paddingTop: '32px',
          }}
        >
          {children}
        </Box>
      </Paper>

      {/* Home Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '5px',
          backgroundColor: '#666',
          borderRadius: '3px',
        }}
      />
    </Box>
  );
};

export default VirtualPhone;
