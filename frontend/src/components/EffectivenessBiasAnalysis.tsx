import React, { useState } from 'react';
import { BiasAnalysisService } from '../services/api';
import './Analysis.css';

const EffectivenessBiasAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await BiasAnalysisService.analyzeEffectivenessBias({
        analysis_type: 'effectiveness',
      });
      setResults(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-container">
      <h2>✅ Effectiveness Bias Analysis</h2>
      <p className="description">
        Identifies which tools are most/least effective and variance in effectiveness.
        Ranks tools based on success rates and consistency.
      </p>

      <button className="analyze-btn" onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : '▶ Run Effectiveness Analysis'}
      </button>

      {error && <div className="error-message">❌ {error}</div>}

      {results && (
        <div className="results">
          <div className="summary-card">
            <h3>Summary</h3>
            <p>{results.summary}</p>
          </div>

          {results.statistical_significance && (
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Effectiveness Variance</h4>
                <div className="metric-value">
                  {results.results.variance?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="metric-card">
                <h4>Bias Score</h4>
                <div className="metric-value">
                  {results.statistical_significance.bias_score?.toFixed(1)}/100
                </div>
              </div>
            </div>
          )}

          {results.results.most_effective && results.results.most_effective.length > 0 && (
            <div className="tools-list">
              <h3>🏆 Most Effective Tools</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Avg Success Rate</th>
                    <th>Effectiveness Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.most_effective.map((tool: any, idx: number) => (
                    <tr key={idx}>
                      <td>{tool.tool_name}</td>
                      <td>{tool.avg_success_rate?.toFixed(1)}%</td>
                      <td>{tool.effectiveness_score?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.results.least_effective && results.results.least_effective.length > 0 && (
            <div className="tools-list">
              <h3>⚠ Least Effective Tools</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Avg Success Rate</th>
                    <th>Effectiveness Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.least_effective.map((tool: any, idx: number) => (
                    <tr key={idx}>
                      <td>{tool.tool_name}</td>
                      <td>{tool.avg_success_rate?.toFixed(1)}%</td>
                      <td>{tool.effectiveness_score?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.recommendations && results.recommendations.length > 0 && (
            <div className="recommendations">
              <h3>💡 Recommendations</h3>
              <ul>
                {results.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EffectivenessBiasAnalysis;
