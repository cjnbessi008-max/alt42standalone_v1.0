import React, { useEffect, useState } from 'react';
import './WrongMoveAlert.css';
import { WrongMoveEvent, CrackEffect } from '../../types';

interface WrongMoveAlertProps {
  events: WrongMoveEvent[];
}

const WrongMoveAlert: React.FC<WrongMoveAlertProps> = ({ events }) => {
  const [cracks, setCracks] = useState<CrackEffect[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      generateCracks(latestEvent);

      // Play alert sound (optional)
      playAlertSound(latestEvent.severity);
    }
  }, [events]);

  const generateCracks = (event: WrongMoveEvent) => {
    const numCracks = event.severity === 'high' ? 8 : event.severity === 'medium' ? 5 : 3;
    const newCracks: CrackEffect[] = [];

    // Generate random crack patterns from center
    const centerX = 50;
    const centerY = 50;

    for (let i = 0; i < numCracks; i++) {
      const angle = (Math.PI * 2 * i) / numCracks + (Math.random() - 0.5) * 0.5;
      const length = 30 + Math.random() * 40;

      newCracks.push({
        id: `crack_${Date.now()}_${i}`,
        startX: centerX,
        startY: centerY,
        endX: centerX + Math.cos(angle) * length,
        endY: centerY + Math.sin(angle) * length,
        severity: event.severity,
        duration: 2000,
      });
    }

    setCracks(newCracks);

    // Clear cracks after animation
    setTimeout(() => {
      setCracks([]);
    }, 2000);
  };

  const playAlertSound = (severity: string) => {
    // Audio feedback - can implement Web Audio API
    if ('vibrate' in navigator) {
      const pattern = severity === 'high' ? [100, 50, 100] : [100];
      navigator.vibrate(pattern);
    }
  };

  if (events.length === 0) return null;

  return (
    <div className="wrong-move-alert">
      {/* Red flash overlay */}
      <div className="alert-flash" />

      {/* Crack effects */}
      <svg className="crack-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {cracks.map((crack, index) => (
          <g key={crack.id}>
            {/* Main crack line */}
            <line
              x1={`${crack.startX}%`}
              y1={`${crack.startY}%`}
              x2={`${crack.endX}%`}
              y2={`${crack.endY}%`}
              className={`crack-line crack-${crack.severity}`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            />

            {/* Branch cracks */}
            {[...Array(2)].map((_, branchIndex) => {
              const branchPoint = 0.4 + Math.random() * 0.4;
              const branchX = crack.startX + (crack.endX - crack.startX) * branchPoint;
              const branchY = crack.startY + (crack.endY - crack.startY) * branchPoint;
              const branchAngle = (Math.random() - 0.5) * Math.PI / 2;
              const branchLength = 10 + Math.random() * 15;

              return (
                <line
                  key={`branch_${branchIndex}`}
                  x1={`${branchX}%`}
                  y1={`${branchY}%`}
                  x2={`${branchX + Math.cos(branchAngle) * branchLength}%`}
                  y2={`${branchY + Math.sin(branchAngle) * branchLength}%`}
                  className={`crack-branch crack-${crack.severity}`}
                  style={{
                    animationDelay: `${index * 50 + 100}ms`
                  }}
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* Shatter particle effects */}
      <div className="shatter-particles">
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle_${i}`}
            className="particle"
            style={{
              left: `${50 + (Math.random() - 0.5) * 60}%`,
              top: `${50 + (Math.random() - 0.5) * 60}%`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WrongMoveAlert;
