import React, { useState } from 'react';
import { BiasAnalysisService } from '../services/api';
import './Analysis.css';

const DemographicBiasAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await BiasAnalysisService.analyzeDemographicBias({
        analysis_type: 'demographic',
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
      <h2>👥 Demographic Bias Analysis</h2>
      <p className="description">
        Identifies if tools are equally effective across different student demographics
        (grade level, performance level). Uses ANOVA for statistical significance testing.
      </p>

      <button className="analyze-btn" onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : '▶ Run Demographic Analysis'}
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
                <h4>Bias Score</h4>
                <div className="metric-value">
                  {results.statistical_significance.bias_score?.toFixed(1)}/100
                </div>
              </div>
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

export default DemographicBiasAnalysis;
