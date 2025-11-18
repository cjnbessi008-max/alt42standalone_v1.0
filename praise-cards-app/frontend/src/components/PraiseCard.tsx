import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PraiseCard as PraiseCardType } from '@/types';
import { interactionsApi } from '@/services/api';
import './PraiseCard.css';

interface PraiseCardProps {
  card: PraiseCardType;
  currentStudentId?: string;
  onLikeToggle?: () => void;
}

const cardDesignEmojis: Record<string, string> = {
  accuracy: '🎯',
  streak: '🔥',
  trophy: '🏆',
  clock: '⏰',
  rocket: '🚀',
  star: '⭐',
  celebration: '🎉',
  lightning: '⚡',
  default: '✨',
};

export default function PraiseCard({ card, currentStudentId, onLikeToggle }: PraiseCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(card.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!currentStudentId || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await interactionsApi.unlike(card.id, currentStudentId);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await interactionsApi.like(card.id, currentStudentId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      onLikeToggle?.();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const emoji = cardDesignEmojis[card.card_design] || cardDesignEmojis.default;

  return (
    <motion.div
      className={`praise-card ${card.card_design}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
    >
      <div className="praise-card-header">
        <div className="student-info">
          <div className="student-avatar">
            {card.student?.profile_image ? (
              <img src={card.student.profile_image} alt={card.student.name} />
            ) : (
              <div className="avatar-placeholder">{card.student?.name.charAt(0)}</div>
            )}
          </div>
          <div className="student-details">
            <h3 className="student-name">{card.student?.name}</h3>
            <p className="student-grade">{card.student?.grade_level}학년</p>
          </div>
        </div>
        <div className="achievement-badge">
          <span className="badge-emoji">{emoji}</span>
        </div>
      </div>

      <div className="praise-card-body">
        <h2 className="achievement-title">{card.title}</h2>
        <p className="ai-message">{card.ai_message}</p>

        {card.achievement && (
          <div className="achievement-details">
            <Sparkles size={14} />
            <span>{card.achievement.description}</span>
          </div>
        )}
      </div>

      <div className="praise-card-footer">
        <div className="card-stats">
          <button
            className={`stat-button like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>

          <div className="stat-item">
            <MessageCircle size={18} />
            <span>{card.comments_count}</span>
          </div>

          <div className="stat-item">
            <Eye size={18} />
            <span>{card.views_count}</span>
          </div>
        </div>

        <div className="card-time">
          {formatDistanceToNow(new Date(card.created_at), {
            addSuffix: true,
            locale: ko,
          })}
        </div>
      </div>
    </motion.div>
  );
}
