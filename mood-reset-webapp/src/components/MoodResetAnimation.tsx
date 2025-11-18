import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MoodType } from '../types';

interface MoodResetAnimationProps {
  show: boolean;
  onComplete: () => void;
}

const MoodResetAnimation: React.FC<MoodResetAnimationProps> = ({ show, onComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);

      // Auto complete after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: '50vw',
                y: '50vh',
                opacity: 1,
                scale: 0
              }}
              animate={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                opacity: 0,
                scale: [0, 1, 0.5, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                ease: 'easeOut'
              }}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: particle.color
              }}
            />
          ))}

          {/* Mood emoji animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 1.5, 1.2],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.6, 1],
              ease: 'easeOut'
            }}
            style={{
              fontSize: '120px',
              textAlign: 'center',
              zIndex: 1001
            }}
          >
            🎉
          </motion.div>

          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{
              marginTop: '30px',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1001
            }}
          >
            정답입니다! 🌟
          </motion.div>

          {/* Mood reset indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.9]
            }}
            transition={{
              duration: 2,
              times: [0, 0.2, 0.8, 1]
            }}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '25px',
              fontSize: '18px',
              color: '#667eea',
              fontWeight: '600',
              zIndex: 1001
            }}
          >
            기분이 좋아졌어요! 😊
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MoodResetAnimation;
