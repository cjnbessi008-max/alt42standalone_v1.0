import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CorrespondenceLines from '../components/CorrespondenceLines/CorrespondenceLines';
import FeedbackModal from '../components/FeedbackModal/FeedbackModal';
import { problemApi } from '../api/problemApi';
import { Problem, Connection, InteractionEvent, SubmitAnswerResponse } from '../types';

const ProblemPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);

  // Mock student ID (in production, this would come from authentication)
  const studentId = '550e8400-e29b-41d4-a716-446655440001';

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!problemId) {
        throw new Error('Problem ID is required');
      }

      const data = await problemApi.getProblemById(problemId, true);
      setProblem(data);
    } catch (err) {
      console.error('Error loading problem:', err);
      setError('Failed to load problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    connections: Connection[],
    timeSpent: number,
    interactions: InteractionEvent[]
  ) => {
    if (!problem) return;

    try {
      setSubmitting(true);

      const response = await problemApi.submitAnswer({
        student_id: studentId,
        problem_id: problem.id,
        connections,
        time_spent_seconds: timeSpent,
        interaction_sequence: interactions,
      });

      setResult(response);
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    loadProblem(); // Reload with new randomization
  };

  const handleCloseFeedback = () => {
    setResult(null);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        Loading problem...
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: '#F44336' }}>
          {error || 'Problem not found'}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#4A90E2',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #E0E0E0',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            Correspondence Lines
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '24px 0' }}>
        <CorrespondenceLines
          problem={problem}
          onSubmit={handleSubmit}
          disabled={submitting}
        />
      </main>

      {/* Feedback modal */}
      <FeedbackModal
        result={result}
        onClose={handleCloseFeedback}
        onRetry={result?.can_retry ? handleRetry : undefined}
      />
    </div>
  );
};

export default ProblemPage;
