import React, { useEffect, useState } from 'react';
import './MiniCelebration.css';

interface MiniCelebrationProps {
  /** Whether to show the celebration */
  show: boolean;
  /** Callback when celebration animation completes */
  onComplete?: () => void;
  /** Duration of celebration in milliseconds (default: 1500ms) */
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

/**
 * MiniCelebration Component
 *
 * A lightweight celebration effect for easy problem success moments.
 * Shows stars and colorful particles with smooth animations.
 *
 * Features:
 * - Minimal, non-intrusive design for easy problems
 * - Auto-dismisses after animation completes
 * - Accessible (respects prefers-reduced-motion)
 * - Pure CSS animations for performance
 *
 * @example
 * ```tsx
 * <MiniCelebration
 *   show={isCorrect && isEasyProblem(difficulty)}
 *   onComplete={() => setShowCelebration(false)}
 * />
 * ```
 */
export const MiniCelebration: React.FC<MiniCelebrationProps> = ({
  show,
  onComplete,
  duration = 1500,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // -50 to 50
        y: Math.random() * 100 - 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 200, // Stagger animations
      }));
      setParticles(newParticles);

      // Auto-complete after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!show) return null;

  return (
    <div
      className="mini-celebration"
      role="img"
      aria-label="축하합니다!"
      data-testid="mini-celebration"
    >
      {/* Central star */}
      <div className="celebration-star">⭐</div>

      {/* Text message */}
      <div className="celebration-text">잘했어요!</div>

      {/* Particles */}
      <div className="celebration-particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              '--particle-x': `${particle.x}px`,
              '--particle-y': `${particle.y}px`,
              '--particle-color': particle.color,
              '--particle-delay': `${particle.delay}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};

export default MiniCelebration;
