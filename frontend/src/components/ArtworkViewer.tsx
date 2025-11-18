/**
 * Artwork Viewer Component
 * 숫자 아트워크를 표시하는 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { Artwork } from '../types';
import '../styles/ArtworkViewer.css';

interface ArtworkViewerProps {
  artwork: Artwork;
}

const ArtworkViewer: React.FC<ArtworkViewerProps> = ({ artwork }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation when artwork changes
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [artwork.number]);

  return (
    <div className={`artwork-viewer ${isAnimating ? 'animating' : ''}`}>
      <div className="artwork-header">
        <h2 className="artwork-number">{artwork.number}</h2>
        <span className="artwork-difficulty">
          {'⭐'.repeat(artwork.difficulty_level)}
        </span>
      </div>

      <div className="artwork-container">
        <div
          className="artwork-svg"
          dangerouslySetInnerHTML={{ __html: artwork.svg_data }}
        />
      </div>

      <div className="artwork-info">
        <h3 className="artwork-title">{artwork.title}</h3>
        {artwork.description && (
          <p className="artwork-description">{artwork.description}</p>
        )}
        <div className="artwork-meta">
          <span className="color-scheme">{artwork.color_scheme}</span>
        </div>
      </div>

      {/* Interactive elements */}
      <div className="artwork-actions">
        <button className="action-button" title="좋아요">
          ❤️
        </button>
        <button className="action-button" title="공유">
          📤
        </button>
        <button className="action-button" title="저장">
          💾
        </button>
      </div>
    </div>
  );
};

export default ArtworkViewer;
