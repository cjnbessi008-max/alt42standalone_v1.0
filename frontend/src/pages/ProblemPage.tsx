/**
 * Problem Page Component
 * Displays a problem with AI-generated mistake warnings
 */
import React, { useEffect, useState } from 'react';
import MistakeWarningAlert from '../components/MistakeWarningAlert';
import { MistakeWarning, Problem, WarningCheckResponse } from '../types';
import apiService from '../services/api';
import './ProblemPage.css';

interface ProblemPageProps {
  studentId: string;
  problem: Problem;
  onSubmit: (answer: any) => void;
}

const ProblemPage: React.FC<ProblemPageProps> = ({
  studentId,
  problem,
  onSubmit,
}) => {
  const [warnings, setWarnings] = useState<MistakeWarning[]>([]);
  const [recommendedFocusAreas, setRecommendedFocusAreas] = useState<string[]>([]);
  const [answer, setAnswer] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    checkForWarnings();
  }, [problem.id]);

  const checkForWarnings = async () => {
    try {
      setLoading(true);
      const response: WarningCheckResponse = await apiService.checkWarnings({
        student_id: studentId,
        problem_id: problem.id,
        problem_content: problem.content,
      });

      if (response.has_warnings) {
        setWarnings(response.warnings);
        setRecommendedFocusAreas(response.recommended_focus_areas);
      }
    } catch (error) {
      console.error('Failed to check warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissWarning = async (warningId: string) => {
    try {
      await apiService.dismissWarning(warningId);
      setWarnings(warnings.filter((w) => w.id !== warningId));
    } catch (error) {
      console.error('Failed to dismiss warning:', error);
    }
  };

  const handleSubmit = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await apiService.submitAttempt({
        student_id: studentId,
        problem_id: problem.id,
        module_id: problem.module_id,
        submitted_answer: answer,
        time_spent_seconds: timeSpent,
      });

      onSubmit(answer);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  return (
    <div className="problem-page">
      {!loading && warnings.length > 0 && (
        <MistakeWarningAlert
          warnings={warnings}
          onDismiss={handleDismissWarning}
          recommendedFocusAreas={recommendedFocusAreas}
        />
      )}

      <div className="problem-container">
        <div className="problem-header">
          <span className="problem-type">{problem.problem_type}</span>
          <span className="problem-difficulty">
            난이도: {'⭐'.repeat(problem.difficulty_level)}
          </span>
        </div>

        <div className="problem-content">
          <h2>문제</h2>
          {renderProblemContent(problem.content)}
        </div>

        <div className="answer-section">
          <h3>답안 입력</h3>
          <textarea
            className="answer-input"
            value={JSON.stringify(answer, null, 2)}
            onChange={(e) => {
              try {
                setAnswer(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder="답안을 JSON 형식으로 입력하세요"
            rows={6}
          />
        </div>

        <button onClick={handleSubmit} className="submit-button">
          제출하기
        </button>
      </div>
    </div>
  );
};

// Helper function to render problem content
function renderProblemContent(content: Record<string, any>): React.ReactNode {
  return (
    <div className="problem-details">
      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="problem-field">
          <strong>{key}:</strong>{' '}
          <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
        </div>
      ))}
    </div>
  );
}

export default ProblemPage;
