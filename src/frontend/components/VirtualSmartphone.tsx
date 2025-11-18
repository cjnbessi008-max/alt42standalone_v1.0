import React, { ReactNode } from 'react';
import { Box, Paper } from '@mui/material';

interface VirtualSmartphoneProps {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  scale?: number;
}

/**
 * Virtual Smartphone Display Component
 *
 * Renders content within a virtual smartphone frame positioned on screen.
 * Designed to display educational content in a mobile-friendly interface.
 *
 * @component
 * @example
 * ```tsx
 * <VirtualSmartphone position="bottom-right">
 *   <PartialSumFlowCurve data={[1, 2, 3, 4, 5]} />
 * </VirtualSmartphone>
 * ```
 */
export const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({
  children,
  position = 'bottom-right',
  scale = 1
}) => {
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000
    };

    switch (position) {
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: '20px',
          right: '20px'
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '20px'
        };
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`
        };
      default:
        return baseStyles;
    }
  };

  return (
    <Box
      sx={{
        ...getPositionStyles(),
        transform: position !== 'center' ? `scale(${scale})` : undefined,
        transformOrigin: position === 'bottom-right' ? 'bottom right' :
                         position === 'bottom-left' ? 'bottom left' :
                         'center'
      }}
    >
      {/* Smartphone Frame */}
      <Paper
        elevation={24}
        sx={{
          width: '375px',
          height: '667px',
          borderRadius: '40px',
          border: '14px solid #1a1a1a',
          background: '#1a1a1a',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '30px',
            background: '#1a1a1a',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            zIndex: 10
          }
        }}
      >
        {/* Camera/Speaker Notch */}
        <Box
          sx={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '6px',
            background: '#0a0a0a',
            borderRadius: '3px',
            zIndex: 11
          }}
        />

        {/* Front Camera */}
        <Box
          sx={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: 'translateX(25px)',
            width: '10px',
            height: '10px',
            background: '#0a0a0a',
            borderRadius: '50%',
            border: '1px solid #333',
            zIndex: 11
          }}
        />

        {/* Screen Content Area */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'white',
            borderRadius: '26px',
            overflow: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '3px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555'
            }
          }}
        >
          {/* Status Bar */}
          <Box
            sx={{
              height: '44px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            <Box>9:41</Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box>📶</Box>
              <Box>📡</Box>
              <Box>🔋</Box>
            </Box>
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              p: 2,
              minHeight: 'calc(100% - 44px)',
              background: '#f8f9fa'
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Home Indicator (iOS style) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '134px',
            height: '5px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '100px',
            zIndex: 11
          }}
        />
      </Paper>
    </Box>
  );
};

export default VirtualSmartphone;
