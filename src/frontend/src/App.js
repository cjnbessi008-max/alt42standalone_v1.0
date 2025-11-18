import React, { useState, useEffect } from 'react';
import './styles/App.css';
import SmartphoneScreen from './components/SmartphoneScreen';
import ControlPanel from './components/ControlPanel';
import StatusBar from './components/StatusBar';
import apiService from './services/apiService';

function App() {
  const [expansionMode, setExpansionMode] = useState('time-based'); // time-based, progress-based, hybrid
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentSize, setCurrentSize] = useState(180);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [config, setConfig] = useState(null);

  // Load configuration and questions on mount
  useEffect(() => {
    loadConfiguration();
    loadQuestions();
  }, []);

  // Expansion animation loop
  useEffect(() => {
    if (!isActive || !config) return;

    const interval = setInterval(() => {
      updateExpansion();
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isActive, config, expansionMode, progress, startTime]);

  const loadConfiguration = async () => {
    try {
      const cfg = await apiService.getExpansionConfig();
      setConfig(cfg);
      setCurrentSize(cfg.startSize);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Use default config
      setConfig({
        duration: 300000,
        startSize: 180,
        endSize: 400,
        expansionRate: 'progressive',
        triggerType: 'time-based'
      });
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await apiService.getQuestions(1); // Quiz ID = 1
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    }
  };

  const updateExpansion = async () => {
    try {
      const result = await apiService.calculateExpansion({
        startTime,
        currentTime: Date.now(),
        progressPercentage: progress,
        mode: expansionMode
      });

      setCurrentSize(result.currentSize);

      if (result.isFullyExpanded && isActive) {
        handleExpansionComplete();
      }
    } catch (error) {
      console.error('Failed to calculate expansion:', error);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setProgress(0);
    setCurrentQuestionIndex(0);
    setCurrentSize(config?.startSize || 180);
  };

  const handleStop = () => {
    setIsActive(false);
    setStartTime(null);
  };

  const handleReset = () => {
    setIsActive(false);
    setStartTime(null);
    setProgress(0);
    setCurrentQuestionIndex(0);
    setCurrentSize(config?.startSize || 180);
  };

  const handleAnswerSubmit = async (answer) => {
    if (!questions[currentQuestionIndex]) return;

    try {
      const result = await apiService.submitAnswer(
        questions[currentQuestionIndex].id,
        answer,
        'user123' // Would be actual user ID in production
      );

      // Update progress based on correct answers
      if (result.correct) {
        const newProgress = ((currentQuestionIndex + 1) / questions.length) * 100;
        setProgress(newProgress);
      }

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleExpansionComplete();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleExpansionComplete = () => {
    setIsActive(false);
    alert('🎉 Expansion Mode Complete! 축하합니다!');
  };

  return (
    <div className="App">
      <StatusBar
        isActive={isActive}
        progress={progress}
        currentSize={currentSize}
        maxSize={config?.endSize || 400}
        mode={expansionMode}
      />

      <div className="main-content">
        <ControlPanel
          isActive={isActive}
          expansionMode={expansionMode}
          onModeChange={setExpansionMode}
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          config={config}
        />
      </div>

      <SmartphoneScreen
        size={currentSize}
        isActive={isActive}
        question={questions[currentQuestionIndex]}
        onAnswerSubmit={handleAnswerSubmit}
        progress={progress}
      />
    </div>
  );
}

export default App;
