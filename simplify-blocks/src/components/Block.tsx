import { motion } from 'framer-motion';
import { LogBlock } from '../types';
import './Block.css';

interface BlockProps {
  block: LogBlock;
  delay?: number;
}

/**
 * 로그식 블록 컴포넌트
 */
export function Block({ block, delay = 0 }: BlockProps) {
  const blockVariants = {
    hidden: {
      opacity: 0,
      y: -50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const getBlockIcon = (type: LogBlock['type']) => {
    switch (type) {
      case 'sum': return '+';
      case 'difference': return '−';
      case 'coefficient': return '×';
      case 'power': return '^';
      default: return 'log';
    }
  };

  return (
    <motion.div
      className="block"
      style={{ backgroundColor: block.color }}
      variants={blockVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="block-icon">{getBlockIcon(block.type)}</div>
      <div className="block-expression">{block.expression}</div>

      {block.children && block.children.length > 0 && (
        <div className="block-children">
          {block.children.map((child, index) => (
            <Block
              key={child.id}
              block={child}
              delay={delay + (index + 1) * 0.1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
