/**
 * Complete usage example demonstrating timeline tracking integration
 */

import React, { useState } from 'react';
import { useTimelineTracking } from '../hooks/useTimelineTracking';

interface FractionProblem {
  id: string;
  numerator1: number;
  denominator1: number;
  numerator2: number;
  denominator2: number;
  operation: 'add' | 'subtract';
}

export function FractionPracticeExample() {
  const [studentId] = useState('student-123');
  const [moduleId] = useState('fractions-module');
  const [problem] = useState<FractionProblem>({
    id: 'problem-456',
    numerator1: 1,
    denominator1: 2,
    numerator2: 1,
    denominator2: 3,
    operation: 'add'
  });

  const [answerNumerator, setAnswerNumerator] = useState('');
  const [answerDenominator, setAnswerDenominator] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Initialize timeline tracking
  const { trackEvent, sessionId } = useTimelineTracking({
    studentId,
    moduleId,
    problemId: problem.id
  });

  // Track input changes
  const handleNumeratorChange = (value: string) => {
    trackEvent('input_changed', {
      field: 'numerator',
      previous_value: answerNumerator,
      new_value: value,
      problem_id: problem.id
    });
    setAnswerNumerator(value);
  };

  const handleDenominatorChange = (value: string) => {
    trackEvent('input_changed', {
      field: 'denominator',
      previous_value: answerDenominator,
      new_value: value,
      problem_id: problem.id
    });
    setAnswerDenominator(value);
  };

  // Track hint request
  const handleHintRequest = () => {
    trackEvent('hint_requested', {
      hint_number: 1,
      problem_id: problem.id,
      current_answer: {
        numerator: answerNumerator,
        denominator: answerDenominator
      }
    });
    setShowHint(true);
  };

  // Track UI interactions
  const handleVisualizationClick = (section: string) => {
    trackEvent('interaction', {
      interaction_type: 'visualization_click',
      section,
      problem_id: problem.id
    });
  };

  // Track answer submission
  const handleSubmit = () => {
    const answer = {
      numerator: parseInt(answerNumerator),
      denominator: parseInt(answerDenominator)
    };

    // First, track the submission
    trackEvent('answer_submitted', {
      answer,
      problem_id: problem.id,
      hints_used: showHint ? 1 : 0,
      timestamp: new Date().toISOString()
    });

    // Validate answer (simplified logic)
    const isCorrect = validateAnswer(answer);

    // Track validation result
    trackEvent('answer_validated', {
      answer,
      is_correct: isCorrect,
      problem_id: problem.id,
      timestamp: new Date().toISOString()
    });

    // If correct, mark problem as completed
    if (isCorrect) {
      trackEvent('problem_completed', {
        problem_id: problem.id,
        final_answer: answer,
        hints_used: showHint ? 1 : 0,
        timestamp: new Date().toISOString()
      });
      alert('Correct! Great job!');
    } else {
      alert('Not quite right. Try again!');
    }
  };

  // Simplified validation
  const validateAnswer = (answer: { numerator: number; denominator: number }) => {
    // For 1/2 + 1/3 = 5/6
    return answer.numerator === 5 && answer.denominator === 6;
  };

  return (
    <div className="fraction-practice">
      <h2>Fraction Addition Practice</h2>

      <div className="problem">
        <div className="fraction-display">
          <div className="fraction" onClick={() => handleVisualizationClick('fraction1')}>
            <span className="numerator">{problem.numerator1}</span>
            <span className="line">—</span>
            <span className="denominator">{problem.denominator1}</span>
          </div>

          <span className="operation">{problem.operation === 'add' ? '+' : '-'}</span>

          <div className="fraction" onClick={() => handleVisualizationClick('fraction2')}>
            <span className="numerator">{problem.numerator2}</span>
            <span className="line">—</span>
            <span className="denominator">{problem.denominator2}</span>
          </div>

          <span className="equals">=</span>

          <div className="fraction answer">
            <input
              type="number"
              className="numerator-input"
              value={answerNumerator}
              onChange={(e) => handleNumeratorChange(e.target.value)}
              placeholder="?"
            />
            <span className="line">—</span>
            <input
              type="number"
              className="denominator-input"
              value={answerDenominator}
              onChange={(e) => handleDenominatorChange(e.target.value)}
              placeholder="?"
            />
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={handleHintRequest}>💡 Get Hint</button>
        <button onClick={handleSubmit} disabled={!answerNumerator || !answerDenominator}>
          Submit Answer
        </button>
      </div>

      {showHint && (
        <div className="hint-box">
          <strong>Hint:</strong> To add fractions, first find a common denominator.
          For 1/2 and 1/3, the common denominator is 6.
        </div>
      )}

      <div className="session-info">
        <small>Session ID: {sessionId}</small>
      </div>
    </div>
  );
}

/**
 * Example of displaying student progress
 */
export function StudentProgressExample() {
  const [studentId] = useState('student-123');
  const [moduleId] = useState('fractions-module');

  return (
    <div>
      <h2>Student Progress</h2>
      {/* This would import and use the StudentProgressDashboard component */}
      <div className="progress-placeholder">
        <p>Student: {studentId}</p>
        <p>Module: {moduleId}</p>
        <p>(StudentProgressDashboard component would be rendered here)</p>
      </div>
    </div>
  );
}

/**
 * Example of timeline visualization for teachers
 */
export function TimelineViewExample() {
  const [sessionId, setSessionId] = useState('');

  return (
    <div>
      <h2>View Session Timeline</h2>
      <input
        type="text"
        placeholder="Enter session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
      />
      {sessionId && (
        <div className="timeline-placeholder">
          <p>Timeline for session: {sessionId}</p>
          <p>(TimelineVisualization component would be rendered here)</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example of LMS data export
 */
export function LMSExportExample() {
  const [studentId, setStudentId] = useState('student-123');
  const [moduleId, setModuleId] = useState('fractions-module');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const handleExport = async () => {
    try {
      const { lmsApi } = await import('../services/api');
      const data = await lmsApi.exportData(studentId, moduleId, {
        exportType: 'timeline',
        format: exportFormat
      });

      // Download the data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${studentId}_${moduleId}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      alert('Export completed!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Export to LMS</h2>
      <div className="export-form">
        <label>
          Student ID:
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </label>
        <label>
          Module ID:
          <input
            type="text"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          />
        </label>
        <label>
          Format:
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </label>
        <button onClick={handleExport}>Export Data</button>
      </div>
    </div>
  );
}

export default FractionPracticeExample;
