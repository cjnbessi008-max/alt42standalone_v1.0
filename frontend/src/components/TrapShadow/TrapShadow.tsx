import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { TrapPoint, TrapSeverity } from '../../types';

interface TrapShadowProps {
  trapPoint: TrapPoint;
  onHover?: (trapPoint: TrapPoint) => void;
  onClick?: (trapPoint: TrapPoint) => void;
}

const pulse = keyframes`
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
`;

const getSeverityConfig = (severity: TrapSeverity) => {
  switch (severity) {
    case TrapSeverity.HIGH:
      return {
        color: 'rgba(255, 69, 0, 0.35)',
        border: '2px solid orangered',
        animationDuration: '1.5s',
      };
    case TrapSeverity.MEDIUM:
      return {
        color: 'rgba(255, 140, 0, 0.25)',
        border: '2px dashed darkorange',
        animationDuration: '2s',
      };
    case TrapSeverity.LOW:
    default:
      return {
        color: 'rgba(255, 165, 0, 0.15)',
        border: '1px dashed orange',
        animationDuration: '3s',
      };
  }
};

const ShadowOverlay = styled.div<{
  position: { x: number; y: number; width: number; height: number };
  severity: TrapSeverity;
  isHovered: boolean;
}>`
  position: absolute;
  left: ${({ position }) => position.x}%;
  top: ${({ position }) => position.y}%;
  width: ${({ position }) => position.width}%;
  height: ${({ position }) => position.height}%;
  background-color: ${({ severity }) => getSeverityConfig(severity).color};
  border: ${({ severity }) => getSeverityConfig(severity).border};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;

  ${({ severity }) => css`
    animation: ${pulse} ${getSeverityConfig(severity).animationDuration} infinite;
  `}

  ${({ isHovered }) =>
    isHovered &&
    css`
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(255, 140, 0, 0.4);
      z-index: 20;
    `}

  &:hover {
    animation-play-state: paused;
  }
`;

const Tooltip = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transition: opacity 0.2s ease;
  z-index: 30;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const ErrorBadge = styled.div<{ severity: TrapSeverity }>`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${({ severity }) => {
    switch (severity) {
      case TrapSeverity.HIGH:
        return 'linear-gradient(135deg, #ff4500, #ff6347)';
      case TrapSeverity.MEDIUM:
        return 'linear-gradient(135deg, #ff8c00, #ffa500)';
      case TrapSeverity.LOW:
      default:
        return 'linear-gradient(135deg, #ffa500, #ffb84d)';
    }
  }};
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 11;
`;

const TrapShadow: React.FC<TrapShadowProps> = ({
  trapPoint,
  onHover,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) {
      onHover(trapPoint);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(trapPoint);
    }
  };

  return (
    <ShadowOverlay
      position={trapPoint.position}
      severity={trapPoint.severity}
      isHovered={isHovered}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={trapPoint.description}
    >
      <Tooltip isVisible={isHovered}>{trapPoint.description}</Tooltip>
      <ErrorBadge severity={trapPoint.severity}>
        {Math.round(trapPoint.errorRate)}%
      </ErrorBadge>
    </ShadowOverlay>
  );
};

export default TrapShadow;
