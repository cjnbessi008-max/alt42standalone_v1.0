import React, { useState, useEffect } from 'react';
import VectorCanvas from './VectorCanvas';
import './VectorStoryMode.css';

const VectorStoryMode = ({ problem, onBack }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const scenes = problem.storyMode?.scenes || [];
  const currentScene = scenes[currentSceneIndex];
  const isLastScene = currentSceneIndex === scenes.length - 1;

  useEffect(() => {
    if (isPlaying && currentScene) {
      const duration = currentScene.duration || 3000;
      const interval = 50; // Update every 50ms
      const steps = duration / interval;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        setProgress((step / steps) * 100);

        if (step >= steps) {
          clearInterval(timer);
          setIsPlaying(false);
          setProgress(0);

          // Auto-advance to next scene
          if (!isLastScene) {
            setTimeout(() => {
              setCurrentSceneIndex((prev) => prev + 1);
            }, 500);
          }
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isPlaying, currentSceneIndex, currentScene, isLastScene]);

  const handlePlay = () => {
    setIsPlaying(true);
    setProgress(0);
  };

  const handleNext = () => {
    if (!isLastScene) {
      setCurrentSceneIndex((prev) => prev + 1);
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setCurrentSceneIndex(0);
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSceneSelect = (index) => {
    setCurrentSceneIndex(index);
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="vector-story-mode">
      {/* Header */}
      <div className="story-header">
        <button className="back-button" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="story-title">
          <h2>{problem.title}</h2>
          <p>{problem.description}</p>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="canvas-container">
        <VectorCanvas
          scene={currentScene}
          isPlaying={isPlaying}
          progress={progress}
        />

        {/* Narration Box */}
        {currentScene?.narration && (
          <div className="narration-box">
            <p>{currentScene.narration}</p>
          </div>
        )}

        {/* Calculation Display */}
        {currentScene?.calculation && (
          <div className="calculation-box">
            <p>{currentScene.calculation}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="scene-indicator">
          {currentSceneIndex + 1} / {scenes.length}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="control-button"
          onClick={handlePrevious}
          disabled={currentSceneIndex === 0}
        >
          ⏮ 이전
        </button>

        <button
          className={`control-button play-button ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isPlaying}
        >
          {isPlaying ? '▶ 재생 중...' : '▶ 재생'}
        </button>

        <button
          className="control-button"
          onClick={handleNext}
          disabled={isLastScene}
        >
          다음 ⏭
        </button>
      </div>

      {/* Scene Navigation */}
      <div className="scene-navigation">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            className={`scene-dot ${index === currentSceneIndex ? 'active' : ''} ${index < currentSceneIndex ? 'completed' : ''}`}
            onClick={() => handleSceneSelect(index)}
            title={`장면 ${index + 1}`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      {isLastScene && !isPlaying && (
        <div className="action-buttons">
          <button className="action-button replay" onClick={handleReset}>
            🔄 처음부터 다시보기
          </button>
          <button className="action-button complete" onClick={onBack}>
            ✓ 완료하고 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default VectorStoryMode;
