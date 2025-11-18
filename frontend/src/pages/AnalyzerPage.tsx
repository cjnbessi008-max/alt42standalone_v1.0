/**
 * Main Analyzer Page
 */
import React, { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import AnalysisResults from '../components/AnalysisResults';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import '../styles/AnalyzerPage.css';

const EXAMPLE_CODE = `<?php
// Example PHP code with inefficient loops
function processData($users) {
    $result = "";

    // Issue 1: String concatenation in loop
    for ($i = 0; $i < count($users); $i++) {
        $result .= $users[$i]['name'] . ",";
    }

    // Issue 2: Nested loops with database query
    foreach ($users as $user) {
        foreach ($user['orders'] as $order) {
            // Database query in loop (N+1 problem)
            $product = mysql_query("SELECT * FROM products WHERE id = " . $order['product_id']);

            // Issue 3: Loop invariant calculation
            $tax_rate = 0.08;
            $discount = calculateDiscount(); // This doesn't change!
            $total = $order['price'] * (1 + $tax_rate) * (1 - $discount);
        }
    }

    return $result;
}
?>`;

const AnalyzerPage: React.FC = () => {
  const [code, setCode] = useState<string>(EXAMPLE_CODE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await apiService.analyzeCode({ code });
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || 'Error analyzing code. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setAnalysisResult(null);
    setError(null);
  };

  const handleLoadExample = () => {
    setCode(EXAMPLE_CODE);
    setAnalysisResult(null);
  };

  return (
    <div className="analyzer-page">
      <header className="page-header">
        <h1>🔍 PHP Loop Inefficiency Detector</h1>
        <p>Analyze your PHP code for performance issues and get optimization suggestions</p>
      </header>

      <div className="analyzer-container">
        <div className="editor-section">
          <div className="editor-header">
            <h2>Code Editor</h2>
            <div className="editor-actions">
              <button onClick={handleLoadExample} className="btn btn-secondary">
                Load Example
              </button>
              <button onClick={handleClear} className="btn btn-secondary">
                Clear
              </button>
              <button
                onClick={handleAnalyze}
                className="btn btn-primary"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
              </button>
            </div>
          </div>

          <CodeEditor code={code} onChange={setCode} height="600px" />

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="results-section">
            <AnalysisResults result={analysisResult} />
          </div>
        )}

        {!analysisResult && !isAnalyzing && (
          <div className="instructions">
            <h3>How to use:</h3>
            <ol>
              <li>Write or paste your PHP code in the editor above</li>
              <li>Click "Analyze Code" to detect inefficient patterns</li>
              <li>Review the results and optimization suggestions</li>
              <li>Apply the recommended changes to improve performance</li>
            </ol>

            <h3>What we detect:</h3>
            <ul>
              <li>🔄 Loop-invariant calculations (computations that don't change)</li>
              <li>🔗 Deeply nested loops (O(n²) or worse complexity)</li>
              <li>💾 Database queries inside loops (N+1 problem)</li>
              <li>📞 Redundant function calls with same arguments</li>
              <li>📝 Inefficient string concatenation in loops</li>
              <li>🔍 Inefficient array search operations</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzerPage;
