import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FocusSettings } from '../../types';

interface FocusModeProps {
  settings: FocusSettings;
  isActive: boolean;
  children: React.ReactNode;
}

const FocusMode: React.FC<FocusModeProps> = ({ settings, isActive, children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isActive && settings.fullscreen_mode && !isFullscreen) {
      enterFullscreen();
    } else if (!isActive && isFullscreen) {
      exitFullscreen();
    }
  }, [isActive, settings.fullscreen_mode]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <FocusContainer $isActive={isActive} $settings={settings}>
      {isActive && <FocusOverlay $settings={settings} />}
      <ContentWrapper $isActive={isActive} $settings={settings}>
        {children}
      </ContentWrapper>
    </FocusContainer>
  );
};

export default FocusMode;

// Styled Components
const FocusContainer = styled.div<{ $isActive: boolean; $settings: FocusSettings }>`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${props =>
    props.$settings.theme === 'dark' ? '#1a1a1a' :
    props.$settings.theme === 'light' ? '#ffffff' :
    '#f5f5f5'
  };
  transition: background 0.3s ease;
`;

const FocusOverlay = styled.div<{ $settings: FocusSettings }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${props => props.$settings.dim_opacity / 100});
  pointer-events: none;
  z-index: 998;
  animation: fadeIn 0.5s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ContentWrapper = styled.div<{ $isActive: boolean; $settings: FocusSettings }>`
  position: relative;
  z-index: 999;
  max-width: ${props => props.$isActive ? '900px' : '1200px'};
  margin: 0 auto;
  padding: ${props => props.$isActive ? '2rem' : '1rem'};
  background: ${props => props.$isActive ? 'white' : 'transparent'};
  border-radius: ${props => props.$isActive ? '12px' : '0'};
  box-shadow: ${props => props.$isActive ? '0 8px 32px rgba(0, 0, 0, 0.2)' : 'none'};
  transition: all 0.4s ease;

  ${props => props.$isActive && `
    backdrop-filter: blur(${props.$settings.blur_intensity}px);
  `}
`;
