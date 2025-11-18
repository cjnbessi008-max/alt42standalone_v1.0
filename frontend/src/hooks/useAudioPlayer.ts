/**
 * Custom Hook: useAudioPlayer
 * Manages audio playback for calming messages
 */

import { useRef, useState, useEffect } from 'react';

interface UseAudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

interface UseAudioPlayerReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  hasError: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const useAudioPlayer = ({
  audioUrl,
  autoPlay = true,
  onEnded,
  onError
}: UseAudioPlayerProps): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Event handlers
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleError = (e: Event) => {
      setHasError(true);
      setIsPlaying(false);
      const error = new Error('Audio playback failed');
      console.error('Audio error:', e);
      onError?.(error);
    };

    // Attach event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Autoplay if enabled
    if (autoPlay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Autoplay failed:', err);
          // Autoplay might be blocked by browser
          setHasError(true);
        });
      }
    }

    // Cleanup
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay, onEnded, onError]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Play failed:', err);
        setHasError(true);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return {
    play,
    pause,
    stop,
    isPlaying,
    hasError,
    audioRef
  };
};
