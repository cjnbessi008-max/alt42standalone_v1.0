import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Paper } from '@mui/material';
import GraphVisualizer from '../GraphVisualizer/GraphVisualizer';
import { GraphData } from '../../types/graph';
import './VirtualSmartphone.css';

interface VirtualSmartphoneProps {
  graphData: GraphData | null;
  showGraph: boolean;
}

/**
 * VirtualSmartphone Component
 *
 * Displays a virtual smartphone frame that contains the One-Second Graph visualization.
 * Simulates a mobile device viewport with realistic dimensions and styling.
 *
 * Dimensions based on typical smartphone screen:
 * - Aspect ratio: 19.5:9 (modern smartphone)
 * - Display size: 375x812 (iPhone X/11/12 size)
 */
const VirtualSmartphone: React.FC<VirtualSmartphoneProps> = ({
  graphData,
  showGraph,
}) => {
  return (
    <div className="smartphone-container">
      <motion.div
        className="smartphone-device"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Phone outer shell */}
        <Paper
          elevation={24}
          sx={{
            width: 375,
            height: 812,
            borderRadius: '40px',
            background: '#1a1a1a',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Notch */}
          <div className="smartphone-notch">
            <div className="notch-speaker"></div>
            <div className="notch-camera"></div>
          </div>

          {/* Power button */}
          <div className="power-button"></div>

          {/* Volume buttons */}
          <div className="volume-button volume-up"></div>
          <div className="volume-button volume-down"></div>

          {/* Screen */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '32px',
              overflow: 'hidden',
              background: '#ffffff',
              position: 'relative',
            }}
          >
            {/* Status bar */}
            <div className="status-bar">
              <div className="status-left">
                <span className="status-time">9:41</span>
              </div>
              <div className="status-right">
                <span className="status-icon">📶</span>
                <span className="status-icon">📡</span>
                <span className="status-icon">🔋</span>
              </div>
            </div>

            {/* App header */}
            <motion.div
              className="app-header"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2 className="app-title">Fraction Learning</h2>
              <p className="app-subtitle">Concept Map</p>
            </motion.div>

            {/* Main content area */}
            <div className="app-content">
              <AnimatePresence mode="wait">
                {showGraph && graphData ? (
                  <motion.div
                    key="graph"
                    className="content-graph"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GraphVisualizer data={graphData} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    className="content-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="placeholder-icon">📊</div>
                    <h3 className="placeholder-title">Ready to Learn</h3>
                    <p className="placeholder-text">
                      Press the button above to view the concept graph animation
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home indicator (iOS style) */}
            <div className="home-indicator"></div>
          </Box>
        </Paper>
      </motion.div>
    </div>
  );
};

export default VirtualSmartphone;
