import React, { useEffect, useState } from 'react';
import VoicePraiseService, { PraiseEvent } from '../services/VoicePraiseService';
import './VoicePraisePlayer.css';

interface VoicePraisePlayerProps {
  praiseEvent: PraiseEvent | null;
  onComplete?: () => void;
}

const VoicePraisePlayer: React.FC<VoicePraisePlayerProps> = ({
  praiseEvent,
  onComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  useEffect(() => {
    if (praiseEvent) {
      playPraise(praiseEvent);
    }
  }, [praiseEvent]);

  const playPraise = async (event: PraiseEvent) => {
    setIsPlaying(true);
    setCurrentMessage(event.message);

    try {
      await VoicePraiseService.speak(event);
    } catch (error) {
      console.error('Failed to play praise:', error);
    } finally {
      setIsPlaying(false);
      setTimeout(() => {
        setCurrentMessage('');
        onComplete?.();
      }, 2000); // Keep message visible for 2 seconds after speech ends
    }
  };

  if (!currentMessage) {
    return null;
  }

  return (
    <div className={`voice-praise-player ${isPlaying ? 'playing' : 'fading'}`}>
      <div className="praise-content">
        <div className="praise-icon">
          {isPlaying ? '🎉' : '⭐'}
        </div>
        <div className="praise-message">
          {currentMessage}
        </div>
        {isPlaying && (
          <div className="sound-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePraisePlayer;
