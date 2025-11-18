/**
 * Analysis Results Display Component
 */
import React from 'react';
import { AnalysisResult, InefficientDetection } from '../types';
import '../styles/AnalysisResults.css';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  const groupedIssues = result.inefficiencies.reduce((acc, issue) => {
    const type = issue.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(issue);
    return acc;
  }, {} as Record<string, InefficientDetection[]>);

  return (
    <div className="analysis-results">
      <h2>Analysis Results</h2>

      {/* Score Card */}
      <div className="score-card" style={{ borderColor: getScoreColor(result.efficiency_score) }}>
        <div className="score-main">
          <div className="score-value" style={{ color: getScoreColor(result.efficiency_score) }}>
            {result.efficiency_score.toFixed(1)}
          </div>
          <div className="score-label">Efficiency Score</div>
        </div>
        <div className="score-details">
          <div>Total Loops: {result.total_loops}</div>
          <div>Inefficient: {result.inefficient_loops}</div>
          <div>Analysis Time: {result.analysis_duration_ms}ms</div>
        </div>
      </div>

      {/* Issue Summary */}
      <div className="issue-summary">
        <div className="issue-stat critical">
          <div className="stat-value">{result.critical_issues}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="issue-stat warning">
          <div className="stat-value">{result.warning_issues}</div>
          <div className="stat-label">Warnings</div>
        </div>
        <div className="issue-stat info">
          <div className="stat-value">{result.info_issues}</div>
          <div className="stat-label">Info</div>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommendations</h3>
          <ul>
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Inefficiencies */}
      {result.total_issues > 0 && (
        <div className="inefficiencies">
          <h3>Detected Issues ({result.total_issues})</h3>

          {Object.entries(groupedIssues).map(([type, issues]) => (
            <div key={type} className="issue-group">
              <h4 className="issue-type-header">
                {type.replace(/_/g, ' ').toUpperCase()} ({issues.length})
              </h4>

              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="issue-card"
                  style={{ borderLeftColor: getSeverityColor(issue.severity) }}
                >
                  <div className="issue-header">
                    <span className={`severity-badge ${issue.severity}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="line-number">Line {issue.line_number}</span>
                  </div>

                  <div className="issue-message">{issue.message}</div>

                  {issue.code_snippet && (
                    <pre className="code-snippet">
                      <code>{issue.code_snippet}</code>
                    </pre>
                  )}

                  <div className="issue-suggestion">
                    <strong>💡 Suggestion:</strong> {issue.suggestion}
                  </div>

                  <div className="complexity-comparison">
                    <div className="complexity-before">
                      <strong>Before:</strong> {issue.estimated_complexity_before}
                    </div>
                    <span className="arrow">→</span>
                    <div className="complexity-after">
                      <strong>After:</strong> {issue.estimated_complexity_after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {result.total_issues === 0 && (
        <div className="no-issues">
          <h3>✅ Excellent!</h3>
          <p>No inefficiency patterns detected in your code.</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
