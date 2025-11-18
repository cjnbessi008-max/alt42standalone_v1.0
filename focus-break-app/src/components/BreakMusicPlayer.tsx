import { useEffect, useRef, useState } from 'react';
import './BreakMusicPlayer.css';

interface BreakMusicPlayerProps {
  isPlaying: boolean;
  volume?: number;
  onEnded?: () => void;
}

// Sample relaxing music URLs (using royalty-free music)
const BREAK_MUSIC_PLAYLIST = [
  {
    title: "Calm Piano",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Peaceful Ambience",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    title: "Gentle Melody",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export const BreakMusicPlayer: React.FC<BreakMusicPlayerProps> = ({
  isPlaying,
  volume = 0.5,
  onEnded
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const currentTrack = BREAK_MUSIC_PLAYLIST[currentTrackIndex];

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && isAudioReady) {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isPlaying, isAudioReady]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const handleCanPlay = () => {
    setIsAudioReady(true);
  };

  const handleEnded = () => {
    // Move to next track in playlist
    const nextIndex = (currentTrackIndex + 1) % BREAK_MUSIC_PLAYLIST.length;
    setCurrentTrackIndex(nextIndex);

    if (onEnded) {
      onEnded();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error:', e);
    setIsAudioReady(false);
  };

  return (
    <div className="break-music-player">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
        preload="auto"
      />
      {isPlaying && (
        <div className="now-playing">
          <div className="music-icon">🎵</div>
          <div className="track-info">
            <div className="track-title">{currentTrack.title}</div>
            <div className="playing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakMusicPlayer;
