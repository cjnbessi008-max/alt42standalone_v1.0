/**
 * Mental Care Notification Container
 * Manages real-time mental care messages via WebSocket
 */

import React, { useEffect, useState, useCallback } from 'react';
import { MentalCareMessage } from '../types/mental-care.types';
import mentalCareService from '../services/mental-care.service';
import MentalCareMessageCard from './MentalCareMessageCard';
import './MentalCareNotificationContainer.css';

interface MentalCareNotificationContainerProps {
  studentId: string;
  language?: 'ko' | 'en';
  maxVisibleMessages?: number;
  autoHideDelay?: number; // milliseconds, 0 = no auto-hide
}

const MentalCareNotificationContainer: React.FC<MentalCareNotificationContainerProps> = ({
  studentId,
  language = 'ko',
  maxVisibleMessages = 3,
  autoHideDelay = 0,
}) => {
  const [messages, setMessages] = useState<MentalCareMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming message
  const handleNewMessage = useCallback((message: MentalCareMessage) => {
    setMessages((prev) => {
      // Add new message
      const updated = [message, ...prev];

      // Limit to max visible messages
      return updated.slice(0, maxVisibleMessages);
    });

    // Auto-hide if configured
    if (autoHideDelay > 0) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.message_id !== message.message_id));
      }, autoHideDelay);
    }

    // Play notification sound (optional)
    playNotificationSound();
  }, [maxVisibleMessages, autoHideDelay]);

  // Connect to WebSocket on mount
  useEffect(() => {
    if (!studentId) return;

    mentalCareService.connectWebSocket(studentId, handleNewMessage);
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      mentalCareService.disconnectWebSocket();
      setIsConnected(false);
    };
  }, [studentId, handleNewMessage]);

  // Load message history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await mentalCareService.getMessageHistory(studentId, 5);
        setMessages(history.slice(0, maxVisibleMessages));
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    };

    loadHistory();
  }, [studentId, maxVisibleMessages]);

  const handleCloseMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
  };

  const playNotificationSound = () => {
    // Optional: Play a subtle notification sound
    // You can add an audio element or use Web Audio API
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors (e.g., user hasn't interacted with page yet)
      });
    } catch (error) {
      // Audio not available or disabled
    }
  };

  return (
    <div className="mental-care-notification-container">
      {/* Connection status indicator (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      )}

      {/* Messages */}
      <div className="messages-list" role="region" aria-label="Mental care messages">
        {messages.map((message) => (
          <MentalCareMessageCard
            key={message.message_id}
            message={message}
            language={language}
            onClose={() => handleCloseMessage(message.message_id)}
            showFeedback={true}
            studentId={studentId}
          />
        ))}
      </div>

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-text">
            {language === 'ko'
              ? '아직 메시지가 없습니다. 열심히 공부하고 있어요! 💪'
              : 'No messages yet. Keep up the good work! 💪'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MentalCareNotificationContainer;
