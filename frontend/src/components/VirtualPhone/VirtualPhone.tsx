/**
 * Virtual Phone Component
 * 우측 하단 가상 스마트폰 화면에 표시되는 앱 wrapper
 *
 * Features:
 * - Realistic smartphone frame (iPhone/Android styles)
 * - Positioned at screen corners (default: bottom-right)
 * - Scalable for different screen sizes
 * - Responsive content area
 * - Status bar and navigation indicators
 */

import React from 'react';
import { Box, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import type { VirtualPhoneProps } from '../../types';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  position = 'bottom-right',
  phoneModel = 'iphone',
  scale = 0.8,
  children
}) => {
  const theme = useTheme();

  // Position styling based on prop
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000
    };

    const offset = 20; // pixels from edge

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: offset, right: offset };
      case 'bottom-left':
        return { ...baseStyles, bottom: offset, left: offset };
      case 'top-right':
        return { ...baseStyles, top: offset, right: offset };
      case 'top-left':
        return { ...baseStyles, top: offset, left: offset };
      default:
        return { ...baseStyles, bottom: offset, right: offset };
    }
  };

  // Phone dimensions (iPhone 14 Pro dimensions as base)
  const PHONE_WIDTH = 390;
  const PHONE_HEIGHT = 844;
  const BEZEL_WIDTH = 12;
  const STATUS_BAR_HEIGHT = 47; // Dynamic Island area
  const HOME_INDICATOR_HEIGHT = 34;

  const scaledWidth = PHONE_WIDTH * scale;
  const scaledHeight = PHONE_HEIGHT * scale;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      style={{
        ...getPositionStyles(),
        transform: `scale(${scale})`,
        transformOrigin: position.includes('bottom') ? 'bottom' : 'top'
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: scaledWidth,
          height: scaledHeight,
          borderRadius: phoneModel === 'iphone' ? '48px' : '32px',
          backgroundColor: '#000',
          padding: `${BEZEL_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: phoneModel === 'iphone'
            ? '3px solid #1f1f1f'
            : '3px solid #2c2c2c',
          boxShadow: theme.shadows[24]
        }}
      >
        {/* Status Bar / Dynamic Island (iPhone) or Notch (Android) */}
        <Box
          sx={{
            height: STATUS_BAR_HEIGHT * scale,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {phoneModel === 'iphone' ? (
            // Dynamic Island
            <Box
              sx={{
                width: '120px',
                height: '32px',
                backgroundColor: '#000',
                borderRadius: '20px',
                border: '1px solid #333'
              }}
            />
          ) : (
            // Android notch or punch hole
            <Box
              sx={{
                width: '24px',
                height: '24px',
                backgroundColor: '#000',
                borderRadius: '50%',
                border: '1px solid #333'
              }}
            />
          )}
        </Box>

        {/* Screen Content Area */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: theme.palette.background.default,
            borderRadius: '2px',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': {
              width: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '4px'
            }
          }}
        >
          {children}
        </Box>

        {/* Home Indicator (iPhone) or Navigation Bar (Android) */}
        <Box
          sx={{
            height: HOME_INDICATOR_HEIGHT * scale,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {phoneModel === 'iphone' ? (
            // iPhone home indicator
            <Box
              sx={{
                width: '120px',
                height: '4px',
                backgroundColor: '#fff',
                borderRadius: '2px',
                opacity: 0.5
              }}
            />
          ) : (
            // Android navigation buttons
            <Box
              sx={{
                display: 'flex',
                gap: '32px',
                opacity: 0.6
              }}
            >
              <Box sx={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }} />
              <Box sx={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }} />
              <Box sx={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }} />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Phone model indicator badge */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          backgroundColor: theme.palette.primary.main,
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: theme.shadows[4]
        }}
      >
        <PhoneIphoneIcon sx={{ fontSize: '12px' }} />
        {phoneModel.toUpperCase()}
      </Box>
    </motion.div>
  );
};

export default VirtualPhone;
