import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 152, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 152, 0, 0.6);
  }
`;

const FeedbackContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const WarmthOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.overlayColor};
  opacity: ${props => props.opacity};
  transition: opacity 1.5s ease, background 1.5s ease;
  animation: ${props => props.shouldAnimate ? pulse : 'none'} 2s ease-in-out infinite;
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
`;

const Particle = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  opacity: ${props => props.opacity};
  top: ${props => props.top}%;
  left: ${props => props.left}%;
  animation: ${glow} ${props => props.duration}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const FeedbackText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.5s ease;
  z-index: 10;
`;

const CorrectWarmFeedback = ({ warmthLevel }) => {
  const [particles, setParticles] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    // Generate particles based on warmth level
    if (warmthLevel > 50) {
      const particleCount = Math.floor(warmthLevel / 10);
      const newParticles = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          size: Math.random() * 20 + 10,
          top: Math.random() * 100,
          left: Math.random() * 100,
          color: getParticleColor(warmthLevel),
          opacity: Math.random() * 0.5 + 0.3,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 2
        });
      }

      setParticles(newParticles);
    } else {
      setParticles([]);
    }

    // Update feedback message
    updateFeedbackMessage(warmthLevel);
  }, [warmthLevel]);

  const getParticleColor = (level) => {
    if (level < 50) return 'rgba(255, 235, 59, 0.8)'; // Yellow
    if (level < 70) return 'rgba(255, 152, 0, 0.8)'; // Orange
    if (level < 90) return 'rgba(255, 87, 34, 0.8)'; // Deep orange
    return 'rgba(244, 67, 54, 0.8)'; // Red
  };

  const getOverlayColor = (level) => {
    if (level < 30) return 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%)';
    if (level < 50) return 'radial-gradient(circle, rgba(255, 235, 59, 0.2) 0%, transparent 70%)';
    if (level < 70) return 'radial-gradient(circle, rgba(255, 152, 0, 0.3) 0%, transparent 70%)';
    if (level < 90) return 'radial-gradient(circle, rgba(255, 87, 34, 0.4) 0%, transparent 70%)';
    return 'radial-gradient(circle, rgba(244, 67, 54, 0.5) 0%, transparent 70%)';
  };

  const updateFeedbackMessage = (level) => {
    if (level === 0) {
      setFeedbackMessage('');
      setShowFeedback(false);
    } else if (level < 30) {
      setFeedbackMessage('🤔');
      setShowFeedback(true);
    } else if (level < 50) {
      setFeedbackMessage('👍');
      setShowFeedback(true);
    } else if (level < 70) {
      setFeedbackMessage('🎉');
      setShowFeedback(true);
    } else if (level < 90) {
      setFeedbackMessage('🔥');
      setShowFeedback(true);
    } else {
      setFeedbackMessage('⭐');
      setShowFeedback(true);
    }

    // Auto hide feedback after 2 seconds
    if (level > 0) {
      setTimeout(() => setShowFeedback(false), 2000);
    }
  };

  return (
    <FeedbackContainer>
      <WarmthOverlay
        overlayColor={getOverlayColor(warmthLevel)}
        opacity={Math.min(warmthLevel / 100, 0.8)}
        shouldAnimate={warmthLevel > 70}
      />

      <ParticleContainer>
        {particles.map(particle => (
          <Particle
            key={particle.id}
            size={particle.size}
            top={particle.top}
            left={particle.left}
            color={particle.color}
            opacity={particle.opacity}
            duration={particle.duration}
            delay={particle.delay}
          />
        ))}
      </ParticleContainer>

      <FeedbackText show={showFeedback}>
        {feedbackMessage}
      </FeedbackText>
    </FeedbackContainer>
  );
};

export default CorrectWarmFeedback;
