import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const MobilePhoneView = ({ children, title = '모듈 미리보기' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: 375,
          height: 667,
          borderRadius: '30px',
          overflow: 'hidden',
          border: '12px solid #333',
          bgcolor: '#fff',
          position: 'relative',
        }}
      >
        {/* Phone notch */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 150,
            height: 25,
            bgcolor: '#333',
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
            zIndex: 10,
          }}
        />

        {/* Screen content */}
        <Box
          sx={{
            height: '100%',
            overflowY: 'auto',
            pt: 4,
            px: 2,
            pb: 2,
            bgcolor: '#f5f5f5',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            {title}
          </Typography>
          {children}
        </Box>

        {/* Home indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 134,
            height: 5,
            bgcolor: '#333',
            borderRadius: 3,
            zIndex: 10,
          }}
        />
      </Paper>
    </Box>
  );
};

export default MobilePhoneView;
