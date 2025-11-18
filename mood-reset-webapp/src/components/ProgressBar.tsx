import { motion } from 'framer-motion';
import { UserProgress } from '../types';

interface ProgressBarProps {
  progress: UserProgress;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = (progress.solvedProblems / progress.totalProblems) * 100;

  return (
    <div style={{
      width: '100%',
      marginBottom: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <span>진행률</span>
        <span>{progress.solvedProblems} / {progress.totalProblems} 문제</span>
      </div>

      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.5,
            ease: 'easeOut'
          }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4ECDC4 0%, #44A08D 100%)',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
