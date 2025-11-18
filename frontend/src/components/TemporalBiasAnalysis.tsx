import React, { useState } from 'react';
import { BiasAnalysisService } from '../services/api';
import './Analysis.css';

const TemporalBiasAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await BiasAnalysisService.analyzeTemporalBias({
        analysis_type: 'temporal',
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
      <h2>⏰ Temporal Bias Analysis</h2>
      <p className="description">
        Identifies if certain tools are only used at specific times of day or days of week.
        Analyzes temporal concentration patterns.
      </p>

      <button className="analyze-btn" onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : '▶ Run Temporal Analysis'}
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
                <h4>Temporal Concentration</h4>
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

export default TemporalBiasAnalysis;
