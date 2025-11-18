import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import TriangleVisualization from './TriangleVisualization';

interface SmartphoneFrameProps {
  problemData: any;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ problemData }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Box
        sx={{
          width: '300px',
          height: '600px',
          bgcolor: '#1a1a1a',
          borderRadius: '40px',
          padding: '20px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          position: 'relative',
          border: '8px solid #2a2a2a',
        }}
      >
        {/* Phone Notch */}
        <Box
          sx={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '25px',
            bgcolor: '#1a1a1a',
            borderRadius: '0 0 20px 20px',
            zIndex: 10,
          }}
        />

        {/* Phone Screen */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'white',
            borderRadius: '30px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* App Header */}
          <Box
            sx={{
              bgcolor: '#667eea',
              color: 'white',
              p: 2,
              pt: 4,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Triangle Mirror
            </Typography>
            <Typography variant="caption">
              유사 삼각형 자동 강조
            </Typography>
          </Box>

          {/* App Content */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflow: 'auto',
              bgcolor: '#f5f5f5',
            }}
          >
            {problemData && (
              <>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  {problemData.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {problemData.description}
                </Typography>

                {/* Triangle Visualization in Phone */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 1,
                    boxShadow: 1,
                  }}
                >
                  <TriangleVisualization
                    problemData={problemData}
                    width={240}
                    height={280}
                    interactive={false}
                  />
                </Box>

                {/* Instructions */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
                    💡 사용 방법:
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    • 삼각형을 클릭하면 유사한 삼각형이 강조됩니다
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    • 같은 색상 = 유사한 삼각형
                  </Typography>
                </Box>
              </>
            )}

            {!problemData && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  문제를 불러오는 중...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default SmartphoneFrame;
