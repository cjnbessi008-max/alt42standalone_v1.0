import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PracticeProgressIndicator from '../components/PracticeProgressIndicator';
import ProblemDisplay from '../components/ProblemDisplay';
import AnswerInputForm from '../components/AnswerInputForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import PracticeMoreModal from '../components/PracticeMoreModal';
import socketService from '../services/socket';
import {
  fetchNextProblem,
  submitAnswer,
  fetchPracticeSuggestion,
  startPracticeMore,
  requestHint,
  fetchProgress,
  setCurrentModule,
  clearFeedback,
  hidePracticeModal,
  incrementHints,
} from '../store/practiceSlice';
import './StudentPracticeView.css';

/**
 * Student Practice View - Main practice interface
 */
const StudentPracticeView = () => {
  const { moduleId } = useParams();
  const dispatch = useDispatch();

  const {
    currentProblem,
    currentProgress,
    feedbackMessage,
    practiceSuggestion,
    showPracticeMoreModal,
    loading,
    error,
    hintsUsed,
  } = useSelector((state) => state.practice);

  const [attemptNumber, setAttemptNumber] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Initialize module and fetch first problem
  useEffect(() => {
    dispatch(setCurrentModule({ id: moduleId }));
    dispatch(fetchNextProblem(moduleId));
    dispatch(fetchProgress(moduleId));
    dispatch(fetchPracticeSuggestion(moduleId));

    // Connect WebSocket
    const studentId = localStorage.getItem('student_id');
    if (studentId) {
      socketService.connect(studentId);

      // Listen for progress updates
      socketService.on('progress:updated', (data) => {
        console.log('Progress updated:', data);
        dispatch(fetchProgress(moduleId));
      });

      socketService.on('mastery:achieved', (data) => {
        console.log('Mastery achieved!', data);
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, [moduleId, dispatch]);

  // Timer for tracking time spent on problem
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentProblem]);

  // Handle answer submission
  const handleSubmitAnswer = (answer) => {
    setAttemptNumber((prev) => prev + 1);

    dispatch(
      submitAnswer({
        moduleId,
        data: {
          problemId: currentProblem.id,
          answer,
          timeSpent,
          hintsUsed,
        },
      })
    );
  };

  // Handle next problem
  const handleNextProblem = () => {
    dispatch(clearFeedback());
    dispatch(fetchNextProblem(moduleId));
    setTimeSpent(0);
    setAttemptNumber(0);
  };

  // Handle retry
  const handleRetry = () => {
    dispatch(clearFeedback());
  };

  // Handle practice more
  const handlePracticeMore = () => {
    dispatch(startPracticeMore(moduleId));
    setTimeSpent(0);
    setAttemptNumber(0);
  };

  // Handle hint request
  const handleRequestHint = (currentAnswer) => {
    dispatch(incrementHints());
    dispatch(
      requestHint({
        moduleId,
        data: {
          problemId: currentProblem.id,
          currentAnswer,
        },
      })
    );
  };

  // Handle decline practice more
  const handleDeclinePracticeMore = () => {
    dispatch(hidePracticeModal());
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="student-practice-view">
      <div className="practice-container">
        {/* Left Column - Problem Display */}
        <div className="problem-column">
          <ProblemDisplay problem={currentProblem} attemptNumber={attemptNumber} />

          <AnswerInputForm
            problemType={currentProblem?.type || 'text'}
            onSubmit={handleSubmitAnswer}
            onRequestHint={handleRequestHint}
            hintsUsed={hintsUsed}
            loading={loading}
          />

          <FeedbackDisplay
            feedback={feedbackMessage}
            onNext={handleNextProblem}
            onRetry={handleRetry}
          />
        </div>

        {/* Right Column - Progress Indicator */}
        <div className="progress-column">
          <PracticeProgressIndicator
            progress={currentProgress}
            onPracticeMore={() => dispatch(fetchPracticeSuggestion(moduleId))}
          />
        </div>
      </div>

      {/* Practice More Modal */}
      <PracticeMoreModal
        show={showPracticeMoreModal}
        suggestion={practiceSuggestion}
        onAccept={handlePracticeMore}
        onDecline={handleDeclinePracticeMore}
      />
    </div>
  );
};

export default StudentPracticeView;
