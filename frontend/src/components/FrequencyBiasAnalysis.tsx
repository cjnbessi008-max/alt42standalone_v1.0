import React, { useState } from 'react';
import { BiasAnalysisService } from '../services/api';
import './Analysis.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FrequencyBiasAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await BiasAnalysisService.analyzeFrequencyBias({
        analysis_type: 'frequency',
        use_cache: false,
      });
      setResults(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Please ensure there is data in the system.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = results?.results?.tool_usage ? {
    labels: results.results.tool_usage.map((t: any) => t.tool_name),
    datasets: [
      {
        label: 'Usage Count',
        data: results.results.tool_usage.map((t: any) => t.usage_count),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tool Usage Distribution',
      },
    },
  };

  return (
    <div className="analysis-container">
      <h2>📊 Usage Frequency Bias Analysis</h2>
      <p className="description">
        Identifies tools that are over-used or under-used compared to uniform distribution.
        Uses chi-square test and diversity metrics (Shannon entropy, Gini coefficient).
      </p>

      <button
        className="analyze-btn"
        onClick={runAnalysis}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : '▶ Run Frequency Analysis'}
      </button>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

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
                  {results.statistical_significance.bias_score?.toFixed(1) || 'N/A'}/100
                </div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{
                      width: `${results.statistical_significance.bias_score || 0}%`,
                      backgroundColor: results.statistical_significance.bias_score > 70 ? '#f44336' :
                                     results.statistical_significance.bias_score > 40 ? '#ff9800' : '#4caf50'
                    }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <h4>Diversity Index</h4>
                <div className="metric-value">
                  {(results.results.statistical_tests?.normalized_diversity * 100)?.toFixed(1) || 'N/A'}%
                </div>
              </div>

              <div className="metric-card">
                <h4>Gini Coefficient</h4>
                <div className="metric-value">
                  {results.statistical_significance.gini_coefficient?.toFixed(3) || 'N/A'}
                </div>
              </div>

              <div className="metric-card">
                <h4>P-Value</h4>
                <div className="metric-value">
                  {results.statistical_significance.p_value?.toFixed(4) || 'N/A'}
                </div>
                <small>{results.results.statistical_tests?.is_significant ? 'Significant' : 'Not significant'}</small>
              </div>
            </div>
          )}

          {chartData && (
            <div className="chart-container">
              <Bar data={chartData} options={chartOptions} />
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

          {results.results.over_used_tools && results.results.over_used_tools.length > 0 && (
            <div className="tools-list">
              <h3>⬆ Over-Used Tools</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Usage Count</th>
                    <th>Percentage</th>
                    <th>Z-Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.over_used_tools.map((tool: any, idx: number) => (
                    <tr key={idx}>
                      <td>{tool.tool_name}</td>
                      <td>{tool.usage_count}</td>
                      <td>{tool.usage_percentage}%</td>
                      <td>{tool.z_score?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.results.under_used_tools && results.results.under_used_tools.length > 0 && (
            <div className="tools-list">
              <h3>⬇ Under-Used Tools</h3>
              <table>
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Usage Count</th>
                    <th>Percentage</th>
                    <th>Z-Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.under_used_tools.map((tool: any, idx: number) => (
                    <tr key={idx}>
                      <td>{tool.tool_name}</td>
                      <td>{tool.usage_count}</td>
                      <td>{tool.usage_percentage}%</td>
                      <td>{tool.z_score?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FrequencyBiasAnalysis;
