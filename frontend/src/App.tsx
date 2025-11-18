/**
 * Main App Component
 * Integrates derivative graph visualization with virtual smartphone display
 */

import React, { useState, useEffect } from 'react';
import DerivativeGraph from '@/components/math-visualization/DerivativeGraph';
import SmartphoneScreen from '@/components/virtual-display/SmartphoneScreen';
import derivativeApi from '@/services/api';
import type { GraphData } from '@/types/derivative';
import './App.css';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [functionInput, setFunctionInput] = useState('x**3 - 3*x**2 + 2*x + 1');
  const [maxOrder, setMaxOrder] = useState(3);
  const [domainMin, setDomainMin] = useState(-2);
  const [domainMax, setDomainMax] = useState(4);
  const [colorScheme, setColorScheme] = useState('professional');
  const [visibleOrders, setVisibleOrders] = useState<number[]>([0, 1, 2, 3]);

  // Load graph on component mount
  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await derivativeApi.generateGraph({
        function: functionInput,
        max_order: maxOrder,
        domain_min: domainMin,
        domain_max: domainMax,
        color_scheme: colorScheme,
        visible_orders: visibleOrders,
      });

      setGraphData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load graph');
      console.error('Error loading graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGraph();
  };

  const toggleOrder = (order: number) => {
    setVisibleOrders((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order].sort()
    );
  };

  return (
    <div className="app">
      {/* Main content area */}
      <div className="main-content">
        <header className="app-header">
          <h1>Higher Derivative Lines</h1>
          <p>Visualize functions and their derivatives with different line styles</p>
        </header>

        {/* Control panel */}
        <div className="control-panel">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="function-input">Function:</label>
              <input
                id="function-input"
                type="text"
                value={functionInput}
                onChange={(e) => setFunctionInput(e.target.value)}
                placeholder="e.g., x**3 - 3*x**2 + 2*x + 1"
                className="input-field"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max-order">Max Order:</label>
                <input
                  id="max-order"
                  type="number"
                  value={maxOrder}
                  onChange={(e) => setMaxOrder(parseInt(e.target.value))}
                  min="1"
                  max="5"
                  className="input-field-small"
                />
              </div>

              <div className="form-group">
                <label htmlFor="domain-min">Domain Min:</label>
                <input
                  id="domain-min"
                  type="number"
                  value={domainMin}
                  onChange={(e) => setDomainMin(parseFloat(e.target.value))}
                  step="0.5"
                  className="input-field-small"
                />
              </div>

              <div className="form-group">
                <label htmlFor="domain-max">Domain Max:</label>
                <input
                  id="domain-max"
                  type="number"
                  value={domainMax}
                  onChange={(e) => setDomainMax(parseFloat(e.target.value))}
                  step="0.5"
                  className="input-field-small"
                />
              </div>

              <div className="form-group">
                <label htmlFor="color-scheme">Color Scheme:</label>
                <select
                  id="color-scheme"
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className="input-field-small"
                >
                  <option value="professional">Professional</option>
                  <option value="vibrant">Vibrant</option>
                  <option value="pastel">Pastel</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="colorblind_friendly">Colorblind Friendly</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Visible Derivatives:</label>
              <div className="checkbox-group">
                {[0, 1, 2, 3, 4].slice(0, maxOrder + 1).map((order) => (
                  <label key={order} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={visibleOrders.includes(order)}
                      onChange={() => toggleOrder(order)}
                    />
                    <span>
                      {order === 0
                        ? 'f(x)'
                        : order === 1
                        ? "f'(x)"
                        : order === 2
                        ? "f''(x)"
                        : order === 3
                        ? "f'''(x)"
                        : `f⁽${order}⁾(x)`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Loading...' : 'Generate Graph'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h3>How to use:</h3>
          <ul>
            <li>Enter a mathematical function using Python syntax (e.g., x**2 for x²)</li>
            <li>Adjust the maximum derivative order and domain range</li>
            <li>Toggle which derivatives to display using checkboxes</li>
            <li>Each derivative order has a unique line style:
              <ul>
                <li><strong>f(x)</strong>: Solid line (thick)</li>
                <li><strong>f'(x)</strong>: Dashed line</li>
                <li><strong>f''(x)</strong>: Dotted line</li>
                <li><strong>f'''(x)</strong>: Dash-dot line</li>
                <li><strong>Higher orders</strong>: Various patterns</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Virtual smartphone screen (bottom-right) */}
      {graphData && (
        <SmartphoneScreen
          position="bottom-right"
          size="large"
          showFrame={true}
          title="Derivative Visualization"
        >
          <div style={{ padding: '16px' }}>
            <DerivativeGraph
              graphData={graphData}
              height={600}
              showLegend={true}
              showGrid={true}
              interactive={true}
            />
          </div>
        </SmartphoneScreen>
      )}
    </div>
  );
};

export default App;
